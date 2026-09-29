# Production image for the OTP + auto-update backend.
# Used when deploying with Docker (Render Docker runtime, Fly.io, a VPS, ...).
# The Render Blueprint uses the native Node runtime and does not need this file.

FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies first for better layer caching.
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the server source.
COPY . .

# Render/Fly inject PORT; 3001 is the local default.
EXPOSE 3001

CMD ["node", "otp-server.js"]
