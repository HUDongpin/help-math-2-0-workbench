import AppKit
import AVFoundation
import CoreImage
import CoreMedia
import CryptoKit
import Foundation
import ImageIO
import ScreenCaptureKit
import UniformTypeIdentifiers

// Cropping the native 800x628 window at y=28 removes the title bar while
// retaining the stage's native window mask: a three-pixel right/bottom edge
// plus the 19-pixel bottom-corner transition after output downsampling.
private let nativeWindowEdgeAlphaMaskExtent = 3
private let nativeBottomCornerAlphaMaskExtent = 19

private enum CaptureError: Error, CustomStringConvertible {
    case usage(String)
    case invariant(String)

    var description: String {
        switch self {
        case .usage(let message), .invariant(let message): return message
        }
    }
}

private struct Options {
    enum Mode { case help, list, listDisplays, capture }
    var mode: Mode = .help
    var ownerName: String?
    var processID: pid_t?
    var titleContains: String?
    var windowID: CGWindowID?
    var displayID: CGDirectDisplayID?
    var outputDirectory: URL?
    var fps: Int = 12
    var durationSeconds: Double?
    var waitForProcessSeconds: Double = 0
    var minimumWindowWidth: Int = 1
    var minimumWindowHeight: Int = 1
    var sourceRect: CGRect?
    var outputWidth: Int = 800
    var outputHeight: Int = 600

    static func parse(_ arguments: [String]) throws -> Options {
        var options = Options()
        var index = 0
        func value(after flag: String) throws -> String {
            index += 1
            guard index < arguments.count else { throw CaptureError.usage("missing value after \(flag)") }
            return arguments[index]
        }
        while index < arguments.count {
            let argument = arguments[index]
            switch argument {
            case "--help", "-h": options.mode = .help
            case "--list": options.mode = .list
            case "--list-displays": options.mode = .listDisplays
            case "--capture": options.mode = .capture
            case "--owner": options.ownerName = try value(after: argument)
            case "--pid":
                guard let value = Int32(try value(after: argument)), value > 0 else { throw CaptureError.usage("--pid must be a positive process ID") }
                options.processID = value
            case "--title-contains": options.titleContains = try value(after: argument)
            case "--window-id":
                guard let value = UInt32(try value(after: argument)) else { throw CaptureError.usage("--window-id must be an unsigned integer") }
                options.windowID = CGWindowID(value)
            case "--display-id":
                guard let value = UInt32(try value(after: argument)) else { throw CaptureError.usage("--display-id must be an unsigned integer") }
                options.displayID = CGDirectDisplayID(value)
            case "--output": options.outputDirectory = URL(fileURLWithPath: try value(after: argument), isDirectory: true)
            case "--fps":
                guard let value = Int(try value(after: argument)), (1...60).contains(value) else { throw CaptureError.usage("--fps must be 1...60") }
                options.fps = value
            case "--duration":
                guard let value = Double(try value(after: argument)), value > 0, value <= 3600 else { throw CaptureError.usage("--duration must be > 0 and <= 3600 seconds") }
                options.durationSeconds = value
            case "--wait-for-pid-seconds":
                guard let value = Double(try value(after: argument)), value > 0, value <= 300 else {
                    throw CaptureError.usage("--wait-for-pid-seconds must be > 0 and <= 300 seconds")
                }
                options.waitForProcessSeconds = value
            case "--minimum-window-size":
                let parts = try value(after: argument).split(separator: "x").compactMap { Int($0) }
                guard parts.count == 2, parts[0] > 0, parts[1] > 0, parts[0] <= 8192, parts[1] <= 8192 else {
                    throw CaptureError.usage("--minimum-window-size must be WIDTHxHEIGHT")
                }
                options.minimumWindowWidth = parts[0]
                options.minimumWindowHeight = parts[1]
            case "--source-rect":
                let parts = try value(after: argument).split(separator: ",").compactMap { Double($0) }
                guard parts.count == 4, parts[0] >= 0, parts[1] >= 0, parts[2] > 0, parts[3] > 0 else {
                    throw CaptureError.usage("--source-rect must be x,y,width,height with non-negative origin and positive size")
                }
                options.sourceRect = CGRect(x: parts[0], y: parts[1], width: parts[2], height: parts[3])
            case "--output-size":
                let parts = try value(after: argument).split(separator: "x").compactMap { Int($0) }
                guard parts.count == 2, parts[0] > 0, parts[1] > 0, parts[0] <= 8192, parts[1] <= 8192 else {
                    throw CaptureError.usage("--output-size must be WIDTHxHEIGHT")
                }
                options.outputWidth = parts[0]
                options.outputHeight = parts[1]
            default: throw CaptureError.usage("unknown option: \(argument)")
            }
            index += 1
        }
        switch options.mode {
        case .help: break
        case .list:
            guard (options.ownerName != nil) != (options.processID != nil) else { throw CaptureError.usage("--list requires exactly one of --owner or --pid") }
        case .listDisplays: break
        case .capture:
            guard (options.windowID != nil) != (options.displayID != nil), options.outputDirectory != nil, options.durationSeconds != nil else {
                throw CaptureError.usage("--capture requires exactly one of --window-id or --display-id, plus --output and --duration")
            }
            if options.displayID != nil && options.processID == nil { throw CaptureError.usage("display capture requires --pid to include only the exact target application") }
            if options.waitForProcessSeconds > 0 && (options.displayID == nil || options.processID == nil) {
                throw CaptureError.usage("--wait-for-pid-seconds requires display capture with --pid")
            }
            if (options.minimumWindowWidth > 1 || options.minimumWindowHeight > 1) && options.waitForProcessSeconds == 0 {
                throw CaptureError.usage("--minimum-window-size requires --wait-for-pid-seconds")
            }
        }
        return options
    }
}

private struct WindowRecord: Codable {
    let windowID: UInt32
    let ownerName: String
    let title: String
    let frameX: Double
    let frameY: Double
    let frameWidth: Double
    let frameHeight: Double
    let onScreen: Bool
}

private struct DisplayRecord: Codable {
    let displayID: UInt32
    let frameX: Double
    let frameY: Double
    let frameWidth: Double
    let frameHeight: Double
    let pointWidth: Int
    let pointHeight: Int
    let includedProcessID: Int32?
    let includedApplicationName: String?
    let includedBundleIdentifier: String?
}

private struct FrameRecord: Codable {
    let ordinal: Int
    let file: String
    let bytes: Int
    let sha256: String
    let width: Int
    let height: Int
    let presentationTimeSeconds: Double
    let relativeTimeSeconds: Double
    let status: String
}

private struct AudioRecord: Codable {
    let bufferCount: Int
    let inputPayloadBytes: Int
    let inputNonZeroBytes: Int
    let inputContainsNonZeroAudio: Bool
    let firstPresentationTimeSeconds: Double?
    let lastPresentationTimeSeconds: Double?
    let outputFile: String
    let outputBytes: Int
    let outputSha256: String?
    let codec: String
    let sampleRate: Int
    let channels: Int
}

private struct CaptureManifest: Codable {
    let schemaVersion: Int
    let evidenceType: String
    let status: String
    let window: WindowRecord?
    let display: DisplayRecord?
    let configuration: [String: String]
    let startedAt: String
    let endedAt: String
    let frames: [FrameRecord]
    let audio: AudioRecord
    let frameAlphaMaskSha256: String
    let droppedOrIncompleteFrameCount: Int
    let runtimeAuthorityClaimed: Bool
    let acceptanceEffect: String
}

private func sha256(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

private func jsonData<T: Encodable>(_ value: T) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
    return try encoder.encode(value) + Data([0x0a])
}

private final class StreamCollector: NSObject, SCStreamOutput, SCStreamDelegate {
    private let outputRoot: URL
    private let framesRoot: URL
    private let expectedWidth: Int
    private let expectedHeight: Int
    private let ciContext = CIContext(options: [.cacheIntermediates: false])
    private let lock = NSLock()
    private var firstScreenPTS: CMTime?
    private var frameAlphaMaskSha256: String?
    private var frameAlphaMaskBaseline: Data?
    private var maximumAlphaValueDeltaFromBaseline = 0
    private var frameRecords: [FrameRecord] = []
    private var incompleteFrames = 0
    private var streamError: Error?
    private var audioWriter: AVAssetWriter?
    private var audioInput: AVAssetWriterInput?
    private var audioStarted = false
    private var audioBufferCount = 0
    private var audioPayloadByteCount = 0
    private var audioNonZeroByteCount = 0
    private var firstAudioPTS: CMTime?
    private var lastAudioPTS: CMTime?

    init(outputRoot: URL, width: Int, height: Int) throws {
        self.outputRoot = outputRoot
        self.framesRoot = outputRoot.appendingPathComponent("frames", isDirectory: true)
        self.expectedWidth = width
        self.expectedHeight = height
        super.init()
        try FileManager.default.createDirectory(at: framesRoot, withIntermediateDirectories: false)
        let audioURL = outputRoot.appendingPathComponent("system-audio-lossless.m4a")
        let writer = try AVAssetWriter(outputURL: audioURL, fileType: .m4a)
        let settings: [String: Any] = [
            AVFormatIDKey: kAudioFormatAppleLossless,
            AVSampleRateKey: 48_000,
            AVNumberOfChannelsKey: 2,
            AVEncoderBitDepthHintKey: 24,
        ]
        let input = AVAssetWriterInput(mediaType: .audio, outputSettings: settings)
        input.expectsMediaDataInRealTime = true
        guard writer.canAdd(input) else { throw CaptureError.invariant("cannot add lossless audio writer input") }
        writer.add(input)
        self.audioWriter = writer
        self.audioInput = input
    }

    func stream(_ stream: SCStream, didStopWithError error: Error) {
        lock.lock(); streamError = error; lock.unlock()
    }

    func stream(_ stream: SCStream, didOutputSampleBuffer sampleBuffer: CMSampleBuffer, of type: SCStreamOutputType) {
        guard sampleBuffer.isValid else { return }
        switch type {
        case .screen: handleScreen(sampleBuffer)
        case .audio: handleAudio(sampleBuffer)
        case .microphone: break
        @unknown default: break
        }
    }

    private func handleScreen(_ sampleBuffer: CMSampleBuffer) {
        lock.lock()
        let priorError = streamError
        let alphaMaskBaseline = frameAlphaMaskBaseline
        let expectedAlphaMaskSha256 = frameAlphaMaskSha256
        lock.unlock()
        guard priorError == nil else { return }
        let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false) as? [[SCStreamFrameInfo: Any]]
        let statusRaw = attachments?.first?[.status] as? Int ?? -1
        let status = SCFrameStatus(rawValue: statusRaw) ?? .blank
        guard status == .complete, let pixelBuffer = sampleBuffer.imageBuffer else {
            lock.lock(); incompleteFrames += 1; lock.unlock(); return
        }
        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        guard width == expectedWidth, height == expectedHeight else {
            lock.lock();
            streamError = CaptureError.invariant("captured frame dimensions \(width)x\(height) differ from \(expectedWidth)x\(expectedHeight)")
            lock.unlock(); return
        }
        guard CVPixelBufferGetPixelFormatType(pixelBuffer) == kCVPixelFormatType_32BGRA else {
            lock.lock()
            streamError = CaptureError.invariant("captured frame pixel format is not BGRA")
            lock.unlock()
            return
        }
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
            lock.lock()
            streamError = CaptureError.invariant("captured frame has no readable BGRA base address")
            lock.unlock()
            return
        }
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        var alphaMask = Data(count: width * height)
        var alphaOccupancyMask = Data(count: width * height)
        var firstUnexpectedAlphaPixel: (x: Int, y: Int, alpha: UInt8)?
        var firstChangedAlphaOccupancyPixel: (x: Int, y: Int)?
        var changedAlphaOccupancyCount = 0
        var frameMaximumAlphaDelta = 0
        let scanFrame: (UnsafeBufferPointer<UInt8>?) -> Void = { baselineBytes in
            alphaMask.withUnsafeMutableBytes { alphaBytes in
                alphaOccupancyMask.withUnsafeMutableBytes { occupancyBytes in
                    let output = alphaBytes.bindMemory(to: UInt8.self)
                    let occupancyOutput = occupancyBytes.bindMemory(to: UInt8.self)
                    for y in 0..<height {
                        let row = baseAddress.advanced(by: y * bytesPerRow).assumingMemoryBound(to: UInt8.self)
                        for x in 0..<width {
                            let index = y * width + x
                            let alpha = row[x * 4 + 3]
                            output[index] = alpha
                            occupancyOutput[index] = alpha == UInt8.max ? UInt8.max : 0
                            if let baselineBytes {
                                let baselineAlpha = baselineBytes[index]
                                if (baselineAlpha == UInt8.max) != (alpha == UInt8.max) {
                                    changedAlphaOccupancyCount += 1
                                    if firstChangedAlphaOccupancyPixel == nil {
                                        firstChangedAlphaOccupancyPixel = (x, y)
                                    }
                                }
                                frameMaximumAlphaDelta = max(
                                    frameMaximumAlphaDelta,
                                    abs(Int(baselineAlpha) - Int(alpha))
                                )
                            }
                            if alpha != UInt8.max {
                                let withinNativeRightEdge = x >= width - nativeWindowEdgeAlphaMaskExtent
                                let withinNativeBottomEdge = y >= height - nativeWindowEdgeAlphaMaskExtent
                                let withinNativeBottomCorner =
                                    y >= height - nativeBottomCornerAlphaMaskExtent
                                    && (x < nativeBottomCornerAlphaMaskExtent || x >= width - nativeBottomCornerAlphaMaskExtent)
                                let permittedNativeWindowMask = withinNativeRightEdge || withinNativeBottomEdge || withinNativeBottomCorner
                                if !permittedNativeWindowMask && firstUnexpectedAlphaPixel == nil {
                                    firstUnexpectedAlphaPixel = (x, y, alpha)
                                }
                            }
                        }
                    }
                }
            }
        }
        if let alphaMaskBaseline {
            alphaMaskBaseline.withUnsafeBytes { baselineBytes in
                scanFrame(baselineBytes.bindMemory(to: UInt8.self))
            }
        } else {
            scanFrame(nil)
        }
        CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
        if let pixel = firstUnexpectedAlphaPixel {
            lock.lock()
            streamError = CaptureError.invariant(
                "captured frame contains non-opaque pixels outside the native 3px right/bottom edges plus 19px bottom-corner mask at (\(pixel.x),\(pixel.y)); alpha=\(pixel.alpha)"
            )
            lock.unlock()
            return
        }
        let alphaMaskSha256 = expectedAlphaMaskSha256 ?? sha256(alphaOccupancyMask)
        lock.lock()
        if expectedAlphaMaskSha256 != nil && changedAlphaOccupancyCount > 0 {
            let firstChangeDetail = firstChangedAlphaOccupancyPixel.map {
                " first occupancy change at (\($0.x),\($0.y));"
            } ?? ""
            streamError = CaptureError.invariant(
                "captured frame opaque/non-opaque occupancy mask changed during the session;\(firstChangeDetail) changed occupancy pixels=\(changedAlphaOccupancyCount)"
            )
            lock.unlock()
            return
        }
        if frameMaximumAlphaDelta > 2 {
            streamError = CaptureError.invariant(
                "captured frame native-edge alpha values drifted more than the 2-level tolerance from the first frame; maximum alpha delta=\(frameMaximumAlphaDelta)"
            )
            lock.unlock()
            return
        }
        maximumAlphaValueDeltaFromBaseline = max(maximumAlphaValueDeltaFromBaseline, frameMaximumAlphaDelta)
        if frameAlphaMaskSha256 == nil {
            frameAlphaMaskSha256 = alphaMaskSha256
            frameAlphaMaskBaseline = alphaMask
        }
        lock.unlock()
        let pts = sampleBuffer.presentationTimeStamp
        lock.lock()
        if firstScreenPTS == nil { firstScreenPTS = pts }
        let firstPTS = firstScreenPTS!
        let ordinal = frameRecords.count + 1
        lock.unlock()
        let image = CIImage(cvPixelBuffer: pixelBuffer)
        guard let cgImage = ciContext.createCGImage(image, from: CGRect(x: 0, y: 0, width: width, height: height)) else {
            lock.lock(); streamError = CaptureError.invariant("could not create CGImage for frame \(ordinal)"); lock.unlock(); return
        }
        let fileName = String(format: "frame-%06d.png", ordinal)
        let fileURL = framesRoot.appendingPathComponent(fileName)
        guard let destination = CGImageDestinationCreateWithURL(fileURL as CFURL, UTType.png.identifier as CFString, 1, nil) else {
            lock.lock(); streamError = CaptureError.invariant("could not create PNG destination for frame \(ordinal)"); lock.unlock(); return
        }
        CGImageDestinationAddImage(destination, cgImage, [kCGImagePropertyPNGCompressionFilter: 0] as CFDictionary)
        guard CGImageDestinationFinalize(destination), let bytes = try? Data(contentsOf: fileURL) else {
            lock.lock(); streamError = CaptureError.invariant("could not finalize PNG frame \(ordinal)"); lock.unlock(); return
        }
        let record = FrameRecord(
            ordinal: ordinal,
            file: "frames/\(fileName)",
            bytes: bytes.count,
            sha256: sha256(bytes),
            width: width,
            height: height,
            presentationTimeSeconds: pts.seconds,
            relativeTimeSeconds: CMTimeSubtract(pts, firstPTS).seconds,
            status: "complete"
        )
        lock.lock(); frameRecords.append(record); lock.unlock()
    }

    private func handleAudio(_ sampleBuffer: CMSampleBuffer) {
        lock.lock(); defer { lock.unlock() }
        guard let writer = audioWriter, let input = audioInput else { return }
        guard let blockBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else {
            streamError = CaptureError.invariant("ScreenCaptureKit audio buffer has no inspectable payload")
            return
        }
        let payloadBytes = CMBlockBufferGetDataLength(blockBuffer)
        guard payloadBytes > 0 else {
            streamError = CaptureError.invariant("ScreenCaptureKit audio buffer has an empty payload")
            return
        }
        var payload = [UInt8](repeating: 0, count: payloadBytes)
        let copyStatus = payload.withUnsafeMutableBytes { destination in
            CMBlockBufferCopyDataBytes(
                blockBuffer,
                atOffset: 0,
                dataLength: payloadBytes,
                destination: destination.baseAddress!
            )
        }
        guard copyStatus == kCMBlockBufferNoErr else {
            streamError = CaptureError.invariant("could not inspect ScreenCaptureKit audio payload (OSStatus \(copyStatus))")
            return
        }
        audioPayloadByteCount += payloadBytes
        audioNonZeroByteCount += payload.reduce(into: 0) { count, byte in
            if byte != 0 { count += 1 }
        }
        let pts = sampleBuffer.presentationTimeStamp
        if !audioStarted {
            guard writer.startWriting() else {
                streamError = writer.error ?? CaptureError.invariant("lossless audio writer failed to start")
                return
            }
            writer.startSession(atSourceTime: pts)
            audioStarted = true
            firstAudioPTS = pts
        }
        guard input.isReadyForMoreMediaData else {
            streamError = CaptureError.invariant("lossless audio writer backpressure would drop a buffer")
            return
        }
        guard input.append(sampleBuffer) else {
            streamError = writer.error ?? CaptureError.invariant("lossless audio writer rejected a sample buffer")
            return
        }
        audioBufferCount += 1
        lastAudioPTS = pts
    }

    private func snapshot() -> (error: Error?, frames: [FrameRecord], alphaMaskSha256: String?, maximumAlphaValueDelta: Int, incomplete: Int, writer: AVAssetWriter?, input: AVAssetWriterInput?, started: Bool, count: Int, payloadBytes: Int, nonZeroBytes: Int, first: CMTime?, last: CMTime?) {
        lock.lock()
        defer { lock.unlock() }
        return (streamError, frameRecords, frameAlphaMaskSha256, maximumAlphaValueDeltaFromBaseline, incompleteFrames, audioWriter, audioInput, audioStarted, audioBufferCount, audioPayloadByteCount, audioNonZeroByteCount, firstAudioPTS, lastAudioPTS)
    }

    func finish() async throws -> (frames: [FrameRecord], audio: AudioRecord, alphaMaskSha256: String, maximumAlphaValueDelta: Int, incomplete: Int) {
        let state = snapshot()
        if let error = state.error { throw error }
        let audioURL = outputRoot.appendingPathComponent("system-audio-lossless.m4a")
        if state.started, let writer = state.writer, let input = state.input {
            input.markAsFinished()
            await withCheckedContinuation { continuation in writer.finishWriting { continuation.resume() } }
            guard writer.status == .completed else { throw writer.error ?? CaptureError.invariant("lossless audio writer did not complete") }
        } else {
            state.writer?.cancelWriting()
            try? FileManager.default.removeItem(at: audioURL)
        }
        let data = try? Data(contentsOf: audioURL)
        guard let alphaMaskSha256 = state.alphaMaskSha256 else {
            throw CaptureError.invariant("capture produced no frame alpha-mask binding")
        }
        return (
            state.frames,
            AudioRecord(
                bufferCount: state.count,
                inputPayloadBytes: state.payloadBytes,
                inputNonZeroBytes: state.nonZeroBytes,
                inputContainsNonZeroAudio: state.nonZeroBytes > 0,
                firstPresentationTimeSeconds: state.first?.seconds,
                lastPresentationTimeSeconds: state.last?.seconds,
                outputFile: "system-audio-lossless.m4a",
                outputBytes: data?.count ?? 0,
                outputSha256: data.map(sha256),
                codec: "Apple Lossless Audio Codec",
                sampleRate: 48_000,
                channels: 2
            ),
            alphaMaskSha256,
            state.maximumAlphaValueDelta,
            state.incomplete
        )
    }
}

private func matchingWindows(options: Options) async throws -> [SCWindow] {
    let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
    return content.windows.filter { window in
        guard let app = window.owningApplication else { return false }
        if let ownerName = options.ownerName, app.applicationName != ownerName { return false }
        if let processID = options.processID, app.processID != processID { return false }
        if let title = options.titleContains { return (window.title ?? "").localizedCaseInsensitiveContains(title) }
        return true
    }.sorted { $0.windowID < $1.windowID }
}

private func record(_ window: SCWindow) -> WindowRecord {
    WindowRecord(
        windowID: window.windowID,
        ownerName: window.owningApplication?.applicationName ?? "",
        title: window.title ?? "",
        frameX: window.frame.origin.x,
        frameY: window.frame.origin.y,
        frameWidth: window.frame.width,
        frameHeight: window.frame.height,
        onScreen: window.isOnScreen
    )
}

private func record(_ display: SCDisplay, including application: SCRunningApplication? = nil) -> DisplayRecord {
    DisplayRecord(
        displayID: display.displayID,
        frameX: display.frame.origin.x,
        frameY: display.frame.origin.y,
        frameWidth: display.frame.width,
        frameHeight: display.frame.height,
        pointWidth: display.width,
        pointHeight: display.height,
        includedProcessID: application?.processID,
        includedApplicationName: application?.applicationName,
        includedBundleIdentifier: application?.bundleIdentifier
    )
}

private func runList(_ options: Options) async throws {
    let rows = try await matchingWindows(options: options).map(record)
    FileHandle.standardOutput.write(try jsonData(rows))
}

private func runListDisplays() async throws {
    let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
    let rows = content.displays.sorted { $0.displayID < $1.displayID }.map { record($0) }
    FileHandle.standardOutput.write(try jsonData(rows))
}

private func windows(
    in content: SCShareableContent,
    ownedBy processID: pid_t,
    titleContains: String?,
    minimumWidth: Int,
    minimumHeight: Int
) -> [SCWindow] {
    content.windows.filter { window in
        guard window.owningApplication?.processID == processID,
              window.isOnScreen,
              window.frame.width >= Double(minimumWidth),
              window.frame.height >= Double(minimumHeight) else { return false }
        if let titleContains {
            return (window.title ?? "").localizedCaseInsensitiveContains(titleContains)
        }
        return true
    }.sorted { $0.windowID < $1.windowID }
}

private func shareableContent(
    waitingForFirstWindowOf processID: pid_t,
    titleContains: String?,
    minimumWidth: Int,
    minimumHeight: Int,
    seconds: Double
) async throws -> SCShareableContent {
    let deadline = Date().addingTimeInterval(seconds)
    while true {
        let content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
        if !windows(
            in: content,
            ownedBy: processID,
            titleContains: titleContains,
            minimumWidth: minimumWidth,
            minimumHeight: minimumHeight
        ).isEmpty { return content }
        guard Date() < deadline else {
            throw CaptureError.invariant("exact --pid application did not expose a shareable window before the wait timeout")
        }
        try await Task.sleep(for: .milliseconds(250))
    }
}

private func runCapture(_ options: Options) async throws {
    let content: SCShareableContent
    if let processID = options.processID, options.displayID != nil, options.waitForProcessSeconds > 0 {
        content = try await shareableContent(
            waitingForFirstWindowOf: processID,
            titleContains: options.titleContains,
            minimumWidth: options.minimumWindowWidth,
            minimumHeight: options.minimumWindowHeight,
            seconds: options.waitForProcessSeconds
        )
    } else {
        content = try await SCShareableContent.excludingDesktopWindows(true, onScreenWindowsOnly: true)
    }
    let filter: SCContentFilter
    let windowRecord: WindowRecord?
    let displayRecord: DisplayRecord?
    var usesSingleWindowFilter = false
    var resolvedSourceRect = options.sourceRect
    if let windowID = options.windowID {
        guard let window = content.windows.first(where: { $0.windowID == windowID }) else {
            throw CaptureError.invariant("selected window is not currently shareable")
        }
        if let processID = options.processID, window.owningApplication?.processID != processID {
            throw CaptureError.invariant("selected window is not owned by the exact --pid application")
        }
        filter = SCContentFilter(desktopIndependentWindow: window)
        usesSingleWindowFilter = true
        windowRecord = record(window)
        displayRecord = nil
    } else {
        guard let displayID = options.displayID,
              let display = content.displays.first(where: { $0.displayID == displayID }) else {
            throw CaptureError.invariant("selected display is not currently shareable")
        }
        guard let processID = options.processID,
              let application = content.applications.first(where: { $0.processID == processID }) else {
            throw CaptureError.invariant("exact --pid application is not currently shareable")
        }
        if options.waitForProcessSeconds > 0 {
            guard let window = windows(
                in: content,
                ownedBy: processID,
                titleContains: options.titleContains,
                minimumWidth: options.minimumWindowWidth,
                minimumHeight: options.minimumWindowHeight
            ).first(where: { $0.frame.intersects(display.frame) }) else {
                throw CaptureError.invariant("exact --pid application has no matching shareable window on the selected display")
            }
            filter = SCContentFilter(display: display, including: [application], exceptingWindows: [])
            windowRecord = record(window)
            displayRecord = record(display, including: application)
            if let sourceRect = options.sourceRect {
                resolvedSourceRect = CGRect(
                    x: window.frame.origin.x - display.frame.origin.x + sourceRect.origin.x,
                    y: window.frame.origin.y - display.frame.origin.y + sourceRect.origin.y,
                    width: sourceRect.width,
                    height: sourceRect.height
                )
            }
        } else {
            filter = SCContentFilter(display: display, including: [application], exceptingWindows: [])
            windowRecord = nil
            displayRecord = record(display, including: application)
        }
    }
    let output = options.outputDirectory!.standardizedFileURL
    guard !FileManager.default.fileExists(atPath: output.path) else { throw CaptureError.invariant("refusing to overwrite capture output") }
    try FileManager.default.createDirectory(at: output, withIntermediateDirectories: false)
    let configuration = SCStreamConfiguration()
    configuration.width = options.outputWidth
    configuration.height = options.outputHeight
    configuration.minimumFrameInterval = CMTime(value: 1, timescale: CMTimeScale(options.fps))
    configuration.queueDepth = 8
    configuration.pixelFormat = kCVPixelFormatType_32BGRA
    configuration.ignoreShadowsSingleWindow = usesSingleWindowFilter
    configuration.ignoreShadowsDisplay = !usesSingleWindowFilter
    configuration.showsCursor = false
    configuration.capturesAudio = true
    configuration.excludesCurrentProcessAudio = false
    configuration.sampleRate = 48_000
    configuration.channelCount = 2
    if let sourceRect = resolvedSourceRect { configuration.sourceRect = sourceRect }
    let collector = try StreamCollector(outputRoot: output, width: options.outputWidth, height: options.outputHeight)
    let screenQueue = DispatchQueue(label: "ai.helpmath.g4l3.capture.screen", qos: .userInitiated)
    let audioQueue = DispatchQueue(label: "ai.helpmath.g4l3.capture.audio", qos: .userInitiated)
    let stream = SCStream(filter: filter, configuration: configuration, delegate: collector)
    try stream.addStreamOutput(collector, type: .screen, sampleHandlerQueue: screenQueue)
    try stream.addStreamOutput(collector, type: .audio, sampleHandlerQueue: audioQueue)
    let startedAt = ISO8601DateFormatter().string(from: Date())
    try await stream.startCapture()
    try await Task.sleep(for: .seconds(options.durationSeconds!))
    try await stream.stopCapture()
    screenQueue.sync {}
    audioQueue.sync {}
    let result = try await collector.finish()
    guard !result.frames.isEmpty else { throw CaptureError.invariant("capture produced zero complete frames") }
    let endedAt = ISO8601DateFormatter().string(from: Date())
    let manifest = CaptureManifest(
        schemaVersion: 1,
        evidenceType: "g4-l3-lossless-window-frame-and-system-audio-capture",
        status: "raw-capture-not-yet-bound-to-runtime-trace",
        window: windowRecord,
        display: displayRecord,
        configuration: [
            "fps": String(options.fps),
            "outputWidth": String(options.outputWidth),
            "outputHeight": String(options.outputHeight),
            "sourceRect": options.sourceRect.map { "\($0.origin.x),\($0.origin.y),\($0.width),\($0.height)" } ?? "full-window",
            "resolvedDisplaySourceRect": resolvedSourceRect.map { "\($0.origin.x),\($0.origin.y),\($0.width),\($0.height)" } ?? "full-filter",
            "pixelFormat": "BGRA",
            "windowShadows": usesSingleWindowFilter ? "single-window-framing-excluded" : "display-window-framing-excluded",
            "alphaMaskInvariant": "stable-full-frame-mask-with-only-native-3px-right-bottom-edges-plus-19px-bottom-corners-non-opaque",
            "alphaMaskBinding": "stable-opaque-versus-nonopaque-occupancy",
            "alphaValueJitterTolerance": "2",
            "maximumObservedAlphaValueDelta": String(result.maximumAlphaValueDelta),
            "cursor": "excluded",
            "audio": "system-audio-48kHz-2ch-ALAC",
            "sourceKind": options.waitForProcessSeconds > 0 ? "waited-first-window-exact-pid" : (windowRecord == nil ? "display-exact-application" : "window"),
            "waitForPidSeconds": String(options.waitForProcessSeconds),
            "minimumWindowWidth": String(options.minimumWindowWidth),
            "minimumWindowHeight": String(options.minimumWindowHeight),
        ],
        startedAt: startedAt,
        endedAt: endedAt,
        frames: result.frames,
        audio: result.audio,
        frameAlphaMaskSha256: result.alphaMaskSha256,
        droppedOrIncompleteFrameCount: result.incomplete,
        runtimeAuthorityClaimed: false,
        acceptanceEffect: "none"
    )
    try jsonData(manifest).write(to: output.appendingPathComponent("capture-manifest.json"), options: .withoutOverwriting)
    FileHandle.standardOutput.write(try jsonData(manifest))
}

private func usage() -> String {
    """
    Usage:
      g4-l3-runtime-capture --help
      g4-l3-runtime-capture --list (--owner <application-name> | --pid <process-id>) [--title-contains <text>]
      g4-l3-runtime-capture --list-displays
      g4-l3-runtime-capture --capture (--window-id <id> | --display-id <id> --pid <process-id>) --output <new-directory> --duration <seconds>
        [--fps 12] [--source-rect x,y,width,height] [--output-size 800x600]
        [--wait-for-pid-seconds 120] [--minimum-window-size 800x600]

    Capture excludes window shadow framing and fails closed if the native stage-edge alpha mask changes or appears outside its 3px right/bottom edges plus 19px bottom-corner bounds.
    It writes lossless PNG frames plus PTS/SHA-256 metadata and lossless system audio.
    Waiting is fail-closed, selects the exact PID's first matching on-screen window at or above the required minimum size, and never falls back to capturing other applications or the unfiltered display.
    It never launches Flash, opens a SWF, injects input, signs evidence, promotes a candidate, or publishes.
    """ + "\n"
}

@main
private struct CaptureMain {
    static func main() async {
        do {
            let options = try Options.parse(Array(CommandLine.arguments.dropFirst()))
            // ScreenCaptureKit can enumerate windows from a plain command-line
            // process, but starting an SCStream also enters CoreGraphics window-
            // server code. Initializing AppKit first gives that path a valid CGS
            // connection without showing a Dock icon or creating a window.
            if case .capture = options.mode {
                let application = NSApplication.shared
                application.setActivationPolicy(.prohibited)
            }
            switch options.mode {
            case .help: FileHandle.standardOutput.write(usage().data(using: .utf8)!)
            case .list: try await runList(options)
            case .listDisplays: try await runListDisplays()
            case .capture: try await runCapture(options)
            }
        } catch {
            FileHandle.standardError.write("ERROR: \(error)\n".data(using: .utf8)!)
            exit(64)
        }
    }
}
