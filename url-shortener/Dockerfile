# Stage 1: Base Image
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Final Image
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/docs/swagger.yaml ./docs/swagger.yaml

# Set the command to run the application
CMD ["node", "dist/src/app.js"]