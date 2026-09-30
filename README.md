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
RCM, Ovl Sysmodules, sys-patch, and Ultrahand use their latest releases. Firmware
files are not included.

### Core components

| Component | Source | Includes |
| --- | --- | --- |
| Atmosphere | [Atmosphere-NX/Atmosphere](https://github.com/Atmosphere-NX/Atmosphere) | Atmosphere, fusee, Daybreak, hbmenu, hbloader, and other upstream tools |
| Hekate | [CTCaer/hekate](https://github.com/CTCaer/hekate) | Bootloader with CFW emuMMC, CFW sysMMC, and stock sysMMC boot entries |
| DBI | [rashevskyv/dbi](https://github.com/rashevskyv/dbi) | Installation, file transfer, save management, and firmware export |
| Lockpick RCM | [impeeza/Lockpick_RCMDecScots](https://github.com/impeeza/Lockpick_RCMDecScots) | Console key export from Hekate's Payloads menu |
| Sys Patch | [impeeza/sys-patch](https://github.com/impeeza/sys-patch) | System patching service and overlay |
| Ultrahand | [ppkantorski/Ultrahand-Overlay](https://github.com/ppkantorski/Ultrahand-Overlay) | Overlay menu and nx-ovlloader |
| Ovl Sysmodules | [ppkantorski/ovl-sysmodules](https://github.com/ppkantorski/ovl-sysmodules) | Background module status, memory usage, startup settings, and controls for supported modules |
| Sigpatches | [Supported versions](./assets/sigpatches/README.md) | Patches for the selected HOS and Atmosphere versions |

Reboot to Payload returns to Hekate. Each pack includes a manifest listing its
component versions.

Ultrahand opens with **L + D-pad Down**.

### Optional extensions

Extensions are enabled by default. Use `--no-ext` to build only the core pack
without extension prompts, or `--ext` to enable them.

Choose optional extensions after assembling the core components. Save management
and file management use single selections; cheat and performance tuning tools allow
multiple selections. Performance monitoring is a separate single selection, with
Status Monitor selected by default.

| Component | Source | Includes |
| --- | --- | --- |
| JKSV | [J-D-K/JKSV](https://github.com/J-D-K/JKSV) | Save backup and restore; default save manager selection |
| Checkpoint | [BernardoGiordano/Checkpoint](https://github.com/BernardoGiordano/Checkpoint) | Save backup and restore |
| EdiZon Overlay | [proferabg/EdiZon-Overlay](https://github.com/proferabg/EdiZon-Overlay) | In-game cheat controls; the only cheat tool selected by default |
| EdiZon SE | [tomvita/EdiZon-SE](https://github.com/tomvita/EdiZon-SE) | Memory search and editing for creating cheats |
| Breeze | [tomvita/Breeze-Beta](https://github.com/tomvita/Breeze-Beta) | Cheat management, memory search, and editing |
| Breezehand Overlay | [tomvita/Breezehand-Overlay](https://github.com/tomvita/Breezehand-Overlay) | Cheat controls in an overlay |
| NX Shell | [DefenderOfHyrule/NX-Shell](https://github.com/DefenderOfHyrule/NX-Shell) | File copying, moving, renaming, and deletion |
| Sys Clk | [retronx-team/sys-clk](https://github.com/retronx-team/sys-clk) | Clock service, homebrew manager, and overlay |
| Sys Clk Ultrahand Overlay | [ppkantorski/sys-clk](https://github.com/ppkantorski/sys-clk) | Enhanced clock controls for Ultrahand, including Horizon OC support |
| Horizon OC | [Horizon-OC/Horizon-OC](https://github.com/Horizon-OC/Horizon-OC) | Advanced CPU, GPU, RAM, and voltage tuning; not selected by default |
| FPS Locker | [masagrator/FPSLocker](https://github.com/masagrator/FPSLocker) | Per-game frame rate controls |
| ReverseNx RT | [masagrator/ReverseNX-RT](https://github.com/masagrator/ReverseNX-RT) | Switch game rendering between handheld and docked modes |
| Status Monitor | [ppkantorski/Status-Monitor-Overlay](https://github.com/ppkantorski/Status-Monitor-Overlay) | FPS, frequencies, load, temperatures, and power monitoring; default monitor selection |
| Status Monitor Deux | [masagrator/Status-Monitor-Deux](https://github.com/masagrator/Status-Monitor-Deux) | Performance monitoring with customizable layouts |

All performance tuning tools except Horizon OC are selected by default. Selecting the
Ultrahand clock overlay also includes a clock service. FPS Locker, ReverseNx RT,
and performance monitors include their shared [SaltyNX](https://github.com/masagrator/SaltyNX) dependency.
Selecting Sys Clk Ultrahand Overlay excludes the original Sys Clk overlay while
retaining its clock service and homebrew manager.

Horizon OC requires its matching Atmosphere version and configures the CFW boot
entries automatically. When selected with Sys Clk, Horizon OC supplies the clock
service; the original Sys Clk manager and overlay cannot connect to it. Use
Horizon OC or Sys Clk Ultrahand Overlay for clock controls in that configuration.

Selected extensions are included in both directory and ZIP output.

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
  ext: true,
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
