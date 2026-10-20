import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import Shop from "../models/shopModel.js";
import User from "../models/userModel.js";
import {
  emitToUser,
  emitToDeliveryBoys,
  setDeliveryAvailability,
} from "../utils/socket.js";
import { CUSTOMER_MESSAGES } from "./orderController.js";
import {
  DELIVERY_RADIUS_KM,
  parseCoords,
  toPoint,
  distanceKm,
} from "../utils/geo.js";

const ACTIVE = ["accepted", "preparing", "out_for_delivery"];

const RIDER_TRANSITIONS = {
  preparing: "out_for_delivery",
  out_for_delivery: "delivered",
};

const getRider = async (req, res) => {
  const user = await User.findById(req.userId).select(
    "role isAvailable fullName location"
  );

  if (!user || user.role !== "deliveryBoy") {
    res.status(403).json({ message: "Only delivery partners can do this." });
    return null;
  }

  return user;
};

const notifyOwner = async (shopId, payload) => {
  const shop = await Shop.findById(shopId).select("owner");
  if (shop) emitToUser(shop.owner, "order-event", payload);
};

/* ---------------------------------------------------------------
   Delivery boy ka dashboard data
---------------------------------------------------------------- */
export const getOverview = async (req, res) => {
  try {
    const rider = await getRider(req, res);
    if (!rider) return;

    const currentOrder = await Order.findOne({
      deliveryBoy: req.userId,
      status: { $in: ACTIVE },
    })
      .populate("shop", "name address city")
      .populate("user", "fullName mobile");

    const deliveredCount = await Order.countDocuments({
      deliveryBoy: req.userId,
      status: "delivered",
    });

    let availableOrders = [];

    // Online ho, koi order chal na raha ho, aur location pata ho
    if (rider.isAvailable && !currentOrder && rider.location?.coordinates?.length) {
      // Rider ke 5 km ke andar ke shops
      const nearShops = await Shop.find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: rider.location.coordinates,
            },
            $maxDistance: DELIVERY_RADIUS_KM * 1000,
          },
        },
      }).select("_id");

      if (nearShops.length > 0) {
        availableOrders = await Order.find({
          deliveryBoy: null,
          status: { $in: ["accepted", "preparing"] },
          shop: { $in: nearShops.map((s) => s._id) },
        })
          .sort({ createdAt: 1 })
          .limit(20)
          .populate("shop", "name address city");
      }
    }

    return res.status(200).json({
      isAvailable: rider.isAvailable,
      currentOrder,
      availableOrders,
      deliveredCount,
      radiusKm: DELIVERY_RADIUS_KM,
    });
  } catch (error) {
    console.error("DELIVERY OVERVIEW ERROR:", error);

    return res.status(500).json({
      message: "Unable to load your dashboard.",
    });
  }
};

/* ---------------------------------------------------------------
   Online / Offline toggle (online jaate waqt location zaroori)
---------------------------------------------------------------- */
export const setAvailability = async (req, res) => {
  try {
    const rider = await getRider(req, res);
    if (!rider) return;

    const { isAvailable } = req.body;

    if (typeof isAvailable !== "boolean") {
      return res.status(400).json({ message: "Invalid value." });
    }

    const update = { isAvailable };

    if (isAvailable) {
      const coords = parseCoords(req.body.lat, req.body.lng);

      if (!coords) {
        return res.status(400).json({
          message: "Location is required to go online.",
        });
      }

      update.location = toPoint(coords);
    } else {
      const busy = await Order.exists({
        deliveryBoy: req.userId,
        status: { $in: ACTIVE },
      });

      if (busy) {
        return res.status(400).json({
          message: "Finish your current delivery before going offline.",
        });
      }
    }

    await User.findByIdAndUpdate(req.userId, update);
    setDeliveryAvailability(req.userId, isAvailable);

    return res.status(200).json({ isAvailable });
  } catch (error) {
    console.error("SET AVAILABILITY ERROR:", error);

    return res.status(500).json({
      message: "Unable to change your status.",
    });
  }
};

/* ---------------------------------------------------------------
   Rider ki location update (online rehte hue har 30 second)
---------------------------------------------------------------- */
export const updateLocation = async (req, res) => {
  try {
    const rider = await getRider(req, res);
    if (!rider) return;

    const coords = parseCoords(req.body.lat, req.body.lng);

    if (!coords) {
      return res.status(400).json({ message: "Invalid location." });
    }

    await User.findByIdAndUpdate(req.userId, { location: toPoint(coords) });

    return res.status(200).json({ message: "Location updated." });
  } catch (error) {
    console.error("UPDATE LOCATION ERROR:", error);

    return res.status(500).json({
      message: "Unable to update your location.",
    });
  }
};

/* ---------------------------------------------------------------
   Order accept karo (jo pehle kare use mile, aur 5 km ke andar ho)
---------------------------------------------------------------- */
export const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const rider = await getRider(req, res);
    if (!rider) return;

    if (!rider.isAvailable) {
      return res.status(400).json({ message: "Go online first." });
    }

    const busy = await Order.exists({
      deliveryBoy: req.userId,
      status: { $in: ACTIVE },
    });

    if (busy) {
      return res.status(400).json({
        message: "Finish your current delivery first.",
      });
    }

    // Distance check: rider shop ke 5 km ke andar hona chahiye
    const target = await Order.findById(orderId).select("shop");

    if (!target) {
      return res.status(409).json({
        message: "This order is no longer available.",
      });
    }

    const shopDoc = await Shop.findById(target.shop).select("location");
    const riderPoint = rider.location?.coordinates;
    const shopPoint = shopDoc?.location?.coordinates;

    if (!riderPoint?.length || !shopPoint?.length) {
      return res.status(400).json({
        message: "Location is not available. Go offline and online again.",
      });
    }

    if (distanceKm(riderPoint, shopPoint) > DELIVERY_RADIUS_KM) {
      return res.status(400).json({
        message: `This restaurant is more than ${DELIVERY_RADIUS_KM} km away.`,
      });
    }

    // Atomic: sirf tab assign hoga jab abhi tak koi rider assigned na ho
    const order = await Order.findOneAndUpdate(
      {
        _id: orderId,
        deliveryBoy: null,
        status: { $in: ["accepted", "preparing"] },
      },
      { $set: { deliveryBoy: req.userId } },
      { new: true }
    )
      .populate("shop", "name address city")
      .populate("user", "fullName mobile");

    if (!order) {
      return res.status(409).json({
        message: "This order was already taken or is no longer available.",
      });
    }

    // Baaki riders ki list refresh
    emitToDeliveryBoys("delivery-event", { orderId: order._id });

    emitToUser(order.user._id, "order-event", {
      orderId: order._id,
      status: order.status,
      message: `${rider.fullName} will deliver your order.`,
    });

    await notifyOwner(order.shop._id, {
      orderId: order._id,
      status: order.status,
      message: `${rider.fullName} accepted the delivery.`,
    });

    return res.status(200).json({ message: "Order accepted.", order });
  } catch (error) {
    console.error("ACCEPT ORDER ERROR:", error);

    return res.status(500).json({
      message: "Unable to accept the order.",
    });
  }
};

/* ---------------------------------------------------------------
   Rider: preparing -> out_for_delivery -> delivered
---------------------------------------------------------------- */
export const updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({ message: "Invalid order id." });
    }

    const rider = await getRider(req, res);
    if (!rider) return;

    const from = Object.keys(RIDER_TRANSITIONS).find(
      (key) => RIDER_TRANSITIONS[key] === status
    );

    if (!from) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const order = await Order.findOne({
      _id: orderId,
      deliveryBoy: req.userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (order.status !== from) {
      return res.status(400).json({
        message:
          from === "preparing"
            ? "The restaurant is not done preparing yet."
            : `Cannot change order from "${order.status}" to "${status}".`,
      });
    }

    const update = { status };

    if (status === "delivered" && order.paymentMethod === "cod") {
      update.paymentStatus = "paid";
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, deliveryBoy: req.userId, status: from },
      { $set: update },
      { new: true }
    )
      .populate("shop", "name address city")
      .populate("user", "fullName mobile");

    if (!updated) {
      return res.status(409).json({
        message: "Order was already updated. Please refresh.",
      });
    }

    emitToUser(updated.user._id, "order-event", {
      orderId: updated._id,
      status,
      message: CUSTOMER_MESSAGES[status],
    });

    await notifyOwner(updated.shop._id, {
      orderId: updated._id,
      status,
      message:
        status === "delivered"
          ? "Order delivered successfully."
          : "Order picked up by the delivery partner.",
    });

    return res.status(200).json({
      message: "Order updated.",
      order: updated,
    });
  } catch (error) {
    console.error("UPDATE DELIVERY STATUS ERROR:", error);

    return res.status(500).json({
      message: "Unable to update the order.",
    });
  }
};