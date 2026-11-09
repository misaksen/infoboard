FROM node:18-alpine

WORKDIR /app

# Import optional custom CA certificates
RUN apk add --no-cache ca-certificates openssl
COPY certs/ /usr/local/share/ca-certificates/
RUN update-ca-certificates -f \
  && cat /etc/ssl/certs/ca-certificates.crt > /usr/local/share/ca-certificates/custom-ca-bundle.pem \
  && find /usr/local/share/ca-certificates -type f -name '*.crt' -exec cat {} + >> /usr/local/share/ca-certificates/custom-ca-bundle.pem
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/custom-ca-bundle.pem

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ src/
COPY public/ public/

# Create data directory for SQLite and uploads
RUN mkdir -p /data/uploads && chmod 755 /data

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/public/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "src/server.js"]
