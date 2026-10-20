import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.resolve("uploads");

// Folder nahi hai to create kar do
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");

        cb(null, uniqueName);
    }
});

// Sirf image files allowed
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maximum 5 MB
    }
});