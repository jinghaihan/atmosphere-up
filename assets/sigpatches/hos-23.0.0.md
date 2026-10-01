# HOS 23.0.0 patch resource

Collected on 2026-10-01 for official Atmosphere `1.12.0`, build `28d6a2e11`.
This resource is collected but not listed in `manifest.bundles`; it does not yet
enable HOS 23.0.0 in the CLI.

## Provenance

| Field | Value |
| --- | --- |
| Publisher | bth |
| Original filename | `Hekate+AMS-package3-sigpatches-Atmosphere-1.12.0-master-28d6a2e11-cfw-23.0.0.zip` |
| Source | [Publisher post](https://gbatemp.net/threads/sigpatches-for-atmosphere-hekate-fss0-fusee-package3.571543/post-10914627) |
| Download | [Original attachment](https://gbatemp.net/attachments/hekate-ams-package3-sigpatches-atmosphere-1-12-0-master-28d6a2e11-cfw-23-0-0-zip.592829/) |
| Original size | 76,378 bytes |
| Original SHA-256 | `8b437166490b4683bdb36a64458d6ce855247faba203c151290dfba8900d11e9` |
| Stored file | [sigpatches-hos-23.0.0-ams-1.12.0.zip](archives/sigpatches-hos-23.0.0-ams-1.12.0.zip) |
| Stored size | 76,378 bytes |
| Stored SHA-256 | `8b437166490b4683bdb36a64458d6ce855247faba203c151290dfba8900d11e9` |
| Contents | 253 IPS files and `bootloader/patches.ini` with 84 sections |

## Build evidence and archive handling

The [official Atmosphere 1.12.0 release](https://github.com/Atmosphere-NX/Atmosphere/releases/tag/1.12.0)
supports HOS 23.0.0 and identifies build `28d6a2e11`, matching the publisher's
archive. Its Loader KIP SHA-256 matches the source's
`92F34A795AA6F8CFAA2C888E9357F05FBC50DA6EDE6A34DE0A58411EB546E0BC.ips`.

The stored ZIP is byte-identical to the original attachment; only its filename
has been normalized. All upstream patches and patch table sections are retained,
including historical entries. No module selection or patch trimming is applied.
CRC integrity, SHA-256, and equality with the downloaded source were checked.
Console testing has not been performed.

## Before enabling CLI support

- Mission Control's latest release checked during collection is `v0.15.2`,
  whose release notes cover HOS 22.5.0. A verified 23.0.0 mapping is pending.
- Atmosphere 1.12.0 has a confirmed DNS.mitm interception gap on HOS 23.0.0.
  [The maintainer confirmed a fix for a subsequent minor release](https://github.com/Atmosphere-NX/Atmosphere/issues/2863#issuecomment-5895423675).
  These signature patches do not address it.
- Firmware availability and the remaining core/optional module compatibility
  checks are pending the full version-support update.
