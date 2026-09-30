---
name: atmosphere-up-version-update
description: Maintain atmosphere-up support for new HOS or Atmosphere versions by preparing sigpatch bundles, updating exact release tags and Mission Control mappings, and checking firmware availability. Use when adding or revising supported version data in this repository.
---

# Atmosphere Up Version Update

Update the repository's version data so the CLI can assemble the requested pack.
Read root `AGENTS.md` first. Paths below are relative to the repository root.

## Read the current data

- `assets/sigpatches/manifest.json` and `assets/sigpatches/README.md`: supported
  HOS/Atmosphere pairs, upstream sources, patch revisions, and preparation notes.
- `src/core/catalog.ts` and `src/core/plan.ts`: selectable HOS versions and exact
  Atmosphere tag resolution.
- `assets/mission-control/versions.json` and
  `src/extensions/controller-support.ts`: controller compatibility mapping.
- `src/constants.ts` and `src/firmware.ts`: repository sources and firmware lookup.

The CLI gets its entire supported HOS list from `manifest.bundles`. A new manifest
entry exposes that HOS immediately, including through `--version`. Maintain one
selected Atmosphere pair per HOS; the current CLI does not offer an Atmosphere
version picker. Keep existing historical support unless removal was requested.

## 1. Collect sigpatch sources and select Atmosphere

Start with patch availability. Follow source pages recorded in the manifest,
including the [GBATemp publisher thread](https://gbatemp.net/threads/sigpatches-for-atmosphere-hekate-fss0-fusee-package3.571543/),
and inspect the relevant attachment and publisher's compatibility notes.

Confirm the matching release in
[Atmosphere-NX/Atmosphere](https://github.com/Atmosphere-NX/Atmosphere/releases).
Use the actual GitHub release tag, release notes, and build identifier. A patch
bundle's filename alone is insufficient to identify its Atmosphere build.

Keep numeric labels such as `1.8.0` separate from official tags such as
`1.8.0-prerelease`. Suffixes such as `P2`, `V6`, `master`, and commit hashes belong
in source filenames or notes; they are not numeric versions. A historical tag
may retain `prerelease` even after GitHub marks that release stable.

For each downloaded source, record its original filename, publisher if known,
source page, direct download URL, byte size, and SHA-256. Preserve unknown
publishers as null. Use a temporary collection directory outside tracked assets;
commit the prepared ZIP and provenance, not redundant upstream packages.

Do not add a HOS merely because Atmosphere supports it. If matching patches or
build evidence are missing, leave it out and report the missing resource. If
several credible patch sources disagree, inspect their payloads and document the
chosen source; do not silently combine conflicting bytes.

## 2. Prepare one complete patch ZIP

Use adm-zip and the established standalone bundle format. Inspect the archive
before assembling it. Keep only:

- IPS payloads under `atmosphere/exefs_patches/` and `atmosphere/kip_patches/`.
- `bootloader/patches.ini`.

Exclude upstream boot configurations, payload binaries, applications, and other
pack content. `assets/defaults` supplies this project's configuration. Preserve
upstream patch payload bytes and identifiers; normalize the ZIP container name,
not the contents of the patches.

If upstream only provides a supplement, combine it with its documented base
before committing. Include both sources in provenance. Compare duplicate paths
and `patches.ini` sections: retain identical entries once, apply explicitly
superseding revisions, and resolve unexplained conflicts from source evidence.
The result must extract into a clean directory with no earlier bundle required.
Do not add runtime supplement merging to the CLI.

Use sorted entry paths, fixed ZIP timestamps, and consistent compression to
match the existing reproducible archives. Check archive integrity, retained
source payload equality, and any changed patch table sections. Record the
prepared ZIP's digest separately from each upstream ZIP's digest.

## 3. Update the bundle manifest

Keep the existing schema and fields. For HOS `<HOS>` and numeric Atmosphere `<AMS>`:

| Field | Value |
| --- | --- |
| `id` | `hos-<HOS>-ams-<AMS>` |
| `file` | `archives/sigpatches-hos-<HOS>-ams-<AMS>.zip` |
| `labels.hos` | Exact HOS version |
| `labels.atmosphere` | Numeric Atmosphere version |
| `atmosphereTag` | Exact upstream GitHub release tag |
| `sha256` | SHA-256 of the prepared ZIP |
| `bytes` | Prepared ZIP size in bytes |
| `ips` | Number of IPS/IPS32 patch files |
| `sources` | Original source metadata and digests |
| `notes` | Build evidence, patch revisions, and any base/supplement merge |

Keep entries in numeric HOS order, update `preparedOn` when preparing resources,
and update the bundle table and preparation notes in
`assets/sigpatches/README.md`. Never reuse an old digest or byte count after
rewriting a ZIP. Resource metadata does not establish hardware-tested compatibility.

## 4. Confirm Mission Control mapping

Review releases and compatibility notes from
[ndeadly/MissionControl](https://github.com/ndeadly/MissionControl/releases).
Select an exact published tag whose stated HOS and Atmosphere requirements cover
the new pair. Check its ZIP asset matches the current resolver's filename pattern.

Add the HOS key to `assets/mission-control/versions.json`, preserving the actual
`v` prefix or other upstream tag spelling. Match the supported HOS keys in the
sigpatch manifest; a missing key fails when controller support is selected.
Reuse an existing tag only when its stated compatibility covers the new HOS.
Do not infer compatibility from a neighboring version or fall back to latest.
Record the release-note basis in the delivery summary or commit description.
If no compatible release exists, report it before claiming complete new-version
support; do not silently change the resolver's missing-mapping behavior.

Sys Con currently uses latest and has no maintained version table.

## 5. Check firmware and other version-sensitive resources

- In [THZoria/NX_Firmware](https://github.com/THZoria/NX_Firmware/releases), confirm
  the exact HOS tag and its `Firmware.<HOS>.zip` asset. The CLI offers this after
  core and extensions, unless `--no-firmware` was supplied. Keep the exact-version
  lookup and `firmware/<HOS>/` output; no latest fallback or firmware vendoring.
- Check relevant Hekate, sys-patch, and loader release notes for the new target.
  They currently use latest; update selection code only if an actual upstream
  asset or compatibility change requires it.
- Horizon OC compares its latest release's `ams_ver.txt` with the chosen
  Atmosphere version. Report a mismatch as an optional-extension limitation;
  preserve the check rather than weakening it to make a build succeed.
- Other extensions use latest unless their resolver says otherwise. Distinguish
  a published compatibility statement from an actual hardware test.

A missing exact firmware release is a limitation of the optional firmware step.
Report it explicitly; do not substitute another HOS version.

## 6. Verify and deliver

Update the supported-version expectation in `test/core/catalog.test.ts`; its
archive test checks each bundle's digest. Check every supported HOS has an
existing mapped Mission Control release. When changing a resolver, cover the
actual tag/asset behavior with a focused test.

Run `pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`, and `pnpm build`.
For changes to shipped assets or package layout, also inspect `pnpm pack` output
in a temporary destination: the prepared archives, Mission Control JSON, and
defaults must be included through the package's `assets` entry.

An end-to-end download run is useful when downloads or installation changed;
use the requested HOS and relevant extensions. Metadata and archive checks are
sufficient for an ordinary version-data update unless hardware verification was
requested. Never describe those checks as console testing.

Summarize the HOS/Atmosphere pair, patch provenance, Mission Control tag, firmware
availability, and any optional-extension limitations. Commit and push according
to the user's current authorization; npm publishing is a separate action. Do not
wait for CI after pushing.
