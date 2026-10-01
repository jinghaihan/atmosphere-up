# HOS 23.0.0 patch resource

Collected on 2026-10-01 for official Atmosphere `1.12.0`, build `28d6a2e11`.
The CLI supports this pair through both the HOS prompt and `--version 23.0.0`.

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

The CLI's core download and directory assembly completed for this pair with
optional modules and firmware downloads disabled. All 253 source IPS files and
the full patch table matched the generated pack byte-for-byte. The firmware
resolver selected the exact 23.0.0 release and asset; its ZIP was not downloaded
as part of this check.

## Compatibility checks and limitations

- [Hekate v6.5.4](https://github.com/CTCaer/hekate/releases/tag/v6.5.4) and
  [Lockpick RCM v2.0.1](https://github.com/impeeza/Lockpick_RCMDecScots/releases/tag/v2.0.1)
  explicitly support HOS 23.0.0. The existing latest-release resolvers select them.
- The exact [firmware release](https://github.com/THZoria/NX_Firmware/releases/tag/23.0.0)
  provides `Firmware.23.0.0.zip` (340,421,224 bytes).
- Mission Control maps HOS 23.0.0 to `v0.15.2`, the latest published release
  checked during this update. This is a resource selection, not a claim of
  verified HOS 23.0.0 compatibility.
- Horizon OC uses its latest release without an Atmosphere compatibility gate.
- Sys Patch v1.6.2.3 and Ultrahand v2.5.3 retain their existing latest-release
  resolution. The sigpatch publisher states that Sys Patch does not require
  an update for HOS 23.0.0. Other optional modules retain their current resolvers;
  this metadata does not establish their console-tested compatibility.

## Known issues and follow-up

Last checked: **2026-10-01**. These notes track upstream problems and reports;
they do not add installation restrictions. The HOS selector shows a red
`high risk` hint for 23.0.0, and selected modules are still assembled.

| Module | Version checked | Status |
| --- | --- | --- |
| Atmosphere DNS.mitm | 1.12.0 | Maintainer-confirmed bug; fix not yet released |
| Mission Control | v0.15.2 | User-reported HOS 23.0.0 problems; explicit support not yet published |
| Horizon OC | 2.5.1 | Yellow-screen boot report; project member says adaptation is waiting for the next Atmosphere minor release |

### Atmosphere: incomplete Nintendo DNS interception

Some HOS 23.0.0 system modules use new `sfdnsres` commands that Atmosphere 1.12.0
does not intercept. Nintendo connections can therefore get through despite the
configured hosts rules. The issue reporter also observed an all-blocked result
from 90DNS Tester while system requests still reached Nintendo; that result does
not establish that all system DNS requests are intercepted.

- Evidence: [issue 2863](https://github.com/Atmosphere-NX/Atmosphere/issues/2863)
  and [hexkyz's confirmation](https://github.com/Atmosphere-NX/Atmosphere/issues/2863#issuecomment-5895423675).
  The maintainer implemented handling for the new Query/Fetch request pair and
  plans to include it in a subsequent minor release. The issue is still open,
  and the latest published Atmosphere release checked is 1.12.0.
- Follow-up: check the [Atmosphere releases](https://github.com/Atmosphere-NX/Atmosphere/releases)
  for the published fix. Collect patches matching that release's actual build
  before changing the HOS 23.0.0 bundle's `atmosphereTag` and resource metadata.
  Signature patches do not fix this DNS bug.

### Mission Control: controller connections and vibration

The [v0.15.2 release notes](https://github.com/ndeadly/MissionControl/releases/tag/v0.15.2)
declare support for HOS 22.5.0. Users report connection failures on HOS 23.0.0.
One user tested a separate fork with updated libraries: controllers connected,
but DualSense/DualShock 4 vibration did not work. That fork is not the release
selected by this CLI.

- Evidence: [issue 1150](https://github.com/ndeadly/MissionControl/issues/1150),
  [the connection report](https://github.com/ndeadly/MissionControl/issues/1150#issuecomment-5900524716),
  and [the fork experiment](https://github.com/ndeadly/MissionControl/issues/1150#issuecomment-5910749021).
  These are user reports, not a maintainer confirmation of universal failure.
- Current selection: `assets/mission-control/versions.json` maps 23.0.0 to
  `v0.15.2`; integration is allowed. This mapping does not prove compatibility.
- Follow-up: check [Mission Control releases](https://github.com/ndeadly/MissionControl/releases)
  for explicit HOS 23.0.0 support and controller/rumble fixes, then update the
  23.0.0 mapping to the intended published tag and verify its ZIP asset.

### Horizon OC: yellow screen during boot

A user reports a yellow screen with HOS 23.0.0, Atmosphere 1.12.0, and Hekate
6.5.4 when the Horizon OC boot entries are enabled. Horizon OC 2.5.1 still lists
Atmosphere 1.11.2 in its `ams_ver.txt`. This version declaration alone does not
establish the cause of the reported failure.

- Evidence: [issue 114](https://github.com/Horizon-OC/Horizon-OC/issues/114),
  [the project member's release-plan response](https://github.com/Horizon-OC/Horizon-OC/issues/114#issuecomment-5895980779),
  and [2.5.1 version metadata](https://github.com/Horizon-OC/Horizon-OC/blob/2.5.1/ams_ver.txt).
  The response says the project is waiting for the next Atmosphere minor release
  because of the DNS bug and additional reported browser memory concerns.
- Current selection: latest release; no `ams_ver.txt` installation check.
- Follow-up: check [Horizon OC releases](https://github.com/Horizon-OC/Horizon-OC/releases)
  and issue 114 for an adaptation targeting the updated Atmosphere/HOS pair.
  Verify that the existing `dist.zip` layout and boot configuration still match
  the resolver. Do not describe successful extraction as a successful boot test.

### Closing or updating these records

- Record the new upstream version, source link, and check date when a fix ships.
- Keep release notes, user reports, and local console tests distinguishable.
- Reassess the 23.0.0 `high risk` hint after checking the published fixes above.
  A successful pack build alone does not establish that these issues are fixed.
- Compatibility of other optional modules has not been established on hardware
  in this repository. Do not add more modules to the issue list without evidence.
