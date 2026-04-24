FROM node:18-alpine

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install client dependencies and build
COPY client/package*.json ./client/
RUN cd client && npm ci --legacy-peer-deps
COPY client/ ./client/
RUN cd client && npm run build

# Copy server files
COPY server/ ./server/

# Create logs and uploads directories
RUN mkdir -p logs uploads

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
