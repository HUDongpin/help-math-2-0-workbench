import CryptoKit
import CoreFoundation
import Darwin
import Foundation

private let helperSchemaVersion = 1
private let sha256Pattern = try! NSRegularExpression(pattern: "^[a-f0-9]{64}$")
private let transactionIdPattern = try! NSRegularExpression(
    pattern: "^[a-z0-9][a-z0-9._-]{15,199}$"
)
private let noncePattern = try! NSRegularExpression(pattern: "^[A-Za-z0-9_-]{22,256}$")

private struct CandidateFailure: Error {
    let code: String
    let step: String
    let errnoValue: Int32?

    init(_ code: String, _ step: String, errnoValue: Int32? = nil) {
        self.code = code
        self.step = step
        self.errnoValue = errnoValue
    }
}

private final class DescriptorStack {
    private(set) var descriptors: [Int32]

    init(rootDescriptor: Int32) throws {
        let duplicate = fcntl(rootDescriptor, F_DUPFD_CLOEXEC, 0)
        guard duplicate >= 0 else {
            throw CandidateFailure("FD_DUPLICATION_FAILED", "duplicate-root", errnoValue: errno)
        }
        descriptors = [duplicate]
    }

    var current: Int32 {
        descriptors[descriptors.count - 1]
    }

    func append(_ descriptor: Int32) {
        descriptors.append(descriptor)
    }

    deinit {
        for descriptor in descriptors.reversed() {
            _ = Darwin.close(descriptor)
        }
    }
}

private struct ResolvedParent {
    let stack: DescriptorStack
    let leaf: String
}

private func sha256Hex(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}

private func canonicalJSONData(_ value: Any, _ step: String) throws -> Data {
    guard JSONSerialization.isValidJSONObject(value) else {
        throw CandidateFailure("NONCANONICAL_SIGNED_VALUE", step)
    }
    do {
        return try JSONSerialization.data(
            withJSONObject: value,
            options: [.sortedKeys, .withoutEscapingSlashes]
        )
    } catch {
        throw CandidateFailure("NONCANONICAL_SIGNED_VALUE", step)
    }
}

private func exactMatch(_ value: String, regex: NSRegularExpression) -> Bool {
    let range = NSRange(value.startIndex..<value.endIndex, in: value)
    return regex.firstMatch(in: value, range: range)?.range == range
}

private func requireDictionary(_ value: Any, _ step: String) throws -> [String: Any] {
    guard let dictionary = value as? [String: Any] else {
        throw CandidateFailure("INVALID_REQUEST_SHAPE", step)
    }
    return dictionary
}

private func requireExactKeys(
    _ dictionary: [String: Any],
    allowed: Set<String>,
    required: Set<String>,
    step: String
) throws {
    let observed = Set(dictionary.keys)
    guard required.isSubset(of: observed), observed.isSubset(of: allowed) else {
        throw CandidateFailure("UNEXPECTED_REQUEST_FIELD", step)
    }
}

private func requireString(_ dictionary: [String: Any], _ key: String, _ step: String) throws -> String {
    guard let value = dictionary[key] as? String, !value.isEmpty else {
        throw CandidateFailure("INVALID_STRING", "\(step).\(key)")
    }
    return value
}

private func optionalString(_ dictionary: [String: Any], _ key: String, _ step: String) throws -> String? {
    guard let raw = dictionary[key] else { return nil }
    guard let value = raw as? String, !value.isEmpty else {
        throw CandidateFailure("INVALID_STRING", "\(step).\(key)")
    }
    return value
}

private func requireBool(_ dictionary: [String: Any], _ key: String, _ step: String) throws -> Bool {
    guard let raw = dictionary[key], let number = raw as? NSNumber,
          CFGetTypeID(number) == CFBooleanGetTypeID(), let value = raw as? Bool else {
        throw CandidateFailure("INVALID_BOOLEAN", "\(step).\(key)")
    }
    return value
}

private func requireInteger(
    _ dictionary: [String: Any],
    _ key: String,
    _ step: String,
    minimum: Int = 0,
    maximum: Int = Int.max
) throws -> Int {
    guard let raw = dictionary[key], let number = raw as? NSNumber,
          CFGetTypeID(number) != CFBooleanGetTypeID() else {
        throw CandidateFailure("INVALID_INTEGER", "\(step).\(key)")
    }
    let doubleValue = number.doubleValue
    let value = number.intValue
    guard doubleValue.isFinite,
          doubleValue.rounded(.towardZero) == doubleValue,
          Double(value) == doubleValue,
          value >= minimum,
          value <= maximum else {
        throw CandidateFailure("INVALID_INTEGER", "\(step).\(key)")
    }
    return value
}

private func optionalInteger(
    _ dictionary: [String: Any],
    _ key: String,
    _ step: String,
    minimum: Int = 0,
    maximum: Int = Int.max
) throws -> Int? {
    guard dictionary[key] != nil else { return nil }
    return try requireInteger(dictionary, key, step, minimum: minimum, maximum: maximum)
}

private func parseUnsignedDecimal(_ value: String, _ step: String) throws -> UInt64 {
    guard !value.isEmpty,
          value.allSatisfy({ $0 >= "0" && $0 <= "9" }),
          let parsed = UInt64(value) else {
        throw CandidateFailure("INVALID_IDENTITY", step)
    }
    return parsed
}

private func validateSha256(_ value: String, _ step: String) throws -> String {
    guard exactMatch(value, regex: sha256Pattern) else {
        throw CandidateFailure("INVALID_SHA256", step)
    }
    return value
}

private func validateTransactionId(_ value: String) throws -> String {
    guard exactMatch(value, regex: transactionIdPattern) else {
        throw CandidateFailure("INVALID_TRANSACTION_ID", "transaction-id")
    }
    return value
}

private func validateRelativePath(_ value: String, _ step: String) throws -> [String] {
    let normalized = value.precomposedStringWithCompatibilityMapping
    guard !value.hasPrefix("/"),
          !value.contains("\\"),
          !value.utf8.contains(0),
          value.utf8.elementsEqual(normalized.utf8) else {
        throw CandidateFailure("UNSAFE_RELATIVE_PATH", step)
    }
    let components = value.split(separator: "/", omittingEmptySubsequences: false).map(String.init)
    guard !components.isEmpty,
          components.allSatisfy({ component in
              !component.isEmpty && component != "." && component != ".." &&
                  component.utf8.count <= Int(NAME_MAX)
          }) else {
        throw CandidateFailure("UNSAFE_RELATIVE_PATH", step)
    }
    return components
}

private func isSameOrDescendant(_ candidate: String, of root: String) -> Bool {
    if candidate == root { return true }
    let separatorRoot = root.hasSuffix("/") ? root : root + "/"
    return candidate.hasPrefix(separatorRoot)
}

private func canonicalRealPath(_ value: String, _ step: String) throws -> String {
    guard value.utf8.count < Int(PATH_MAX) else {
        throw CandidateFailure("ROOT_PATH_INVALID", step)
    }
    let result: UnsafeMutablePointer<CChar>? = value.withCString { pointer in
        Darwin.realpath(pointer, nil)
    }
    guard let result else {
        throw CandidateFailure("ROOT_REALPATH_FAILED", step, errnoValue: errno)
    }
    defer { free(result) }
    return String(cString: result)
}

private func identity(_ info: stat) -> [String: Any] {
    [
        "device": String(UInt64(info.st_dev)),
        "inode": String(UInt64(info.st_ino)),
        "mode": Int(info.st_mode & 0o777),
        "linkCount": Int(info.st_nlink),
        "size": Int64(info.st_size),
    ]
}

private func sameIdentity(_ info: stat, device: UInt64, inode: UInt64) -> Bool {
    UInt64(info.st_dev) == device && UInt64(info.st_ino) == inode
}

private func fstatChecked(_ descriptor: Int32, _ step: String) throws -> stat {
    var info = stat()
    guard Darwin.fstat(descriptor, &info) == 0 else {
        throw CandidateFailure("FSTAT_FAILED", step, errnoValue: errno)
    }
    return info
}

private func fstatatMaybe(_ parent: Int32, _ leaf: String, _ step: String) throws -> stat? {
    var info = stat()
    let result = leaf.withCString { pointer in
        Darwin.fstatat(
            parent,
            pointer,
            &info,
            AT_SYMLINK_NOFOLLOW_ANY | AT_RESOLVE_BENEATH
        )
    }
    if result == 0 { return info }
    if errno == ENOENT { return nil }
    let code = errno == ELOOP ? "SYMLINK_REJECTED" : "FSTATAT_FAILED"
    throw CandidateFailure(code, step, errnoValue: errno)
}

private func resolveParent(rootDescriptor: Int32, relativePath: String, step: String) throws -> ResolvedParent {
    let components = try validateRelativePath(relativePath, step)
    let stack = try DescriptorStack(rootDescriptor: rootDescriptor)
    if components.count > 1 {
        for (index, component) in components.dropLast().enumerated() {
            let descriptor = component.withCString { pointer in
                Darwin.openat(
                    stack.current,
                    pointer,
                    O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
                )
            }
            guard descriptor >= 0 else {
                let code = errno == ELOOP ? "SYMLINK_REJECTED" : "ANCESTOR_OPEN_FAILED"
                throw CandidateFailure(code, "\(step).ancestor-\(index + 1)", errnoValue: errno)
            }
            let info = try fstatChecked(descriptor, "\(step).ancestor-\(index + 1)-fstat")
            guard (info.st_mode & S_IFMT) == S_IFDIR else {
                _ = Darwin.close(descriptor)
                throw CandidateFailure("ANCESTOR_NOT_DIRECTORY", "\(step).ancestor-\(index + 1)")
            }
            stack.append(descriptor)
        }
    }
    return ResolvedParent(stack: stack, leaf: components[components.count - 1])
}

private func syncDescriptor(_ descriptor: Int32, _ step: String, full: Bool) throws -> Bool {
    guard Darwin.fsync(descriptor) == 0 else {
        throw CandidateFailure("FSYNC_FAILED", step, errnoValue: errno)
    }
    guard full else { return false }
    if Darwin.fcntl(descriptor, F_FULLFSYNC) == 0 { return true }
    if errno == EINVAL || errno == ENOTSUP {
        throw CandidateFailure("FULLFSYNC_UNSUPPORTED", step, errnoValue: errno)
    }
    throw CandidateFailure("FULLFSYNC_FAILED", step, errnoValue: errno)
}

private func writeAll(_ descriptor: Int32, data: Data, step: String) throws {
    try data.withUnsafeBytes { rawBuffer in
        guard let base = rawBuffer.baseAddress else { return }
        var offset = 0
        while offset < rawBuffer.count {
            let written = Darwin.write(descriptor, base.advanced(by: offset), rawBuffer.count - offset)
            if written < 0 {
                if errno == EINTR { continue }
                throw CandidateFailure("WRITE_FAILED", step, errnoValue: errno)
            }
            if written == 0 { throw CandidateFailure("SHORT_WRITE", step) }
            offset += written
        }
    }
}

private func readAll(_ descriptor: Int32, expectedSize: Int64, step: String) throws -> Data {
    guard expectedSize >= 0, expectedSize <= 64 * 1024 * 1024 else {
        throw CandidateFailure("FILE_SIZE_UNSAFE", step)
    }
    guard Darwin.lseek(descriptor, 0, SEEK_SET) >= 0 else {
        throw CandidateFailure("SEEK_FAILED", step, errnoValue: errno)
    }
    var data = Data()
    data.reserveCapacity(Int(expectedSize))
    var buffer = [UInt8](repeating: 0, count: 64 * 1024)
    while true {
        let count = buffer.withUnsafeMutableBytes { rawBuffer in
            Darwin.read(descriptor, rawBuffer.baseAddress, rawBuffer.count)
        }
        if count < 0 {
            if errno == EINTR { continue }
            throw CandidateFailure("READ_FAILED", step, errnoValue: errno)
        }
        if count == 0 { break }
        data.append(contentsOf: buffer.prefix(count))
        if data.count > 64 * 1024 * 1024 {
            throw CandidateFailure("FILE_SIZE_UNSAFE", step)
        }
    }
    return data
}

private func inspectFileAt(
    parentDescriptor: Int32,
    leaf: String,
    requireSingleLink: Bool,
    step: String
) throws -> [String: Any] {
    let descriptor = leaf.withCString { pointer in
        Darwin.openat(
            parentDescriptor,
            pointer,
            O_RDONLY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
        )
    }
    guard descriptor >= 0 else {
        let code = errno == ELOOP ? "SYMLINK_REJECTED" : "FILE_OPEN_FAILED"
        throw CandidateFailure(code, step, errnoValue: errno)
    }
    defer { _ = Darwin.close(descriptor) }
    let before = try fstatChecked(descriptor, "\(step).before")
    guard (before.st_mode & S_IFMT) == S_IFREG else {
        throw CandidateFailure("NOT_REGULAR_FILE", step)
    }
    if requireSingleLink && before.st_nlink != 1 {
        throw CandidateFailure("HARDLINK_REJECTED", step)
    }
    let data = try readAll(descriptor, expectedSize: Int64(before.st_size), step: step)
    let after = try fstatChecked(descriptor, "\(step).after")
    guard before.st_dev == after.st_dev,
          before.st_ino == after.st_ino,
          before.st_size == after.st_size,
          before.st_mode == after.st_mode,
          before.st_nlink == after.st_nlink else {
        throw CandidateFailure("FILE_DRIFT_DURING_READ", step)
    }
    var result = identity(after)
    result["sha256"] = sha256Hex(data)
    result["contentBase64"] = data.base64EncodedString()
    return result
}

private func inspectFile(
    rootDescriptor: Int32,
    relativePath: String,
    requireSingleLink: Bool,
    step: String
) throws -> [String: Any] {
    let resolved = try resolveParent(rootDescriptor: rootDescriptor, relativePath: relativePath, step: step)
    return try inspectFileAt(
        parentDescriptor: resolved.stack.current,
        leaf: resolved.leaf,
        requireSingleLink: requireSingleLink,
        step: step
    )
}

private func validateExistingFileAt(
    parentDescriptor: Int32,
    leaf: String,
    expectedData: Data,
    expectedSha256: String,
    expectedMode: Int,
    step: String
) throws -> [String: Any] {
    let snapshot = try inspectFileAt(
        parentDescriptor: parentDescriptor,
        leaf: leaf,
        requireSingleLink: true,
        step: step
    )
    guard snapshot["sha256"] as? String == expectedSha256,
          snapshot["size"] as? Int64 == Int64(expectedData.count),
          snapshot["mode"] as? Int == expectedMode else {
        throw CandidateFailure("FOREIGN_DRIFT", step)
    }
    return snapshot
}

private func randomTemporaryLeaf(transactionId: String, ordinal: Int) -> String {
    var random = [UInt8](repeating: 0, count: 16)
    random.withUnsafeMutableBytes { rawBuffer in
        arc4random_buf(rawBuffer.baseAddress, rawBuffer.count)
    }
    let token = random.map { String(format: "%02x", $0) }.joined()
    return ".p2-\(transactionId.prefix(24))-\(ordinal)-\(token).tmp"
}

private func publishFileNoReplace(
    rootDescriptor: Int32,
    transactionId: String,
    ordinal: Int,
    relativePath: String,
    data: Data,
    expectedSha256: String,
    mode: Int,
    recovery: Bool,
    pauseAfterParentOpen: [String: Any]? = nil,
    step: String
) throws -> [String: Any] {
    guard sha256Hex(data) == expectedSha256 else {
        throw CandidateFailure("CONTENT_HASH_MISMATCH", step)
    }
    let resolved = try resolveParent(rootDescriptor: rootDescriptor, relativePath: relativePath, step: step)
    if let pauseAfterParentOpen {
        try performDiagnosticPause(
            pauseAfterParentOpen,
            rootDescriptor: rootDescriptor,
            transactionId: transactionId,
            ordinal: ordinal
        )
    }
    let temporaryLeaf = randomTemporaryLeaf(transactionId: transactionId, ordinal: ordinal)
    let temporaryDescriptor = temporaryLeaf.withCString { pointer in
        Darwin.openat(
            resolved.stack.current,
            pointer,
            O_WRONLY | O_CREAT | O_EXCL | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH,
            mode_t(0o600)
        )
    }
    guard temporaryDescriptor >= 0 else {
        throw CandidateFailure("TEMP_CREATE_FAILED", step, errnoValue: errno)
    }
    defer {
        _ = Darwin.close(temporaryDescriptor)
    }
    try writeAll(temporaryDescriptor, data: data, step: "\(step).write")
    guard Darwin.fchmod(temporaryDescriptor, mode_t(mode)) == 0 else {
        throw CandidateFailure("FCHMOD_FAILED", step, errnoValue: errno)
    }
    let fullSync = try syncDescriptor(temporaryDescriptor, "\(step).file-sync", full: true)
    let renameFlags = UInt32(RENAME_EXCL | RENAME_NOFOLLOW_ANY | RENAME_RESOLVE_BENEATH)
    let renameResult = temporaryLeaf.withCString { temporaryPointer in
        resolved.leaf.withCString { finalPointer in
            Darwin.renameatx_np(
                resolved.stack.current,
                temporaryPointer,
                resolved.stack.current,
                finalPointer,
                renameFlags
            )
        }
    }
    if renameResult != 0 {
        let renameErrno = errno
        if renameErrno == EEXIST && recovery {
            let existing = try validateExistingFileAt(
                parentDescriptor: resolved.stack.current,
                leaf: resolved.leaf,
                expectedData: data,
                expectedSha256: expectedSha256,
                expectedMode: mode,
                step: "\(step).existing"
            )
            return [
                "status": "already-durable",
                "fullSync": fullSync,
                "file": existing,
            ]
        }
        let code = renameErrno == EEXIST ? "NO_REPLACE_CONFLICT" :
            (renameErrno == ELOOP ? "SYMLINK_REJECTED" : "RENAME_EXCL_FAILED")
        throw CandidateFailure(code, step, errnoValue: renameErrno)
    }
    let final = try validateExistingFileAt(
        parentDescriptor: resolved.stack.current,
        leaf: resolved.leaf,
        expectedData: data,
        expectedSha256: expectedSha256,
        expectedMode: mode,
        step: "\(step).final"
    )
    _ = try syncDescriptor(resolved.stack.current, "\(step).directory-sync", full: false)
    return [
        "status": "published-no-replace",
        "fullSync": fullSync,
        "file": final,
    ]
}

private func mkdirNoReplace(
    rootDescriptor: Int32,
    relativePath: String,
    mode: Int,
    recovery: Bool,
    step: String
) throws -> [String: Any] {
    let resolved = try resolveParent(rootDescriptor: rootDescriptor, relativePath: relativePath, step: step)
    let result = resolved.leaf.withCString { pointer in
        Darwin.mkdirat(resolved.stack.current, pointer, mode_t(mode))
    }
    if result != 0 {
        if errno == EEXIST && recovery {
            guard let existing = try fstatatMaybe(resolved.stack.current, resolved.leaf, step),
                  (existing.st_mode & S_IFMT) == S_IFDIR,
                  Int(existing.st_mode & 0o777) == mode else {
                throw CandidateFailure("FOREIGN_DRIFT", step)
            }
            return ["status": "already-durable", "directory": identity(existing)]
        }
        throw CandidateFailure(
            errno == EEXIST ? "NO_REPLACE_CONFLICT" : "MKDIRAT_FAILED",
            step,
            errnoValue: errno
        )
    }
    let child = resolved.leaf.withCString { pointer in
        Darwin.openat(
            resolved.stack.current,
            pointer,
            O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY | O_RESOLVE_BENEATH
        )
    }
    guard child >= 0 else {
        throw CandidateFailure("CREATED_DIRECTORY_OPEN_FAILED", step, errnoValue: errno)
    }
    defer { _ = Darwin.close(child) }
    guard Darwin.fchmod(child, mode_t(mode)) == 0 else {
        throw CandidateFailure("DIRECTORY_FCHMOD_FAILED", step, errnoValue: errno)
    }
    _ = try syncDescriptor(child, "\(step).new-directory-sync", full: false)
    _ = try syncDescriptor(resolved.stack.current, "\(step).parent-sync", full: false)
    let info = try fstatChecked(child, "\(step).directory-fstat")
    return ["status": "created-no-replace", "directory": identity(info)]
}

private func expectedIdentity(
    _ dictionary: [String: Any],
    key: String,
    step: String
) throws -> (device: UInt64, inode: UInt64) {
    let value = try requireDictionary(dictionary[key] as Any, "\(step).\(key)")
    try requireExactKeys(
        value,
        allowed: ["device", "inode"],
        required: ["device", "inode"],
        step: "\(step).\(key)"
    )
    return (
        try parseUnsignedDecimal(try requireString(value, "device", step), "\(step).\(key).device"),
        try parseUnsignedDecimal(try requireString(value, "inode", step), "\(step).\(key).inode")
    )
}

private func linkOwnedNoReplace(
    rootDescriptor: Int32,
    sourceRelativePath: String,
    targetRelativePath: String,
    expected: (device: UInt64, inode: UInt64),
    recovery: Bool,
    step: String
) throws -> [String: Any] {
    let source = try resolveParent(rootDescriptor: rootDescriptor, relativePath: sourceRelativePath, step: "\(step).source")
    let target = try resolveParent(rootDescriptor: rootDescriptor, relativePath: targetRelativePath, step: "\(step).target")
    guard let sourceInfo = try fstatatMaybe(source.stack.current, source.leaf, "\(step).source"),
          (sourceInfo.st_mode & S_IFMT) == S_IFREG,
          sameIdentity(sourceInfo, device: expected.device, inode: expected.inode) else {
        throw CandidateFailure("SOURCE_IDENTITY_MISMATCH", step)
    }
    if sourceInfo.st_nlink == 2 && recovery {
        guard let targetInfo = try fstatatMaybe(target.stack.current, target.leaf, "\(step).target-existing"),
              sameIdentity(targetInfo, device: expected.device, inode: expected.inode),
              targetInfo.st_nlink == 2 else {
            throw CandidateFailure("FOREIGN_DRIFT", step)
        }
        return ["status": "already-durable", "link": identity(targetInfo)]
    }
    guard sourceInfo.st_nlink == 1 else {
        throw CandidateFailure("SOURCE_LINK_COUNT_UNSAFE", step)
    }
    let flags = AT_SYMLINK_NOFOLLOW_ANY | AT_RESOLVE_BENEATH
    let result = source.leaf.withCString { sourcePointer in
        target.leaf.withCString { targetPointer in
            Darwin.linkat(
                source.stack.current,
                sourcePointer,
                target.stack.current,
                targetPointer,
                flags
            )
        }
    }
    if result != 0 {
        if errno == EEXIST && recovery,
           let targetInfo = try fstatatMaybe(target.stack.current, target.leaf, "\(step).target-existing"),
           sameIdentity(targetInfo, device: expected.device, inode: expected.inode),
           targetInfo.st_nlink == 2 {
            return ["status": "already-durable", "link": identity(targetInfo)]
        }
        throw CandidateFailure(
            errno == EEXIST ? "NO_REPLACE_CONFLICT" : "LINKAT_FAILED",
            step,
            errnoValue: errno
        )
    }
    guard let linked = try fstatatMaybe(target.stack.current, target.leaf, "\(step).target-final"),
          sameIdentity(linked, device: expected.device, inode: expected.inode),
          linked.st_nlink == 2 else {
        throw CandidateFailure("LINK_IDENTITY_MISMATCH", step)
    }
    _ = try syncDescriptor(target.stack.current, "\(step).target-parent-sync", full: false)
    return ["status": "linked-no-replace", "link": identity(linked)]
}

private func unlinkOwned(
    rootDescriptor: Int32,
    relativePath: String,
    expected: (device: UInt64, inode: UInt64),
    recovery: Bool,
    step: String
) throws -> [String: Any] {
    let resolved = try resolveParent(rootDescriptor: rootDescriptor, relativePath: relativePath, step: step)
    guard let existing = try fstatatMaybe(resolved.stack.current, resolved.leaf, step) else {
        if recovery { return ["status": "already-absent"] }
        throw CandidateFailure("OWNED_TARGET_MISSING", step)
    }
    guard (existing.st_mode & S_IFMT) == S_IFREG,
          sameIdentity(existing, device: expected.device, inode: expected.inode) else {
        throw CandidateFailure("FOREIGN_DRIFT", step)
    }
    let result = resolved.leaf.withCString { pointer in
        Darwin.unlinkat(resolved.stack.current, pointer, 0)
    }
    guard result == 0 else {
        throw CandidateFailure("UNLINKAT_FAILED", step, errnoValue: errno)
    }
    _ = try syncDescriptor(resolved.stack.current, "\(step).parent-sync", full: false)
    return ["status": "unlinked-owned-file", "prior": identity(existing)]
}

private func createPauseMarker(
    rootDescriptor: Int32,
    transactionId: String,
    ordinal: Int,
    markerRelativePath: String
) throws {
    let data = Data("parent-opened\n".utf8)
    _ = try publishFileNoReplace(
        rootDescriptor: rootDescriptor,
        transactionId: transactionId,
        ordinal: 10_000 + ordinal,
        relativePath: markerRelativePath,
        data: data,
        expectedSha256: sha256Hex(data),
        mode: 0o600,
        recovery: true,
        pauseAfterParentOpen: nil,
        step: "pause-marker"
    )
}

private func waitForContinue(
    rootDescriptor: Int32,
    relativePath: String,
    timeoutMilliseconds: Int
) throws {
    let deadline = Date().addingTimeInterval(Double(timeoutMilliseconds) / 1_000.0)
    while Date() < deadline {
        do {
            _ = try inspectFile(
                rootDescriptor: rootDescriptor,
                relativePath: relativePath,
                requireSingleLink: true,
                step: "pause-continue"
            )
            return
        } catch let failure as CandidateFailure where failure.code == "FILE_OPEN_FAILED" && failure.errnoValue == ENOENT {
            usleep(10_000)
        }
    }
    throw CandidateFailure("DIAGNOSTIC_PAUSE_TIMEOUT", "pause-continue")
}

private func performDiagnosticPause(
    _ pause: [String: Any],
    rootDescriptor: Int32,
    transactionId: String,
    ordinal: Int
) throws {
    try requireExactKeys(
        pause,
        allowed: ["markerRelativePath", "continueRelativePath", "timeoutMilliseconds"],
        required: ["markerRelativePath", "continueRelativePath", "timeoutMilliseconds"],
        step: "operation.pauseAfterParentOpen"
    )
    let marker = try requireString(pause, "markerRelativePath", "pause")
    let shouldContinue = try requireString(pause, "continueRelativePath", "pause")
    _ = try validateRelativePath(marker, "pause.markerRelativePath")
    _ = try validateRelativePath(shouldContinue, "pause.continueRelativePath")
    let timeout = try requireInteger(
        pause,
        "timeoutMilliseconds",
        "pause",
        minimum: 100,
        maximum: 15_000
    )
    try createPauseMarker(
        rootDescriptor: rootDescriptor,
        transactionId: transactionId,
        ordinal: ordinal,
        markerRelativePath: marker
    )
    try waitForContinue(
        rootDescriptor: rootDescriptor,
        relativePath: shouldContinue,
        timeoutMilliseconds: timeout
    )
}

private func applyOperation(
    _ operation: [String: Any],
    rootDescriptor: Int32,
    transactionId: String,
    recovery: Bool,
    ordinal: Int
) throws -> [String: Any] {
    let kind = try requireString(operation, "kind", "operation-\(ordinal)")
    let relativePath = try requireString(operation, "relativePath", "operation-\(ordinal)")
    _ = try validateRelativePath(relativePath, "operation-\(ordinal).relativePath")
    switch kind {
    case "mkdir-no-replace":
        try requireExactKeys(
            operation,
            allowed: ["ordinal", "kind", "relativePath", "mode"],
            required: ["ordinal", "kind", "relativePath", "mode"],
            step: "operation-\(ordinal)"
        )
        let mode = try requireInteger(operation, "mode", "operation-\(ordinal)", maximum: 0o777)
        return try mkdirNoReplace(
            rootDescriptor: rootDescriptor,
            relativePath: relativePath,
            mode: mode,
            recovery: recovery,
            step: "operation-\(ordinal)-mkdir"
        )
    case "publish-file-no-replace":
        try requireExactKeys(
            operation,
            allowed: [
                "ordinal", "kind", "relativePath", "mode", "contentBase64", "sha256",
                "pauseAfterParentOpen",
            ],
            required: ["ordinal", "kind", "relativePath", "mode", "contentBase64", "sha256"],
            step: "operation-\(ordinal)"
        )
        let mode = try requireInteger(operation, "mode", "operation-\(ordinal)", maximum: 0o777)
        let base64 = try requireString(operation, "contentBase64", "operation-\(ordinal)")
        guard let data = Data(base64Encoded: base64, options: []) else {
            throw CandidateFailure("INVALID_BASE64", "operation-\(ordinal)")
        }
        let expectedSha256 = try validateSha256(
            try requireString(operation, "sha256", "operation-\(ordinal)"),
            "operation-\(ordinal).sha256"
        )
        let pause = operation["pauseAfterParentOpen"] == nil ? nil : try requireDictionary(
            operation["pauseAfterParentOpen"] as Any,
            "operation-\(ordinal).pauseAfterParentOpen"
        )
        return try publishFileNoReplace(
            rootDescriptor: rootDescriptor,
            transactionId: transactionId,
            ordinal: ordinal,
            relativePath: relativePath,
            data: data,
            expectedSha256: expectedSha256,
            mode: mode,
            recovery: recovery,
            pauseAfterParentOpen: pause,
            step: "operation-\(ordinal)-publish"
        )
    case "link-owned-no-replace":
        try requireExactKeys(
            operation,
            allowed: [
                "ordinal", "kind", "relativePath", "sourceRelativePath", "expectedSource",
            ],
            required: ["ordinal", "kind", "relativePath", "sourceRelativePath", "expectedSource"],
            step: "operation-\(ordinal)"
        )
        let source = try requireString(operation, "sourceRelativePath", "operation-\(ordinal)")
        _ = try validateRelativePath(source, "operation-\(ordinal).sourceRelativePath")
        return try linkOwnedNoReplace(
            rootDescriptor: rootDescriptor,
            sourceRelativePath: source,
            targetRelativePath: relativePath,
            expected: try expectedIdentity(operation, key: "expectedSource", step: "operation-\(ordinal)"),
            recovery: recovery,
            step: "operation-\(ordinal)-link"
        )
    case "unlink-owned":
        try requireExactKeys(
            operation,
            allowed: ["ordinal", "kind", "relativePath", "expected"],
            required: ["ordinal", "kind", "relativePath", "expected"],
            step: "operation-\(ordinal)"
        )
        return try unlinkOwned(
            rootDescriptor: rootDescriptor,
            relativePath: relativePath,
            expected: try expectedIdentity(operation, key: "expected", step: "operation-\(ordinal)"),
            recovery: recovery,
            step: "operation-\(ordinal)-unlink"
        )
    case "inspect-file":
        try requireExactKeys(
            operation,
            allowed: ["ordinal", "kind", "relativePath"],
            required: ["ordinal", "kind", "relativePath"],
            step: "operation-\(ordinal)"
        )
        return [
            "status": "inspected",
            "file": try inspectFile(
                rootDescriptor: rootDescriptor,
                relativePath: relativePath,
                requireSingleLink: true,
                step: "operation-\(ordinal)-inspect"
            ),
        ]
    default:
        throw CandidateFailure("UNSUPPORTED_OPERATION", "operation-\(ordinal)")
    }
}

private struct SignedPlanBinding {
    let transactionId: String
    let operationsSha256: String
    let planSha256: String
}

private func validateSignedPlanBinding(
    request: [String: Any],
    rawOperations: [Any],
    expectedDevice: UInt64,
    expectedInode: UInt64
) throws -> SignedPlanBinding {
    let plan = try requireDictionary(request["plan"] as Any, "plan")
    try requireExactKeys(
        plan,
        allowed: [
            "schemaVersion", "diagnosticOnly", "evidenceType", "transactionId", "nonce",
            "operationsSha256", "rootIdentity",
        ],
        required: [
            "schemaVersion", "diagnosticOnly", "evidenceType", "transactionId", "nonce",
            "operationsSha256", "rootIdentity",
        ],
        step: "plan"
    )
    guard try requireInteger(plan, "schemaVersion", "plan", minimum: 1, maximum: 1) == 1,
          try requireBool(plan, "diagnosticOnly", "plan"),
          try requireString(plan, "evidenceType", "plan") ==
            "promotion-v2-native-security-diagnostic-plan" else {
        throw CandidateFailure("INVALID_SIGNED_PLAN", "plan")
    }
    let transactionId = try validateTransactionId(
        try requireString(plan, "transactionId", "plan")
    )
    let nonce = try requireString(plan, "nonce", "plan")
    guard exactMatch(nonce, regex: noncePattern) else {
        throw CandidateFailure("INVALID_SIGNED_NONCE", "plan.nonce")
    }
    let operationsSha256 = try validateSha256(
        try requireString(plan, "operationsSha256", "plan"),
        "plan.operationsSha256"
    )
    let actualOperationsSha256 = sha256Hex(
        try canonicalJSONData(rawOperations, "operations")
    )
    guard operationsSha256 == actualOperationsSha256 else {
        throw CandidateFailure("SIGNED_OPERATIONS_MISMATCH", "operations")
    }
    let rootIdentity = try requireDictionary(plan["rootIdentity"] as Any, "plan.rootIdentity")
    try requireExactKeys(
        rootIdentity,
        allowed: ["device", "inode"],
        required: ["device", "inode"],
        step: "plan.rootIdentity"
    )
    let signedDevice = try parseUnsignedDecimal(
        try requireString(rootIdentity, "device", "plan.rootIdentity"),
        "plan.rootIdentity.device"
    )
    let signedInode = try parseUnsignedDecimal(
        try requireString(rootIdentity, "inode", "plan.rootIdentity"),
        "plan.rootIdentity.inode"
    )
    guard signedDevice == expectedDevice, signedInode == expectedInode else {
        throw CandidateFailure("SIGNED_ROOT_IDENTITY_MISMATCH", "plan.rootIdentity")
    }

    let signature = try requireDictionary(request["signature"] as Any, "signature")
    try requireExactKeys(
        signature,
        allowed: ["algorithm", "signatureBase64"],
        required: ["algorithm", "signatureBase64"],
        step: "signature"
    )
    guard try requireString(signature, "algorithm", "signature") == "Ed25519",
          let signatureData = Data(
            base64Encoded: try requireString(signature, "signatureBase64", "signature")
          ),
          signatureData.count == 64,
          signatureData.base64EncodedString() ==
            (try requireString(signature, "signatureBase64", "signature")),
          let publicKeyData = Data(
            base64Encoded: PromotionV2DiagnosticBuildConfig.diagnosticPublicKeyBase64
          ),
          publicKeyData.count == 32 else {
        throw CandidateFailure("INVALID_DIAGNOSTIC_SIGNATURE", "signature")
    }
    let publicKey: Curve25519.Signing.PublicKey
    do {
        publicKey = try Curve25519.Signing.PublicKey(rawRepresentation: publicKeyData)
    } catch {
        throw CandidateFailure("INVALID_COMPILED_DIAGNOSTIC_KEY", "build-config")
    }
    let planData = try canonicalJSONData(plan, "plan")
    guard publicKey.isValidSignature(signatureData, for: planData) else {
        throw CandidateFailure("INVALID_DIAGNOSTIC_SIGNATURE", "signature")
    }
    return SignedPlanBinding(
        transactionId: transactionId,
        operationsSha256: operationsSha256,
        planSha256: sha256Hex(planData)
    )
}

private func executeRequest(_ request: [String: Any]) throws -> [String: Any] {
    let action = try requireString(request, "action", "request")
    guard try requireInteger(request, "schemaVersion", "request", minimum: 1, maximum: 1) == helperSchemaVersion,
          try requireBool(request, "diagnosticOnly", "request") else {
        throw CandidateFailure("DIAGNOSTIC_CONTRACT_REQUIRED", "request")
    }
    guard PromotionV2DiagnosticBuildConfig.productionEnabled == false else {
        throw CandidateFailure("PRODUCTION_FUSE_OPEN", "build-config")
    }
    if action == "capabilities" {
        try requireExactKeys(
            request,
            allowed: ["schemaVersion", "diagnosticOnly", "action"],
            required: ["schemaVersion", "diagnosticOnly", "action"],
            step: "request"
        )
        return [
            "ok": true,
            "status": "diagnostic-capabilities-only",
            "productionEnabled": false,
            "platform": "darwin",
            "operations": [
                "openat", "fstatat", "mkdirat", "linkat", "renameatx_np", "unlinkat", "fsync",
            ],
            "flags": [
                "O_NOFOLLOW_ANY": O_NOFOLLOW_ANY,
                "O_RESOLVE_BENEATH": O_RESOLVE_BENEATH,
                "AT_SYMLINK_NOFOLLOW_ANY": AT_SYMLINK_NOFOLLOW_ANY,
                "AT_RESOLVE_BENEATH": AT_RESOLVE_BENEATH,
                "RENAME_EXCL": RENAME_EXCL,
                "RENAME_NOFOLLOW_ANY": RENAME_NOFOLLOW_ANY,
                "RENAME_RESOLVE_BENEATH": RENAME_RESOLVE_BENEATH,
            ],
        ]
    }
    guard action == "execute-diagnostic-batch" else {
        throw CandidateFailure("UNSUPPORTED_ACTION", "request")
    }
    try requireExactKeys(
        request,
        allowed: [
            "schemaVersion", "diagnosticOnly", "action", "rootPath", "expectedRoot",
            "recovery", "operations", "plan", "signature", "crashAfterOrdinal",
        ],
        required: [
            "schemaVersion", "diagnosticOnly", "action", "rootPath", "expectedRoot",
            "recovery", "operations", "plan", "signature",
        ],
        step: "request"
    )
    let rootPath = try requireString(request, "rootPath", "request")
    guard rootPath == PromotionV2DiagnosticBuildConfig.compiledDiagnosticRootPath else {
        throw CandidateFailure("COMPILED_ROOT_MISMATCH", "root")
    }
    let realRoot = try canonicalRealPath(rootPath, "root")
    let realProject = try canonicalRealPath(
        PromotionV2DiagnosticBuildConfig.compiledProjectRootPath,
        "project-root"
    )
    guard realRoot == rootPath,
          !isSameOrDescendant(realRoot, of: realProject),
          !isSameOrDescendant(realProject, of: realRoot) else {
        throw CandidateFailure("DIAGNOSTIC_ROOT_NOT_DISJOINT", "root")
    }
    let expectedRootDictionary = try requireDictionary(request["expectedRoot"] as Any, "expectedRoot")
    try requireExactKeys(
        expectedRootDictionary,
        allowed: ["device", "inode"],
        required: ["device", "inode"],
        step: "expectedRoot"
    )
    let expectedDevice = try parseUnsignedDecimal(
        try requireString(expectedRootDictionary, "device", "expectedRoot"),
        "expectedRoot.device"
    )
    let expectedInode = try parseUnsignedDecimal(
        try requireString(expectedRootDictionary, "inode", "expectedRoot"),
        "expectedRoot.inode"
    )
    let rootDescriptor = rootPath.withCString { pointer in
        Darwin.open(pointer, O_RDONLY | O_DIRECTORY | O_CLOEXEC | O_NOFOLLOW_ANY)
    }
    guard rootDescriptor >= 0 else {
        let code = errno == ELOOP ? "SYMLINK_REJECTED" : "ROOT_OPEN_FAILED"
        throw CandidateFailure(code, "root", errnoValue: errno)
    }
    defer { _ = Darwin.close(rootDescriptor) }
    let rootInfo = try fstatChecked(rootDescriptor, "root-fstat")
    guard (rootInfo.st_mode & S_IFMT) == S_IFDIR,
          sameIdentity(rootInfo, device: expectedDevice, inode: expectedInode) else {
        throw CandidateFailure("ROOT_IDENTITY_MISMATCH", "root")
    }
    let recovery = try requireBool(request, "recovery", "request")
    let crashAfterOrdinal = try optionalInteger(
        request,
        "crashAfterOrdinal",
        "request",
        minimum: 1,
        maximum: 255
    )
    guard let rawOperations = request["operations"] as? [Any], !rawOperations.isEmpty,
          rawOperations.count <= 255 else {
        throw CandidateFailure("INVALID_OPERATION_SET", "operations")
    }
    let signedPlan = try validateSignedPlanBinding(
        request: request,
        rawOperations: rawOperations,
        expectedDevice: expectedDevice,
        expectedInode: expectedInode
    )
    let transactionId = signedPlan.transactionId
    var results: [[String: Any]] = []
    for (index, rawOperation) in rawOperations.enumerated() {
        let operation = try requireDictionary(rawOperation, "operation-\(index + 1)")
        let ordinal = try requireInteger(
            operation,
            "ordinal",
            "operation-\(index + 1)",
            minimum: 1,
            maximum: 255
        )
        guard ordinal == index + 1 else {
            throw CandidateFailure("NONCONTIGUOUS_ORDINAL", "operation-\(index + 1)")
        }
        var result = try applyOperation(
            operation,
            rootDescriptor: rootDescriptor,
            transactionId: transactionId,
            recovery: recovery,
            ordinal: ordinal
        )
        result["ordinal"] = ordinal
        result["kind"] = try requireString(operation, "kind", "operation-\(ordinal)")
        results.append(result)
        if crashAfterOrdinal == ordinal {
            Darwin._exit(86)
        }
    }
    return [
        "ok": true,
        "status": recovery ? "diagnostic-recovery-complete" : "diagnostic-batch-complete",
        "productionEnabled": false,
        "operationsSha256": signedPlan.operationsSha256,
        "signedPlanSha256": signedPlan.planSha256,
        "root": identity(rootInfo),
        "results": results,
    ]
}

private func emit(_ value: [String: Any]) {
    guard JSONSerialization.isValidJSONObject(value),
          let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]),
          let line = String(data: data, encoding: .utf8) else {
        FileHandle.standardOutput.write(Data("{\"ok\":false,\"error\":{\"code\":\"OUTPUT_ENCODING_FAILED\",\"step\":\"emit\"}}\n".utf8))
        return
    }
    FileHandle.standardOutput.write(Data((line + "\n").utf8))
}

@main
private struct PromotionV2NativeHelperMain {
    static func main() {
        do {
            let input = FileHandle.standardInput.readDataToEndOfFile()
            guard !input.isEmpty, input.count <= 16 * 1024 * 1024 else {
                throw CandidateFailure("REQUEST_SIZE_INVALID", "stdin")
            }
            let object = try JSONSerialization.jsonObject(with: input, options: [])
            let request = try requireDictionary(object, "request")
            emit(try executeRequest(request))
            Darwin.exit(0)
        } catch let failure as CandidateFailure {
            var error: [String: Any] = ["code": failure.code, "step": failure.step]
            if let errnoValue = failure.errnoValue {
                error["errno"] = Int(errnoValue)
            }
            emit(["ok": false, "status": "diagnostic-failed-closed", "error": error])
            Darwin.exit(1)
        } catch {
            emit([
                "ok": false,
                "status": "diagnostic-failed-closed",
                "error": ["code": "UNEXPECTED_NATIVE_FAILURE", "step": "main"],
            ])
            Darwin.exit(1)
        }
    }
}
