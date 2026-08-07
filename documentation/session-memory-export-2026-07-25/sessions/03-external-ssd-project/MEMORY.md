# Session memory — External SSD as Codex project

Thread: `019f9217-6e77-7710-9535-a18a82d9d04d`

## Conclusion

A Thunderbolt 4 NVMe SSD can be the live Codex project disk. Codex can read,
modify, create, test, build, and use Git directly in that mounted project.

## Recommended setup

- Format: APFS.
- Partition scheme: GUID Partition Map.
- Use encryption if desired, but unlock the volume before opening the project.
- Add the actual project root, not the entire external disk, as the Codex local
  project folder.
- Make that folder primary, or open it as the only folder in a new local
  project.
- Keep the disk name and mount path stable.
- Allow macOS removable-volume access when prompted.
- Keep roughly 15–20% free space for builds, evidence, temporary extraction, and
  caches.

## Boundaries

- `Add folder` does not copy data; copy/clone and verify first.
- An external SSD is not a backup. Preserve another verified copy of the
  irreplaceable Flash sources.
- Do not unplug or rename the disk while tasks are running.
- Codex cloud tasks cannot directly access a Mac-mounted disk.
- APFS is preferred over ExFAT for Git permissions, symlinks, case behavior, and
  the Node.js workspace.

## Import-time correction

The real project folder is `/Volumes/WestWorld/HELP MATH 2.0`. At import time
the Codex saved project still pointed to the nonexistent
`/Volumes/WestWorld/HELP MATH_Flash_To_JS`. Reopen/update the saved project and
verify `cwd` before continuing.

