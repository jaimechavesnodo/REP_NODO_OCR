# Install dependencies only when needed
FROM node:20-alpine3.18 AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --frozen-lockfile

# Build the app with cache dependencies
FROM node:20.3.0-bullseye AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run the app
FROM node:20.3.0-bullseye AS runner

# Set working directory
WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm install --prod

COPY --from=builder /app/dist ./dist

EXPOSE 6601

CMD ["node", "dist/main"]