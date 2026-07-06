import { describe, it, expect, vi } from 'vitest'
import { request, buildUrl, withMock } from '~/utils/http'
import type { ApiResponse, ApiRequestConfig } from '~/types'

describe('http client', () => {
  describe('buildUrl', () => {
    it('prepends the base path and normalises leading slashes', () => {
      expect(buildUrl('/todos')).toBe('/api/todos')
      expect(buildUrl('todos')).toBe('/api/todos')
      expect(buildUrl('/auth/login')).toBe('/api/auth/login')
    })
  })

  describe('withMock', () => {
    it('attaches a mock resolver to a config object', () => {
      const config: ApiRequestConfig = { method: 'GET', url: '/api/x' }
      const resolver = () => ({ data: 1, success: true, message: 'ok' })
      const enriched = withMock(config, resolver)
      expect(enriched.__mock).toBe(resolver)
      // original config untouched
      expect('__mock' in config).toBe(false)
    })
  })

  describe('request', () => {
    it('resolves via the attached mock resolver', async () => {
      const res = await request<number>(
        withMock<number>({ method: 'GET', url: '/api/ok' }, () => ({
          data: 42,
          success: true,
          message: 'ok'
        }))
      )
      expect(res.success).toBe(true)
      expect(res.data).toBe(42)
      expect(res.message).toBe('ok')
    })

    it('invokes onResponse on success', async () => {
      const onResponse = vi.fn()
      await request<string>(
        withMock<string>({ method: 'POST', url: '/api/x' }, () => ({
          data: 'done',
          success: true
        })),
        { onResponse }
      )
      expect(onResponse).toHaveBeenCalledTimes(1)
      const arg = onResponse.mock.calls[0]![0] as ApiResponse<string>
      expect(arg.data).toBe('done')
    })

    it('invokes onError and rethrows when no mock is registered', async () => {
      const onError = vi.fn()
      await expect(
        request({ method: 'GET', url: '/api/missing' }, { onError })
      ).rejects.toMatchObject({ code: 'NO_MOCK' })
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError.mock.calls[0]![0]).toMatchObject({ code: 'NO_MOCK' })
    })

    it('runs the onRequest hook before dispatch', async () => {
      const onRequest = vi.fn((c: ApiRequestConfig) => ({
        ...c,
        headers: { 'X-Test': '1' }
      }))
      const res = await request<number>(
        withMock<number>({ method: 'GET', url: '/api/x' }, () => ({
          data: 1,
          success: true
        })),
        { onRequest }
      )
      expect(onRequest).toHaveBeenCalledTimes(1)
      expect(res.success).toBe(true)
    })
  })
})
