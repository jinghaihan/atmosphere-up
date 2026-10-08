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
      name: 'feth-overlays',
      repository: '3096/feth-overlays',
      assets: [{ name: 'feth-overlays.zip' }],
    },
  ],
})
