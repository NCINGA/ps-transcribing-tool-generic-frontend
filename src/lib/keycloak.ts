import Keycloak from 'keycloak-js'

// Values are injected at container start (not build time) via config.js,
// generated from public/config.template.js by docker-entrypoint.sh -- this
// lets one built image be deployed to laptops with different backend/
// keycloak ports without rebuilding.
const APP_CONFIG = (window as { __APP_CONFIG__?: Record<string, string> }).__APP_CONFIG__

if (!APP_CONFIG?.keycloakUrl || !APP_CONFIG?.keycloakRealm || !APP_CONFIG?.keycloakClientId) {
  throw new Error('Missing __APP_CONFIG__ -- config.js was not injected correctly at container start')
}

const KEYCLOAK_URL = APP_CONFIG.keycloakUrl
const KEYCLOAK_REALM = APP_CONFIG.keycloakRealm
const KEYCLOAK_CLIENT_ID = APP_CONFIG.keycloakClientId

const keycloak = new Keycloak({
  url: KEYCLOAK_URL,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
})

export default keycloak
