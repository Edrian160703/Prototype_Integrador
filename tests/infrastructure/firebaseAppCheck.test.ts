import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  apps: [] as object[],
  app: {} as object,
  initializeApp: vi.fn(),
  initializeAppCheck: vi.fn(),
  ReCaptchaEnterpriseProvider: vi.fn(),
}))

vi.mock('firebase/app', () => ({
  getApps: () => mocks.apps,
  initializeApp: mocks.initializeApp,
}))

vi.mock('firebase/app-check', () => ({
  initializeAppCheck: mocks.initializeAppCheck,
  ReCaptchaEnterpriseProvider: mocks.ReCaptchaEnterpriseProvider,
}))

describe('Firebase App Check initialization', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.apps.length = 0
    mocks.initializeApp.mockImplementation(() => {
      mocks.apps.push(mocks.app)
      return mocks.app
    })
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test.appspot.com')
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'test-app-id')
    vi.stubEnv('VITE_FIREBASE_APPCHECK_SITE_KEY', 'test-site-key')
  })

  it('initializes Enterprise App Check once before returning the Firebase app', async () => {
    vi.stubEnv('DEV', false)
    const { getFirebaseApp } = await import('../../src/infrastructure/firebase/firebaseClient')

    expect(getFirebaseApp()).toBe(mocks.app)
    expect(getFirebaseApp()).toBe(mocks.app)
    expect(mocks.ReCaptchaEnterpriseProvider).toHaveBeenCalledOnce()
    expect(mocks.ReCaptchaEnterpriseProvider).toHaveBeenCalledWith('test-site-key')
    expect(mocks.initializeAppCheck).toHaveBeenCalledOnce()
    expect(mocks.initializeAppCheck).toHaveBeenCalledWith(mocks.app, {
      provider: expect.any(mocks.ReCaptchaEnterpriseProvider),
      isTokenAutoRefreshEnabled: true,
    })
    expect(Reflect.get(self, 'FIREBASE_APPCHECK_DEBUG_TOKEN')).toBeUndefined()
  })

  it('enables the debug provider token only in development', async () => {
    vi.stubEnv('DEV', true)
    const { getFirebaseApp } = await import('../../src/infrastructure/firebase/firebaseClient')

    getFirebaseApp()

    expect(Reflect.get(self, 'FIREBASE_APPCHECK_DEBUG_TOKEN')).toBe(true)
    expect(mocks.initializeAppCheck).toHaveBeenCalledOnce()
  })
})
