#!/bin/sh
set -e

envsubst '${VITE_API_BASE_URL} ${VITE_FIREBASE_API_KEY} ${VITE_FIREBASE_AUTH_DOMAIN} ${VITE_FIREBASE_PROJECT_ID} ${VITE_FIREBASE_APP_ID}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js

exec nginx -g "daemon off;"
