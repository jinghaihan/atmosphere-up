# HOS 23.0.0 patch resource

Prepared on 2026-10-01 for official Atmosphere `1.12.0`, build `28d6a2e11`.
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
| Prepared file | [sigpatches-hos-23.0.0-ams-1.12.0.zip](archives/sigpatches-hos-23.0.0-ams-1.12.0.zip) |
| Prepared size | 2,912 bytes |
| Prepared SHA-256 | `f7764b549d7ec6a7734c4214e1a681e9936dc4d3092ee1c3058e2e45a0d8e22a` |
| Contents | 8 IPS files and `bootloader/patches.ini` with 3 sections |

## Selection evidence

- The [official release](https://github.com/Atmosphere-NX/Atmosphere/releases/tag/1.12.0)
  supports HOS 23.0.0. Its ZIP filename identifies build `28d6a2e11`.
- The compressed Loader KIP extracted from the official release's `package3`
  hashes to `92f34a795aa6f8cfaa2c888e9357f05fbc50da6ede6a34de0a58411eb546e0bc`,
  matching the retained loader IPS filename and patch table section.
- The upstream table explicitly labels the two retained FS sections as
  HOS 23.0.0 FAT32 and exFAT, and the loader section as Atmosphere 1.12.0.
- For ES, NIFM, NIM, NS, and OLSC, the publisher's 23.0.0 archive adds
  exactly one build ID per module relative to the collected 22.5.0 bundle.
  [The firmware change report](https://switchbrew.org/wiki/23.0.0#System_Titles)
  lists all five modules as updated. This comparison is the selection basis;
  their build IDs have not been independently extracted from firmware NCAs.

| Module | Retained IPS identifier |
| --- | --- |
| ES | `702CD302FB341300BB1D69C96C7FC66FB80BE599` |
| NIFM | `2E29B2674BF76671333C96F3272B1CA6CECF8477` |
| NIM | `7A0ECCE9375DC38BA907EE7F9F4BD6046075AF96` |
| NS | `3B048F336B810609A90F0D58605A340BA520A983` |
| OLSC | `1751AD2220758F048485F796013935F327BE89C9` |
| FS FAT32 | `34383EE7999263403BA7577817404E72A2BDE0B14A7B309DD26E685A94D6E145` |
| FS exFAT | `FDAF163288E1080549189EC8CAF29D1E14335021739AC0A7353460108A5B2411` |
| Atmosphere Loader | `92F34A795AA6F8CFAA2C888E9357F05FBC50DA6EDE6A34DE0A58411EB546E0BC` |

The original ZIP contains 253 IPS files. Historical FS, loader, and ExeFS
identifiers were removed. AM patches target the earlier homebrew compatibility
issue and have no new 23.0.0 identifier in this source. USB and browser IPS files
were excluded because official Atmosphere already embeds those patches in its
[USB patch table](https://github.com/Atmosphere-NX/Atmosphere/blob/1.12.0/stratosphere/loader/source/ldr_embedded_usb_patches.inc)
and [browser patch table](https://github.com/Atmosphere-NX/Atmosphere/blob/1.12.0/stratosphere/loader/source/ldr_embedded_web_patches.inc); the
pack enables USB 3.0 through its default configuration. The stock ERPT IPS was
also excluded: official Atmosphere ships its own
[ERPT replacement](https://github.com/Atmosphere-NX/Atmosphere/blob/1.12.0/docs/components/modules/erpt.md),
and its release ROMFS includes program `010000000000002b`. A stock module's
build-ID patch does not apply to that replacement.

IPS payloads are byte-identical to upstream. The three retained patch table
sections preserve their comments and patch lines. Entries are sorted and use
fixed timestamps. CRC integrity, payload equality, and reproducible ZIP output
were checked. Console testing has not been performed.

## Before enabling CLI support

- Mission Control's latest release checked during collection is `v0.15.2`,
  whose release notes cover HOS 22.5.0. A verified 23.0.0 mapping is pending.
- Atmosphere 1.12.0 has a confirmed DNS.mitm interception gap on HOS 23.0.0.
  [The maintainer confirmed a fix for a subsequent minor release](https://github.com/Atmosphere-NX/Atmosphere/issues/2863#issuecomment-5895423675).
  These signature patches do not address it.
- Firmware availability and the remaining core/optional module compatibility
  checks are pending the full version-support update.
