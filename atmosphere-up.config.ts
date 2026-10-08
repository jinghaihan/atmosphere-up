import { defineConfig } from './src'

export default defineConfig({
  output: './output',
  extensions: [
    {
      name: 'mhgu-overlay',
      repository: 'jinghaihan/mhgu-overlay',
      assets: [
        {
          name: 'mhgu-overlay.ovl',
          target: 'switch/.overlays/mhgu-overlay.ovl',
        },
      ],
    },
    {
      name: 'feth-overlay',
      repository: 'jinghaihan/feth-overlay',
      assets: [
        {
          name: 'feth-overlay.ovl',
          target: 'switch/.overlays/feth-overlay.ovl',
        },
      ],
    },
  ],
})
