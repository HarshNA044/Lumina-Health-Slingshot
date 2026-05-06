# Use node image for building and running
FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build the frontend assets
RUN npm run build

# Standard port for this environment is 3000
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start command using tsx to run the server directly (easiest for deployment)
# Alternatively, you can use 'node server.ts' if using Node 22.8+
CMD ["npx", "tsx", "server.ts"]
