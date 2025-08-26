const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { nanoid } = require("nanoid");
const os = require("os");
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (name.toLowerCase().includes("wifi")){
            return iface.address;
        }
      }
    }
  }
  return "localhost";
}

app.get("/api/lan-ip", (req, res) => {
  res.json({ ip: getLocalIP() });
});

// In-memory rooms
const rooms = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Host creates room
  socket.on("createRoom", () => {
    const roomCode = nanoid(4).toUpperCase(); // e.g. "AB12"
    rooms[roomCode] = { host: socket.id, players: [] };
    socket.join(roomCode);
    console.log("Room created:", roomCode);
    socket.emit("roomCreated", roomCode);
  });

  // Player joins room
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].players.push({ id: socket.id, name: playerName });
      socket.join(roomCode);

      // Update everyone in the room
      io.to(roomCode).emit("playerList", rooms[roomCode].players);
      console.log(`${playerName} joined room ${roomCode}`);
    } else {
      socket.emit("errorMessage", "Room not found");
    }
  });

socket.on("disconnect", () => {
  console.log("User disconnected:", socket.id);

  // Iterate all rooms to find this user
  for (const [roomCode, room] of Object.entries(rooms)) {
    const playerIndex = room.players.findIndex(p => p.id === socket.id);

    if (playerIndex !== -1) {
      const playerName = room.players[playerIndex].name;
      room.players.splice(playerIndex, 1); // Remove player
      console.log(`${playerName} removed from room ${roomCode}`);

      // Notify remaining clients in this room
      io.to(roomCode).emit("playerList", room.players);

      // Optional: if room is empty, delete it
      if (room.players.length === 0 && room.host !== socket.id) {
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted (empty)`);
      }
      break; // Found the room, exit loop
    }

    // Optional: if the host disconnected, handle host transfer or room deletion
    if (room.host === socket.id) {
      // Simple approach: delete the room
      io.to(roomCode).emit("errorMessage", "Host disconnected. Room closed.");
      delete rooms[roomCode];
      console.log(`Room ${roomCode} deleted (host left)`);
      break;
    }
  }
});

});

server.listen(5000, () => {
  console.log(" Server running on port 5000");
});
