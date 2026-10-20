import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

let io = null;

const DELIVERY_ROOM = "available-delivery";
const userRoom = (userId) => `user:${userId}`;

// Cookie header se token nikalne ka simple parser
const getCookie = (header = "", name) => {
  const part = header
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));

  return part ? decodeURIComponent(part.slice(name.length + 1)) : null;
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Handshake par cookie se user pehchano
  io.use((socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, "token");

      if (!token) return next(new Error("unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = String(decoded.userId);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    socket.join(userRoom(socket.userId));

    // Delivery boy online hai to request wale room me daalo
    try {
      const user = await User.findById(socket.userId).select(
        "role isAvailable"
      );

      if (user?.role === "deliveryBoy" && user.isAvailable) {
        socket.join(DELIVERY_ROOM);
      }
    } catch (error) {
      console.error("SOCKET CONNECTION ERROR:", error);
    }
  });

  return io;
};

export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(userRoom(userId)).emit(event, payload);
};

export const emitToDeliveryBoys = (event, payload) => {
  if (!io) return;
  io.to(DELIVERY_ROOM).emit(event, payload);
};

// Online/offline toggle par us user ke saare sockets ko room me daalo/nikalo
export const setDeliveryAvailability = (userId, available) => {
  if (!io) return;

  const sockets = io.in(userRoom(userId));

  if (available) {
    sockets.socketsJoin(DELIVERY_ROOM);
  } else {
    sockets.socketsLeave(DELIVERY_ROOM);
  }
};