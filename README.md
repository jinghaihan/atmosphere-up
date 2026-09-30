# atmosphere-up

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Usage

Requires Node.js 20.18.1 or newer. Select a supported HOS version from the prompt:

```sh
npx atmosphere-up
```

`output` is a parent directory. For HOS 21.2.0, the CLI creates
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

Atmosphere and sigpatches match the selected HOS version. Hekate, DBI, sys-patch,
and Ultrahand use their latest releases. Firmware files are not included.

### Core components

| Component | Source | Includes |
| --- | --- | --- |
| Atmosphere | [Atmosphere-NX/Atmosphere](https://github.com/Atmosphere-NX/Atmosphere) | Atmosphere, fusee, Daybreak, hbmenu, hbloader, and other upstream tools |
| Hekate | [CTCaer/hekate](https://github.com/CTCaer/hekate) | Bootloader with CFW emuMMC, CFW sysMMC, and stock sysMMC boot entries |
| DBI | [rashevskyv/dbi](https://github.com/rashevskyv/dbi) | DBI with its default configuration |
| Sys Patch | [impeeza/sys-patch](https://github.com/impeeza/sys-patch) | System patching service and overlay |
| Ultrahand | [ppkantorski/Ultrahand-Overlay](https://github.com/ppkantorski/Ultrahand-Overlay) | Overlay menu and nx-ovlloader |
| Sigpatches | [Supported versions](./assets/sigpatches/README.md) | Patches for the selected HOS and Atmosphere versions |

Reboot to Payload returns to Hekate. Each pack includes a manifest listing its
component versions.

Ultrahand opens with **L + D-pad Down**.

### Pack defaults

- Overlays use an 8 MiB memory allocation.
- Cheats start disabled. Toggle state is saved only when a toggle file already
  exists.
- USB 3.0 is enabled for homebrew.
- Serial number information is hidden in emuMMC, while sysMMC keeps its original
  information.
- Nintendo services are blocked while running Atmosphere on sysMMC or emuMMC.
  Connectivity-test domains are excluded from blocking. Stock sysMMC is unaffected.

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

Authentication uses `GITHUB_TOKEN` when set, otherwise an existing GitHub CLI
login. Without either, downloads and release queries run anonymously.

GitHub queries and downloads support `HTTP_PROXY`, `HTTPS_PROXY`, and `NO_PROXY`,
including their lowercase forms.

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
