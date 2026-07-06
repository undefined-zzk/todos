// Low-level HTTP client abstraction.
//
// IMPORTANT (前后端分离约束):
// The current implementation routes every call through an in-memory mock
// dispatcher so the front-end can be developed without a backend.
// To switch to a real backend, replace the body of `dispatch` with a $fetch
// (or fetch) call and keep the same ApiResponse envelope contract.
import type {
  ApiError,
  ApiRequestConfig,
  ApiResponse,
  RequestOptions
} from '~/types'

const DEFAULT_BASE_URL = '/api'
const MOCK_LATENCY_MS = 280

// Reserved: a single place to inject auth headers, tracing ids, etc.
function buildHeaders(config: ApiRequestConfig): Required<Pick<ApiRequestConfig, 'headers'>> {
  return {
    headers: {
      'Content-Type': 'application/json',
      ...config.headers
    }
  }
}

// Mock dispatcher: resolves the ApiResponse produced by the service layer.
// In production this becomes the real network call.
async function dispatch<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
  const enriched = { ...config, ...buildHeaders(config) }

  // === Production placeholder (keep this block, uncomment when backend is ready) ===
  // return await $fetch<ApiResponse<T>>(enriched.url, {
  //   method: enriched.method,
  //   query: enriched.params,
  //   body: enriched.data,
  //   headers: enriched.headers
  // })
  // === End placeholder ===

  // Mock path: services attach a `__mock` resolver carrying the payload.
  const mock = (enriched as ApiRequestConfig & { __mock?: () => ApiResponse<T> }).__mock
  if (!mock) {
    throw {
      code: 'NO_MOCK',
      message: `No mock handler registered for ${enriched.method} ${enriched.url}`
    } as ApiError
  }

  await new Promise(resolve => setTimeout(resolve, MOCK_LATENCY_MS))
  return mock()
}

export async function request<T>(
  config: ApiRequestConfig,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const prepared = options.onRequest ? options.onRequest({ ...config }) : config

  try {
    const response = await dispatch<T>(prepared)
    options.onResponse?.(response)
    return response
  } catch (err) {
    const error: ApiError =
      err && typeof err === 'object' && 'message' in err
        ? (err as ApiError)
        : { code: 'UNKNOWN', message: 'Unexpected error', cause: err }
    options.onError?.(error)
    throw error
  }
}

export function buildUrl(path: string): string {
  return `${DEFAULT_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Helper to attach a mock resolver to a config object (used by services).
export function withMock<T>(
  config: ApiRequestConfig,
  resolver: () => ApiResponse<T>
): ApiRequestConfig & { __mock: () => ApiResponse<T> } {
  return { ...config, __mock: resolver } as ApiRequestConfig & {
    __mock: () => ApiResponse<T>
  }
}
