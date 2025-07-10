# --- Multi-stage build for smaller production image ---
# Stage 1: Build and compile
FROM node:20-alpine AS builder

WORKDIR /app/backend-2

COPY package*.json ./
RUN npm install

COPY . .

# Prisma akan menghasilkan binary engine untuk target yang ditentukan di schema.prisma
RUN npx prisma generate

RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runner

WORKDIR /app/backend-2

COPY --from=builder /app/backend-2/package*.json ./
COPY --from=builder /app/backend-2/node_modules ./node_modules
COPY --from=builder /app/backend-2/dist ./dist
COPY --from=builder /app/backend-2/prisma ./prisma

# Pastikan dependensi OpenSSL terinstal di Alpine
# Ini untuk library yang dibutuhkan runtime Prisma Engine
RUN apk add --no-cache openssl libstdc++ ca-certificates

# Hanya install Prisma CLI sebagai runtime dependency (tidak perlu generate lagi di sini)
RUN npm install prisma --omit=dev --no-fund --no-audit --ignore-scripts

EXPOSE 3020
CMD ["npm", "start"]
