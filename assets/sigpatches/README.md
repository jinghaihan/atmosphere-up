# Sigpatch bundles

Each ZIP is a standalone patch bundle for extraction into a clean staging directory. Pack assembly can select one bundle without applying incremental updates or merging patch tables at runtime. The CLI uses the manifest to offer supported HOS versions and select the matching Atmosphere release.

`manifest.json` records bundle paths, SHA-256 hashes, sizes, numeric versions, official `atmosphereTag` values, and upstream sources with their original hashes. These records identify resources; they are not a hardware-tested compatibility matrix.

## Naming

Files follow `sigpatches-hos-X.Y.Z-ams-X.Y.Z.zip`, with IDs of `hos-X.Y.Z-ams-X.Y.Z`. `labels.atmosphere` contains only the numeric version. Official release tags are stored separately in `atmosphereTag`. Upstream filenames, build markers, and patch revisions remain in `sources`.

## Available bundles

| HOS version | Atmosphere version | Official release tag | IPS files |
| --- | --- | --- | ---: |
| 16.1.0 | 1.6.1 | 1.6.1-prerelease | 150 |
| 17.0.0 | 1.6.1 | 1.6.1-prerelease | 154 |
| 18.0.0 | 1.7.0 | 1.7.0-prerelease | 160 |
| 18.1.0 | 1.7.1 | 1.7.1 | 164 |
| 19.0.0 | 1.8.0 | 1.8.0-prerelease | 173 |
| 21.2.0 | 1.10.2 | 1.10.2 | 220 |
| 22.0.0 | 1.11.0 | 1.11.0 | 226 |
| 22.1.0 | 1.11.1 | 1.11.1 | 191 |
| 22.5.0 | 1.11.2 | 1.11.2 | 225 |

The nine ZIPs total 518,207 bytes (about 506 KiB). Tags were checked against the [official Atmosphere releases](https://github.com/Atmosphere-NX/Atmosphere/releases). Historical tags may retain `prerelease` after a release becomes stable, so the tag alone does not establish its current GitHub release status. Patch compatibility still requires checking the specific build; relevant identifiers remain in source records, patch tables, and notes.

Separate historical sources for HOS 20.x, 21.0.x, and 21.1.0 have not been collected. The 21.2.0 source includes older loader patches whose coverage needs further review. The [17.0.0 publisher post](https://gbatemp.net/threads/sigpatches-for-atmosphere-hekate-fss0-fusee-package3.571543/post-10275682) claims coverage from HOS 1.0.0 through 17.0.0; individual 16.0.x mappings are also pending.

## Preparation

### Collected HOS 23.0.0 resource

[HOS 23.0.0 / Atmosphere 1.12.0](hos-23.0.0.md) uses the original publisher ZIP
with 253 IPS files and 84 patch table sections (76,378 bytes). Its bytes are
unchanged; only the filename is normalized. Provenance, build evidence, and
pending support checks are recorded separately. It is not yet exposed by the CLI manifest.

### Supported bundles

- ZIPs contain only IPS files under `atmosphere/exefs_patches/` and `atmosphere/kip_patches/`, plus `bootloader/patches.ini`.
- Upstream `hekate_ipl.ini` files and boot configuration templates were removed. The CLI applies its own boot configuration from `assets/defaults`.
- The 22.0.0 bundle combines the 21.2.0 base with six IPS files from the 22.0.0 supplement. Its patch tables were merged after confirming that the added file paths and table sections did not conflict.
- The 22.0.0 loader ID `82ABC222A5859040` matches the Atmosphere 1.11.0 / `931e3c37f` entry in the upstream 22.1.0 bundle, providing the basis for its version label.
- The 22.1.0 bundle uses bth's complete source. It does not mix in AmeliaFox's supplement, whose patch contents differ in some places.
- IPS payloads retain their upstream bytes. Patch tables are also unchanged except for the premerged 22.0.0 table.
- Repacked ZIPs use fixed timestamps, sorted paths, and consistent compression settings. Sources that already contain only patch resources can be stored unchanged. Source URLs and original SHA-256 hashes provide provenance.

Bundles retain the complete patch sets and historical entries supplied by their publishers. The collected 23.0.0 resource follows the same policy.

## Assembly and verification

These bundles target clean staging directories. Updating an existing SD card also requires handling old patches and configuration; overwriting files does not remove stale content.

Official fusee stopped applying IPS patches to KIPs in Atmosphere 1.7.0. Static KIP patches require an appropriate Hekate package3 boot configuration. See the [Atmosphere release notes](https://github.com/Atmosphere-NX/Atmosphere/releases/tag/1.7.0-prerelease).

Checks covered source ZIP CRCs, paths, file categories, and IPS/IPS32 record structure. Prepared ZIPs were checked for CRC integrity, source payload equality, merged 22.0.0 sections, and SHA-256 hashes. Archive contents were not executed. Hardware testing remains pending. The CLI verifies bundle hashes before extraction, and the npm package includes these resources through its `assets` entry.
