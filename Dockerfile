# Use Debian-based Node so we can install LibreOffice
FROM node:18-bullseye

# Install LibreOffice (provides /usr/bin/soffice for Carbone)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice && \
    rm -rf /var/lib/apt/lists/*

# App directory
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci --omit=dev || npm i --only=production

# Copy source
COPY . .

# Prepare runtime directories
RUN mkdir -p templates

ENV NODE_ENV=production
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
