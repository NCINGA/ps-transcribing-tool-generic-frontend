FROM node:24-slim AS build

WORKDIR /frontend
COPY package*.json ./
RUN npm ci
COPY . .

RUN npm run build

FROM nginx:1.30.2-alpine

RUN apk add --no-cache gettext

COPY --from=build /frontend/dist /usr/share/nginx/html
COPY public/config.template.js /usr/share/nginx/html/config.template.js
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 5173
ENTRYPOINT ["/docker-entrypoint.sh"]
