# atmosphere-up

[![npm version][npm-version-src]][npm-version-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

## Usage

```sh
npx atmosphere-up
```

Atmosphere and sigpatches match the selected HOS version. Hekate, DBI, Lockpick
RCM, sys-patch, and Ultrahand use their latest releases. Firmware files are not included.

### Core components

| Component | Source | Includes |
| --- | --- | --- |
| Atmosphere | [Atmosphere-NX/Atmosphere](https://github.com/Atmosphere-NX/Atmosphere) | Atmosphere, fusee, Daybreak, hbmenu, hbloader, and other upstream tools |
| Hekate | [CTCaer/hekate](https://github.com/CTCaer/hekate) | Bootloader with CFW emuMMC, CFW sysMMC, and stock sysMMC boot entries |
| DBI | [rashevskyv/dbi](https://github.com/rashevskyv/dbi) | Installation, file transfer, save management, and firmware export |
| Lockpick RCM | [impeeza/Lockpick_RCMDecScots](https://github.com/impeeza/Lockpick_RCMDecScots) | Console key export from Hekate's Payloads menu |
| Sys Patch | [impeeza/sys-patch](https://github.com/impeeza/sys-patch) | System patching service and overlay |
| Ultrahand | [ppkantorski/Ultrahand-Overlay](https://github.com/ppkantorski/Ultrahand-Overlay) | Overlay menu and nx-ovlloader |
| Sigpatches | [Supported versions](./assets/sigpatches/README.md) | Patches for the selected HOS and Atmosphere versions |

Reboot to Payload returns to Hekate. Each pack includes a manifest listing its
component versions.

Ultrahand opens with **L + D-pad Down**.

### Optional extensions

After assembling the core components, choose whether to include save management:
[JKSV](https://github.com/J-D-K/JKSV) (default selection) or
[Checkpoint](https://github.com/BernardoGiordano/Checkpoint).
ZIP output includes the selected extensions.

### Pack defaults

- Overlays use an 8 MiB memory allocation.
- Cheats start disabled. Toggle state is saved only when a toggle file already
  exists.
- USB 3.0 is enabled for homebrew.
- NRO authorization checks are relaxed for compatible game mods.
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
