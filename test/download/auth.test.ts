import { exec } from 'tinyexec'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveGithubToken } from '../../src/download/auth'

vi.mock('tinyexec', () => ({ exec: vi.fn() }))

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('resolveGithubToken', () => {
  it('uses GITHUB_TOKEN without calling gh', async () => {
    vi.stubEnv('GITHUB_TOKEN', 'environment-token')
    expect(await resolveGithubToken()).toBe('environment-token')
    expect(exec).not.toHaveBeenCalled()
  })

  it('reuses the stored GitHub CLI credential', async () => {
    vi.stubEnv('GITHUB_TOKEN', undefined)
    vi.mocked(exec).mockResolvedValue({ stdout: 'stored-token\n', stderr: '', exitCode: 0 })
    expect(await resolveGithubToken()).toBe('stored-token')
    expect(exec).toHaveBeenCalledWith('gh', ['auth', 'token', '--hostname', 'github.com'], { throwOnError: true })
  })

  it('allows anonymous requests when gh is missing or logged out', async () => {
    vi.stubEnv('GITHUB_TOKEN', undefined)
    vi.mocked(exec).mockRejectedValue(new Error('gh unavailable'))
    expect(await resolveGithubToken()).toBeUndefined()
  })
})
