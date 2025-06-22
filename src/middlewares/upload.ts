import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = [
            'image/jpeg', 'image/png', 'image/jpg',
            'image/JPEG', 'image/PNG', 'image/JPG'
        ];
        const extAllowed = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];
        const ext = path.extname(file.originalname);
        if (allowed.includes(file.mimetype) && extAllowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('File harus berupa gambar (jpg/jpeg/png)'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});

export default upload;
