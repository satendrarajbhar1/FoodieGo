import { io } from "socket.io-client";
import { serverUrl } from "./App";

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(serverUrl, {
      withCredentials: true,
      autoConnect: false,
    });
  }

  return socket;
};