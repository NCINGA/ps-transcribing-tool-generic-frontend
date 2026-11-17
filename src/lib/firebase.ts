import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

interface RuntimeConfig {
  apiBaseUrl?: string
  firebaseApiKey?: string
  firebaseAuthDomain?: string
  firebaseProjectId?: string
  firebaseAppId?: string
}

const config = (window as Window & { __APP_CONFIG__?: RuntimeConfig }).__APP_CONFIG__
export const apiBaseUrl = config?.apiBaseUrl?.trim().replace(/\/+$/, '')
const apiKey = config?.firebaseApiKey?.trim()
const authDomain = config?.firebaseAuthDomain?.trim()
const projectId = config?.firebaseProjectId?.trim()
const appId = config?.firebaseAppId?.trim()

export const firebaseAuth = apiBaseUrl && apiKey && authDomain && projectId && appId
  ? getAuth(initializeApp({ apiKey, authDomain, projectId, appId }))
  : null

export const isPreview = firebaseAuth === null
