import { defineConfig, mergeCatalogRules } from 'pncat'

export default defineConfig({
  catalogRules: mergeCatalogRules([
    {
      name: 'inlined',
      match: [
        '@octokit/rest',
        'tildify',
        'tinyexec',
        'tinyglobby',
        'verkit',
      ],
    },
  ]),
  postRun: 'eslint --fix "**/package.json" "**/pnpm-workspace.yaml"',
})
