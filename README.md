# 🛒 E-Commerce Product & Promo Microservice

Ini adalah salah satu microservice untuk sistem e-commerce, yang menangani:

- Manajemen **Produk**
- Manajemen **Promo**
- Fitur **Favorite Produk** oleh pengguna

### 📦 Teknologi yang Digunakan

- **Node.js** + **Express**
- **Prisma ORM** + PostgreSQL
- **Redis** (caching)
- **Elasticsearch** (pencarian produk)
- **Cloudinary** (upload gambar)
- **Docker** (opsional untuk deployment)
- Validasi: `express-validator`
- File upload: `multer`

---

## 🚀 Fitur Utama

### ✅ Produk
- Create, Read, Update, Delete Produk
- Auto-index ke Elasticsearch
- Caching Redis
- Upload gambar via Cloudinary

### ✅ Promo
- Create, Read, Update, Delete Promo
- Hanya promo aktif yang ditampilkan di beranda
- Redis caching
- Upload banner promo via Cloudinary

### ✅ Favorite
- User bisa favorite (like/unlike produk)
- Total favorit ditampilkan di `Product._count.favorites`

## Cara menjalankan project
1. Clone repositori
git clone https://github.com/Baghaztra-Van-Ril/backend2
cd backend2

2. Install semua dependensi
npm install

3. Salin dan konfigurasi file environment
cp .env.example .env
# lalu isi variabel seperti DATABASE_URL, REDIS_URL, CLOUDINARY_URL, dll.

4. Generate Prisma Client dan migrate database
npx prisma generate
npx prisma migrate dev

5. Buat index Elasticsearch untuk produk
npm run init:es

6. Jalankan server
npm run dev
