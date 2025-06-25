# 🧩 Microservice: Product, Promo & Favorite (Catalog Backend)

Ini adalah salah satu microservice dalam sistem e-commerce yang bertanggung jawab untuk:

- Manajemen **Produk**
- Manajemen **Promo**
- Fitur **Favorite Produk** oleh pengguna

---

## 📦 Teknologi yang Digunakan

- **Node.js** + **Express**
- **Prisma ORM** + PostgreSQL
- **Redis** (caching)
- **Elasticsearch** (pencarian produk)
- **Cloudinary** (upload gambar)
- Validasi: `express-validator`
- File upload: `multer`

---

## 🚀 Fitur Utama

### ✅ Produk
- Create, Read, Update, Delete produk
- Auto-index ke Elasticsearch
- Caching Redis
- Upload gambar via Cloudinary

### ✅ Promo
- Create, Read, Update, Delete promo
- Hanya promo aktif (`isActive = true`) yang ditampilkan di beranda
- Redis caching
- Upload banner promo via Cloudinary

### ✅ Favorite
- User dapat memberi dan membatalkan favorite (like/unlike produk)
- Total favorit produk dapat dilihat melalui field:
  `Product._count.favorites`

---

## ▶️ Cara Menjalankan Project


#### 1. Clone repositori
```bash
git clone https://github.com/Baghaztra-Van-Ril/backend2
cd backend2
```

#### 2. Install semua dependensi
```bash
npm install
```

#### 3. Salin dan konfigurasi file environment
```bash
cp .env.example .env
```

Lalu isi variabel berikut di file `.env`:
```bash
DATABASE_URL=""
FRONTEND_URL=""
PORT=
ELASTICSEARCH_URL=""
ELASTIC_API_KEY=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
```

#### 4. Generate Prisma Client dan migrate database
```bash
npx prisma generate
npx prisma migrate dev
```

#### 5. Inisialisasi Elasticsearch index untuk produk
```bash
npm run init:es
```

#### 6. Jalankan server
```bash
npm run dev
```
