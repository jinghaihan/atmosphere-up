import process from 'node:process'
import { exec } from 'tinyexec'

export async function resolveGithubToken(): Promise<string | undefined> {
  if (process.env.GITHUB_TOKEN)
    return process.env.GITHUB_TOKEN

  try {
    const result = await exec('gh', ['auth', 'token', '--hostname', 'github.com'], { throwOnError: true })
    return result.stdout.trim() || undefined
  }
  catch {
    return undefined
  }
}
