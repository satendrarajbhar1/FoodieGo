import crypto from "crypto";
import mongoose from "mongoose";
import Razorpay from "razorpay";
import Order from "../models/orderModel.js";
import Shop from "../models/shopModel.js";
import Item from "../models/itemModel.js";
import User from "../models/userModel.js";
import { findNearbyRiders } from "../utils/geo.js";
import { emitToUser, emitToDeliveryBoys } from "../utils/socket.js";

const DELIVERY_FEE = 40;
const MAX_QTY_PER_ITEM = 20;

const round2 = (n) => Math.round(n * 100) / 100;

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay keys are missing in .env");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Owner sirf ye transitions kar sakta hai.
// out_for_delivery aur delivered ab delivery boy karta hai.
const NEXT_STATUS = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: [],
  out_for_delivery: [],
  delivered: [],
  cancelled: [],
};

// Customer ko dikhne wale live messages (deliveryController bhi use karta hai)
export const CUSTOMER_MESSAGES = {
  accepted: "Your order was accepted by the restaurant.",
  preparing: "The restaurant is preparing your food.",
  out_for_delivery: "Your order is out for delivery!",
  delivered: "Your order was delivered. Enjoy!",
  cancelled: "Your order was cancelled by the restaurant.",
};

/* ---------------------------------------------------------------
   CUSTOMER: order place karo (COD ya online)
---------------------------------------------------------------- */
export const placeOrder = async (req, res) => {
  try {
    const { shopId, items, deliveryAddress, paymentMethod } = req.body;

    const user = await User.findById(req.userId).select("role");

    if (!user || user.role !== "user") {
      return res.status(403).json({
        message: "Only customers can place orders.",
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    const addressText = deliveryAddress?.text?.trim();

    if (!addressText) {
      return res.status(400).json({
        message: "Please enter a delivery address.",
      });
    }

    if (!mongoose.isValidObjectId(shopId)) {
      return res.status(400).json({ message: "Invalid restaurant." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty." });
    }

    const qtyMap = new Map();

    for (const entry of items) {
      const itemId = entry?.itemId;
      const qty = Number(entry?.quantity);

      if (
        !mongoose.isValidObjectId(itemId) ||
        !Number.isInteger(qty) ||
        qty < 1
      ) {
        return res.status(400).json({ message: "Invalid cart item." });
      }

      const key = String(itemId);
      const merged = (qtyMap.get(key) || 0) + qty;

      if (merged > MAX_QTY_PER_ITEM) {
        return res.status(400).json({
          message: `You can order at most ${MAX_QTY_PER_ITEM} of one item.`,
        });
      }

      qtyMap.set(key, merged);
    }

    // owner bhi chahiye, taaki usko notification bhej sakein
    const shop = await Shop.findById(shopId).select("_id owner");

    if (!shop) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const dbItems = await Item.find({
      _id: { $in: [...qtyMap.keys()] },
      shop: shop._id,
    });

    if (dbItems.length !== qtyMap.size) {
      return res.status(400).json({
        message:
          "Some items are no longer available. Please refresh your cart.",
      });
    }

    const orderItems = dbItems.map((dbItem) => ({
      item: dbItem._id,
      name: dbItem.name,
      price: dbItem.price,
      quantity: qtyMap.get(String(dbItem._id)),
      image: dbItem.image,
      foodType: dbItem.FoodType,
    }));

    const subtotal = round2(
      orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    );
    const totalAmount = round2(subtotal + DELIVERY_FEE);

    const isOnline = paymentMethod === "online";

    const order = await Order.create({
      user: req.userId,
      shop: shop._id,
      items: orderItems,
      deliveryAddress: { text: addressText },
      paymentMethod,
      paymentStatus: "pending",
      status: isOnline ? "awaiting_payment" : "placed",
      subtotal,
      deliveryFee: DELIVERY_FEE,
      totalAmount,
    });

    // COD: order turant owner ko dikhna chahiye
    if (!isOnline) {
      emitToUser(shop.owner, "order-event", {
        orderId: order._id,
        status: "placed",
        message: "New order received!",
      });

      return res.status(201).json({
        message: "Order placed successfully!",
        order,
      });
    }

    try {
      const razorpayOrder = await getRazorpay().orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: String(order._id),
      });

      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        message: "Complete the payment to place your order.",
        order,
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
      });
    } catch (paymentError) {
      await Order.deleteOne({ _id: order._id });
      console.error("RAZORPAY ORDER ERROR:", paymentError);

      return res.status(502).json({
        message: "Could not start the payment. Please try again.",
      });
    }
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong while placing the order.",
    });
  }
};

/* ---------------------------------------------------------------
   CUSTOMER: Razorpay payment verify karo
---------------------------------------------------------------- */
export const verifyPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(orderId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Invalid payment details." });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.userId,
      paymentMethod: "online",
      razorpayOrderId: razorpay_order_id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.paymentStatus === "paid") {
      return res.status(200).json({
        message: "Payment already verified.",
        order,
      });
    }

    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const expectedBuf = Buffer.from(expected);
    const receivedBuf = Buffer.from(String(razorpay_signature));

    const isValid =
      expectedBuf.length === receivedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      return res.status(400).json({
        message: "Payment verification failed.",
      });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: "awaiting_payment" },
      {
        $set: {
          status: "placed",
          paymentStatus: "paid",
          razorpayPaymentId: razorpay_payment_id,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({
        message: "Order was already updated. Please check My Orders.",
      });
    }

    // Payment verify hone ke baad hi owner ko order dikhta hai
    const shop = await Shop.findById(updated.shop).select("owner");

    if (shop) {
      emitToUser(shop.owner, "order-event", {
        orderId: updated._id,
        status: "placed",
        message: "New order received!",
      });
    }

    return res.status(200).json({
      message: "Payment successful! Order placed.",
      order: updated,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      message: "Something went wrong while verifying the payment.",
    });
  }
};

/* ---------------------------------------------------------------
   CUSTOMER: apne saare orders
---------------------------------------------------------------- */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.userId,
      status: { $ne: "awaiting_payment" },
    })
      .sort({ createdAt: -1 })
      .populate("shop", "name image city")
      .populate("deliveryBoy", "fullName mobile");

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("GET MY ORDERS ERROR:", error);

    return res.status(500).json({
      message: "Unable to fetch your orders.",
    });
  }
};

/* ---------------------------------------------------------------
   OWNER: apni shop ke saare orders
---------------------------------------------------------------- */
export const getShopOrders = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.userId }).select("_id");

    if (!shop) {
      return res.status(404).json({ message: "Your shop was not found." });
    }

    const orders = await Order.find({
      shop: shop._id,
      status: { $ne: "awaiting_payment" },
    })
      .sort({ createdAt: -1 })
      .populate("user", "fullName mobile")
      .populate("deliveryBoy", "fullName mobile");

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("GET SHOP ORDERS ERROR:", error);

    return res.status(500).json({
      message: "Unable to fetch shop orders.",
    });
  }
};

/* ---------------------------------------------------------------
   OWNER: order ka status badlo (placed -> accepted -> preparing)
---------------------------------------------------------------- */


export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    if (!Object.keys(NEXT_STATUS).includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    // location bhi chahiye, paas ke riders dhundhne ke liye
    const shop = await Shop.findOne({ owner: req.userId }).select(
      "_id location"
    );

    if (!shop) {
      return res.status(404).json({ message: "Your shop was not found." });
    }

    const order = await Order.findOne({ _id: orderId, shop: shop._id });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    const allowedFrom = Object.keys(NEXT_STATUS).filter((from) =>
      NEXT_STATUS[from].includes(status)
    );

    if (!allowedFrom.includes(order.status)) {
      return res.status(400).json({
        message: `Cannot change order from "${order.status}" to "${status}".`,
      });
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { $set: { status } },
      { new: true }
    )
      .populate("user", "fullName mobile")
      .populate("deliveryBoy", "fullName mobile");

    if (!updated) {
      return res.status(409).json({
        message: "Order status was already changed. Please refresh.",
      });
    }

    // Customer ko live update
    emitToUser(updated.user._id, "order-event", {
      orderId: updated._id,
      status,
      message: CUSTOMER_MESSAGES[status],
    });

    // Accept hote hi sirf 5 km ke andar ke free riders ko request
    if (status === "accepted") {
      const riders = await findNearbyRiders(shop.location);

      riders.forEach((rider) => {
        emitToUser(rider._id, "delivery-event", {
          orderId: updated._id,
          message: "New delivery request nearby!",
        });
      });
    }

    // Cancel: riders ki list refresh, assigned ho to usko batao
    if (status === "cancelled") {
      emitToDeliveryBoys("delivery-event", { orderId: updated._id });

      if (updated.deliveryBoy) {
        emitToUser(updated.deliveryBoy._id, "delivery-event", {
          orderId: updated._id,
          message: "The restaurant cancelled this order.",
        });
      }
    }

    if (status === "preparing" && updated.deliveryBoy) {
      emitToUser(updated.deliveryBoy._id, "delivery-event", {
        orderId: updated._id,
        message: "Food is being prepared. You can pick it up soon.",
      });
    }

    return res.status(200).json({
      message: "Order status updated.",
      order: updated,
    });
  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    return res.status(500).json({
      message: "Unable to update order status.",
    });
  }
};