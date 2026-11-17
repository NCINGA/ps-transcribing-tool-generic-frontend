import { useEffect, useRef, useState } from 'react'
import keycloak from '../lib/keycloak'

const REFRESH_INTERVAL_MS = 60_000
const FAILURE_WARNING_THRESHOLD = 3

/**
 * Keeps the Keycloak session alive with a refresh every minute for as long
 * as `active` is true -- deliberately scoped to an in-progress edit rather
 * than the whole app, so the normal idle-timeout still applies everywhere
 * else (see AuthContext.tsx for why a blanket background refresh isn't used).
 * The first two consecutive refresh failures fail silently -- only the 3rd
 * consecutive failure (3 minutes in) sets `sessionAtRisk`, so a single
 * transient network blip doesn't alarm the user mid-edit.
 */
export function useEditSessionKeepAlive(active: boolean): { sessionAtRisk: boolean } {
  const [sessionAtRisk, setSessionAtRisk] = useState(false)
  const failureCountRef = useRef(0)

  useEffect(() => {
    if (!active) {
      failureCountRef.current = 0
      setSessionAtRisk(false)
      return
    }

    const interval = setInterval(async () => {
      try {
        await keycloak.updateToken(30)
        failureCountRef.current = 0
        setSessionAtRisk(false)
      } catch {
        failureCountRef.current += 1
        if (failureCountRef.current >= FAILURE_WARNING_THRESHOLD) {
          setSessionAtRisk(true)
        }
      }
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [active])

  return { sessionAtRisk }
}
