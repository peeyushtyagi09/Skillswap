import { io } from "socket.io-client";

let socket = null;

export function initSocket() {
  const token = localStorage.getItem("accessToken");

  if (!socket) {
    socket = io("http://localhost:8000", {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10, // more forgiving
    });

    // Debug logs
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("⚠️ Socket connection error:", err.message);
    });
  }

  return socket;
}

export function getSocket() {
  return socket || initSocket();
}

export function connectSocket() {
  const s = initSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    // ⚠️ don’t set socket=null, keep instance so reconnection works
  }
}

export function updateSocketToken(newToken) {
  if (socket) {
    socket.auth = { token: newToken };
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }
}
