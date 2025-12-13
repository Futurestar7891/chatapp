import { io } from "socket.io-client";

let socket = null;

export const connectSocket = () => {
  if (!socket) {
  socket = io(import.meta.env.VITE_SERVER_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
  });

    
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
