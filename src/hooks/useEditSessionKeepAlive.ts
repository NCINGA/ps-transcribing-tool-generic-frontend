import { useEffect, useRef, useState } from 'react'
import { firebaseAuth } from '../lib/firebase'

const REFRESH_INTERVAL_MS = 60_000
const FAILURE_WARNING_THRESHOLD = 3

/**
 * Checks the Firebase session every minute during an edit.
 * The first two consecutive refresh failures fail silently -- only the 3rd
 * consecutive failure (3 minutes in) sets `sessionAtRisk`, so a single
 * transient network blip doesn't alarm the user mid-edit.
 */
export function useEditSessionKeepAlive(active: boolean): { sessionAtRisk: boolean } {
  const [sessionAtRisk, setSessionAtRisk] = useState(false)
  const failureCountRef = useRef(0)

  useEffect(() => {
    if (!active || !firebaseAuth) {
      failureCountRef.current = 0
      setSessionAtRisk(false)
      return
    }

    const auth = firebaseAuth
    const interval = setInterval(async () => {
      try {
        if (!auth.currentUser) throw new Error('Session expired')
        await auth.currentUser.getIdToken()
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
