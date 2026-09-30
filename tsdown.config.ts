import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index', 'src/cli'],
  exports: true,
  clean: true,
  copy: ['src/hekate_ipl.ini', 'src/defaults'],
})
