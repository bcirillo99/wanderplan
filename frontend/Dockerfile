FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* vars are baked into the static bundle at build time. Override via
# docker-compose build args (production API URL, Unsplash key, ...).
ARG VITE_API_URL=http://localhost:8000
ARG VITE_UNSPLASH_ACCESS_KEY=
ENV VITE_API_URL=$VITE_API_URL \
    VITE_UNSPLASH_ACCESS_KEY=$VITE_UNSPLASH_ACCESS_KEY

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
