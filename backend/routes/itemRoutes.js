import express from "express";
import isAuth from "../middlewares/isAuth.js";
import { addItem, editItem, searchSuggestions } from "../controllers/itemController.js";
import { upload } from "../middlewares/multer.js";

const itemRouter = express.Router();

itemRouter.post("/add-item", isAuth, upload.single("image"), addItem);
itemRouter.post("/edit-item/:itemId", isAuth, upload.single("image"), editItem);


itemRouter.get("/search", searchSuggestions);

export default itemRouter;