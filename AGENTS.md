# Atmosphere Up

Node.js ESM CLI that assembles Nintendo Switch SD card packs from a selected HOS
version. Use pnpm and follow the installed dependencies and existing modules.

## Language and documentation

- Use English for repository content, including prompts, comments, and commits.
- Start custom prompt messages with lowercase letters. Keep Clack's built-in
  labels unchanged and preserve component branding in option labels.
- README describes features, sources, and useful defaults. Put maintenance and
  implementation details in this file or the relevant skill.

## Project structure

| Location | Responsibility |
| --- | --- |
| `src/cli.ts`, `src/config.ts`, `src/types.ts` | CAC options and unconfig configuration |
| `src/commands/build.ts` | User interaction and build lifecycle |
| `src/core/` | Bundle catalog, release resolution, installation, and output |
| `src/extensions/index.ts` | Ordered extension categories, prompts, and resolvers |
| `src/extensions/*.ts` | One feature category per module; prompts and resolvers return arrays |
| `src/firmware.ts` | Optional firmware for the exact selected HOS version |
| `src/download/` | GitHub authentication, releases, and downloads |
| `src/constants.ts` | Repository names and CLI defaults |
| `src/utils.ts` | Reusable or complex pure helpers |
| `assets/sigpatches/` | Prepared patch ZIPs, HOS/Atmosphere manifest, and provenance |
| `assets/mission-control/versions.json` | HOS to exact Mission Control release tag |
| `assets/defaults/` | Files copied into every pack after extracting core components |

## Build behavior to preserve

- Supported HOS versions come from the sigpatches manifest. Atmosphere uses the
  bundle's exact `atmosphereTag`; other core repositories currently use latest
  releases. Mission Control uses its HOS mapping. Horizon OC checks its release's
  `ams_ver.txt` against the selected Atmosphere version.
- Check the destination and confirm replacement before downloads. Assemble core,
  select and install extensions, optionally download firmware, then write the
  manifest and finalize directory or ZIP output.
- Extension categories stay in this order: save management, file management,
  cheats, performance tuning, performance monitoring, controller support,
  streaming, Amiibo. Default categories are save management, file management,
  and cheats. Ask for tools only in selected categories.
- `--ext` and `--firmware` default to true; their negative forms skip their
  respective prompts. `--pack` defaults to false. `output` is a parent directory:
  create `atmosphere-<AMS>-hos-<HOS>/` or the same name with `.zip`. ZIP contents
  start at the SD card root. The repository config sets the parent to `./output`.
- Use staging and the existing AbortSignal flow. Cancellation removes temporary
  files; preserve an existing output until the replacement has been assembled.
- Keep shared extension dependencies deduplicated. An enhanced Sys Clk overlay
  replaces the original overlay while preserving the required service/manager.
- Keep overlay memory at 8 MiB and the hotkey at L + D-pad Down. Cheats default
  off without remembered toggles. Other shipped configuration lives in
  `assets/defaults`; change these defaults only when the task calls for it.
- `assets` is included in the npm package and referenced by built modules. Do not
  move configuration into embedded strings or assume it lives under `dist`.

## Implementation conventions

- Prefer installed libraries: tinyglobby for file discovery, verkit for versions,
  adm-zip for ZIP reading/writing, @octokit/rest for GitHub, tinyexec for commands,
  and ini for INI editing. Use `getRepositoryUrl` for GitHub links.
- Keep code simple and leave blank lines between stages. Use an options object
  when a function would otherwise have more than three configuration arguments.
- Use ansis for prompt messages and tildify for displayed paths. Do not color
  `select` or `multiselect` option labels.
- Add inline dependencies to devDependencies only when they are ESM and suitable
  for bundling. Maintain the `inlined` catalog through `pncat.config.ts` and
  `pnpm pncat mig -f`. Keep existing production dependencies in place.
- GitHub credentials use `GITHUB_TOKEN`, then `gh auth token`. Never print tokens.

## Version maintenance skill

For new HOS support, Atmosphere bundle changes, sigpatch refreshes, or Mission
Control compatibility updates, read
[atmosphere-up-version-update](.agents/skills/atmosphere-up-version-update/SKILL.md)
before changing version data. This repository skill covers source collection,
standalone patch preparation, exact tags, controller mappings, and firmware.

## Verification and delivery

- Run relevant tests for changed behavior. Before delivering code changes, run
  `pnpm lint`, `pnpm typecheck`, `pnpm exec vitest run`, and `pnpm build`.
- Use small English conventional commits when committing. Respect any request
  to wait before committing or pushing. Do not wait for CI after a push.
- Regenerate `help.png` when CLI help changes and screenshot updates are part of
  the task: `pnpx termsnap "pnpm start --help" --png --font-family "MonoLisa"`,
  then rename `termsnap.png` to `help.png`. Run in a terminal; termsnap requires
  TTY input. If pnpx has a missing cached entry, force a fresh run with
  `pnpm --config.dlx-cache-max-age=0 dlx termsnap ...`. Unset `NO_COLOR` for that
  invocation if it conflicts with `FORCE_COLOR` and adds warnings to the image.
