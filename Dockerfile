FROM node:18-bullseye

# Install LibreOffice (soffice) for Carbone conversions
RUN apt-get update && \
    apt-get install -y --no-install-recommends libreoffice && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci --omit=dev || npm i --only=production

# Copy source
COPY . .

# (Optional) create a writable dir in the container (we also use /tmp)
RUN mkdir -p /app/templates

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]
