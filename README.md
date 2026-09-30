# atmosphere-up

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Usage

Requires Node.js 20.18.1 or newer. Select a supported HOS version from the prompt:

```sh
pnpm start
pnpm start ./output
pnpm start ./output --pack
```

`output` is a parent directory. For HOS 21.2.0, these commands create
`output/atmosphere-1.10.2-hos-21.2.0/` or
`output/atmosphere-1.10.2-hos-21.2.0.zip`. Without an output setting, the named
pack is created in the current working directory. ZIP contents start at the SD
card root, with no enclosing package directory.

If the destination already exists, the CLI asks before replacing it. Refusing
or cancelling stops the build. The existing pack remains in place until the new
pack has been assembled.

Progress shows the current component, downloaded byte count,
extraction, configuration, and ZIP compression. Press Ctrl+C to cancel an active
build. Downloads stop and the temporary build directory is removed before exit.

The bundled sigpatch catalog determines the selectable HOS versions and exact
Atmosphere release tags. Hekate, DBI, sys-patch, and Ultrahand use their latest
GitHub releases. Firmware files are not downloaded or included.

### Core components

| Component | Source | Included files |
| --- | --- | --- |
| Atmosphere | [Atmosphere-NX/Atmosphere](https://github.com/Atmosphere-NX/Atmosphere) | Official ZIP and fusee.bin; bundled Daybreak, hbmenu, hbloader, and other upstream tools |
| Hekate | [CTCaer/hekate](https://github.com/CTCaer/hekate) | Official ZIP and payload; CFW emuMMC, CFW sysMMC, and stock sysMMC boot entries |
| DBI | [rashevskyv/dbi](https://github.com/rashevskyv/dbi) | DBI.nro and the upstream dbi.config |
| sys-patch | [impeeza/sys-patch](https://github.com/impeeza/sys-patch) | Release ZIP |
| Ultrahand | [ppkantorski/Ultrahand-Overlay](https://github.com/ppkantorski/Ultrahand-Overlay) | sdout.zip, including its bundled nx-ovlloader |
| Sigpatches | [Bundled catalog](./assets/sigpatches/README.md) | Matching IPS patches and Hekate patches.ini |

Reboot to Payload returns to Hekate. CFW boot entries use `pkg3` and
`kip1patch=nosigchk`. A `pack-manifest.json` records the selected versions,
sources, and downloaded file hashes.

Ultrahand opens with **L + D-pad Down** (`L+DDOWN`). The pack writes this default
to both `config/ultrahand/config.ini` and the Tesla-compatible
`config/tesla/config.ini`.

Pack assembly has been verified locally; boot compatibility has not been tested
on Switch hardware.

## Configuration

Create `atmosphere-up.config.ts` in the working directory:

```ts
import { defineConfig } from 'atmosphere-up'

export default defineConfig({
  output: './output',
  pack: false,
})
```

The repository's config writes to `./output` by default. CLI arguments override
configuration: `--pack` enables ZIP output and `--no-pack` enables directory
output. Use `--cwd <directory>` to select a different working directory and config.
Relative output paths resolve from that working directory.

Release files download from their public GitHub URLs, while version queries use
the GitHub API. Authentication automatically reads `GITHUB_TOKEN` from the
environment, or reuses an existing GitHub CLI login through
`gh auth token --hostname github.com`. No environment variable is needed when
`gh` is already logged in. Without either credential source, requests are
anonymous and use GitHub's lower API rate limit.

GitHub queries and downloads honor `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY`
(including their lowercase forms) through Undici's `EnvHttpProxyAgent`.

## License

[MIT](./LICENSE) License © [jinghaihan](https://github.com/jinghaihan)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/atmosphere-up?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/atmosphere-up
[npm-downloads-src]: https://img.shields.io/npm/dm/atmosphere-up?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/atmosphere-up
[bundle-src]: https://img.shields.io/bundlephobia/minzip/atmosphere-up?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=atmosphere-up
[license-src]: https://img.shields.io/badge/license-MIT-blue.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/jinghaihan/atmosphere-up/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/atmosphere-up
