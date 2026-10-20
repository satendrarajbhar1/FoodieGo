import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  placeOrder,
  verifyPayment,
  getMyOrders,
  getShopOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.post("/verify-payment", isAuth, verifyPayment);   // NEW
orderRouter.get("/my-orders", isAuth, getMyOrders);
orderRouter.get("/shop-orders", isAuth, getShopOrders);
orderRouter.patch("/update-status/:orderId", isAuth, updateOrderStatus);

export default orderRouter;