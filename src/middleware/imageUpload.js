/* src/middleware/imageUpload.js */
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, 'uploads/'); },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + '-' + Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only jpg, png, and jpeg are allowed.'), false);
  }
};

const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB

const upload = multer({ storage, fileFilter, limits });

export const imageUpload = upload.single('image'); 