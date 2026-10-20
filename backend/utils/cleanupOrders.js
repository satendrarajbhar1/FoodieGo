import Order from "../models/orderModel.js";

const ONE_HOUR = 60 * 60 * 1000;

const cleanup = async () => {
  try {
    const result = await Order.deleteMany({
      status: "awaiting_payment",
      createdAt: { $lt: new Date(Date.now() - ONE_HOUR) },
    });

    if (result.deletedCount > 0) {
      console.log(`Cleaned ${result.deletedCount} abandoned orders`);
    }
  } catch (error) {
    console.error("ORDER CLEANUP ERROR:", error);
  }
};

export const startOrderCleanup = () => {
  cleanup();
  setInterval(cleanup, ONE_HOUR);
};