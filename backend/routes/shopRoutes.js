import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  createEditShop,
  getMyShop,
  getNearbyShops,
  getShopById,
  getAllShops,
} from "../controllers/shopController.js";
import { upload } from "../middlewares/multer.js";

const shopRouter = express.Router();

const uploadImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        message:
          err.code === "LIMIT_FILE_SIZE"
            ? "Image must be smaller than 5 MB"
            : err.message,
      });
    }

    next();
  });
};

// Public: guest bhi dekh sakta hai
shopRouter.get("/nearby", getNearbyShops);
shopRouter.get("/get-by-city", getNearbyShops);
shopRouter.get("/get-all", getAllShops);
shopRouter.get("/get-by-id/:shopId", getShopById);

// Login zaroori
shopRouter.get("/get-shop", isAuth, getMyShop);
shopRouter.post("/create-edit", isAuth, uploadImage, createEditShop);

export default shopRouter;