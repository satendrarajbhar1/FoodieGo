import express from "express";
import http from "http";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import shopRouter from "./routes/shopRoutes.js";
import itemRouter from "./routes/itemRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import deliveryRouter from "./routes/deliveryRoutes.js";
import { initSocket } from "./utils/socket.js";
import { startOrderCleanup } from "./utils/cleanupOrders.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// Render jaise proxy ke peeche sahi IP aur secure cookie ke liye
app.set("trust proxy", 1);

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const limiterMessage = {
  message: "Too many attempts. Please try again after some time.",
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: limiterMessage,
});

app.get("/", (req, res) => res.send("Tomato API is running"));

app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);
app.use("/api/delivery", deliveryRouter);

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  try {
    await connectDb();
    startOrderCleanup();

    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();