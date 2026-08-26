import AppKit
import AVFoundation
import Foundation

private final class FixtureView: NSView {
    var phase = 0

    override var isFlipped: Bool { true }

    override func draw(_ dirtyRect: NSRect) {
        NSColor(calibratedRed: 0.04, green: 0.06, blue: 0.12, alpha: 1).setFill()
        bounds.fill()
        NSColor(calibratedRed: 0.15, green: 0.72, blue: 0.95, alpha: 1).setFill()
        NSRect(x: 40, y: 40, width: 260, height: 180).fill()
        NSColor(calibratedRed: 0.96, green: 0.48, blue: 0.18, alpha: 1).setFill()
        NSRect(x: 500, y: 320, width: 240, height: 220).fill()
        NSColor(calibratedRed: 0.98, green: 0.84, blue: 0.16, alpha: 1).setFill()
        NSRect(x: 40 + phase, y: 560, width: 36, height: 20).fill()
        let paragraph = NSMutableParagraphStyle()
        paragraph.alignment = .center
        let text = "HELP Math 800×600\nScreenCaptureKit Fixture"
        text.draw(
            in: NSRect(x: 160, y: 245, width: 480, height: 100),
            withAttributes: [
                .font: NSFont.monospacedSystemFont(ofSize: 28, weight: .bold),
                .foregroundColor: NSColor.white,
                .paragraphStyle: paragraph,
            ]
        )
    }
}

private final class FixtureController: NSObject, NSApplicationDelegate {
    private var window: NSWindow!
    private var fixtureView: FixtureView!
    private var animationTimer: Timer!
    private let engine = AVAudioEngine()
    private let player = AVAudioPlayerNode()

    func applicationDidFinishLaunching(_ notification: Notification) {
        window = NSWindow(
            contentRect: NSRect(x: 120, y: 120, width: 820, height: 620),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.title = "HELP Math Capture Fixture"
        window.isOpaque = true
        window.backgroundColor = .black
        window.hasShadow = false
        fixtureView = FixtureView(frame: NSRect(x: 0, y: 0, width: 820, height: 620))
        window.contentView = fixtureView
        window.isReleasedWhenClosed = false
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
        animationTimer = Timer.scheduledTimer(withTimeInterval: 1.0 / 60.0, repeats: true) { [weak self] _ in
            guard let self else { return }
            self.fixtureView.phase = (self.fixtureView.phase + 5) % 700
            self.fixtureView.needsDisplay = true
        }
        startTone()
        print("fixture_pid=\(ProcessInfo.processInfo.processIdentifier)")
        fflush(stdout)
        DispatchQueue.main.asyncAfter(deadline: .now() + 60) { NSApp.terminate(nil) }
    }

    private func startTone() {
        let format = AVAudioFormat(standardFormatWithSampleRate: 48_000, channels: 2)!
        let frameCount: AVAudioFrameCount = 48_000
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount
        for channel in 0..<Int(format.channelCount) {
            let samples = buffer.floatChannelData![channel]
            let angularFrequency = 2.0 * Double.pi * 440.0
            let sampleRate = format.sampleRate
            for frame in 0..<Int(frameCount) {
                let time = Double(frame) / sampleRate
                samples[frame] = Float(0.08 * sin(angularFrequency * time))
            }
        }
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: format)
        do {
            try engine.start()
            player.scheduleBuffer(buffer, at: nil, options: .loops)
            player.play()
        } catch {
            fputs("fixture audio failed: \(error)\n", stderr)
        }
    }
}

@main
private struct SyntheticCaptureFixture {
    static func main() {
        let application = NSApplication.shared
        application.setActivationPolicy(.regular)
        let controller = FixtureController()
        application.delegate = controller
        application.run()
    }
}
