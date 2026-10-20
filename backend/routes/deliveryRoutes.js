import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  getOverview,
  setAvailability,
  updateLocation,
  acceptOrder,
  updateDeliveryStatus,
} from "../controllers/deliveryController.js";

const deliveryRouter = express.Router();

deliveryRouter.get("/overview", isAuth, getOverview);
deliveryRouter.patch("/availability", isAuth, setAvailability);
deliveryRouter.patch("/location", isAuth, updateLocation);   // NEW
deliveryRouter.post("/accept/:orderId", isAuth, acceptOrder);
deliveryRouter.patch("/update-status/:orderId", isAuth, updateDeliveryStatus);

export default deliveryRouter;