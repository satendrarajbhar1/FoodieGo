import "dotenv/config"; // .env pehle load hoga, phir config chalega
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const config = cloudinary.config();

console.log("Cloudinary config check:", {
    cloud_name: config.cloud_name ? "Loaded" : "Missing",
    api_key: config.api_key ? "Loaded" : "Missing",
    api_secret: config.api_secret ? "Loaded" : "Missing"
});

const uploadOnCloudinary = async (file) => {
    if (!file || !fs.existsSync(file)) {
        throw new Error(`Image file not found: ${file}`);
    }

    try {
        const result = await cloudinary.uploader.upload(file, {
            resource_type: "image"
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error.http_code, error.message);
        throw error;
    } finally {
        // Upload ho ya fail, temp file hamesha delete hogi
        if (fs.existsSync(file)) fs.unlinkSync(file);
    }
};

export default uploadOnCloudinary;