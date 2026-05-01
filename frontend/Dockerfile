# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Vite bakes env vars at build time — must be passed as build arg
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=${VITE_API_URL}

ARG VITE_GOOGLE_CLIENT_ID=
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine AS runner

# SPA routing config (fallback to index.html for React Router)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
