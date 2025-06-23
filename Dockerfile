# Dockerfile
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build Prisma client
RUN npx prisma generate

# Jalankan inisialisasi index Elasticsearch saat build
RUN npm run init:es || echo "Elasticsearch belum tersedia, inisialisasi dilewati"

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "dev"]