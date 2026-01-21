FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copy package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/app/package*.json ./packages/app/

# Install dependencies
RUN npm ci --production

# Copy source code
COPY . .

# Build the application
RUN npm run build

CMD [ "npm", "start" ]
