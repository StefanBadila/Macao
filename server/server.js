const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { nanoid } = require("nanoid");
const os = require("os");
const axios = require("axios");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Get local IP
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        if (name.toLowerCase().includes("wifi")) {
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
    const roomCode = nanoid(4).toUpperCase();
    rooms[roomCode] = { host: socket.id, players: [{ id: socket.id, name: "Host" }], hands: {}, deckId: null };
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    io.to(roomCode).emit("playerList", rooms[roomCode].players);
    console.log("Room created:", roomCode);
    
  });

  // Player joins room
  socket.on("joinRoom", ({ roomCode, playerName }) => {
    if (!rooms[roomCode]) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

      // Check if name already exists in this room 
      const nameExists = rooms[roomCode].players.some(
        (p) => p.name.toLowerCase() === playerName.toLowerCase()
      );
      if (nameExists) {
        socket.emit("errorMessage", "That name is already taken in this room");
        return;
      }

    rooms[roomCode].players.push({ id: socket.id, name: playerName });
    socket.join(roomCode);
    io.to(roomCode).emit("playerList", rooms[roomCode].players);
    console.log(`${playerName} joined room ${roomCode}`);
    
  });

  // Start game (host only)
  socket.on("startGame", async ({ roomCode }) => {
    const room = rooms[roomCode];


    if (!room || socket.id !== room.host) return;

    const firstPlayer = room.players.find(p => p.id !== room.host);
    room.currentTurn = firstPlayer ? firstPlayer.id : room.host;
    console.log(room.currentTurn)

    try {
      // 1. Create and shuffle a new deck
      const deckRes = await axios.get(
        "https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1"
      );
      const deckId = deckRes.data.deck_id;
      room.deckId = deckId;

      // 2. Draw cards: 1 for host + 2 for each non-host player
      const nonHostCount = room.players.filter(p => p.id !== room.host).length;
      const totalCards = 1 + nonHostCount * 2;

      const drawRes = await axios.get(
        `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${totalCards}`
      );
      const cards = drawRes.data.cards;

      // 3. Assign host hand (1 card)
      const hostHand = [cards.shift()];
      room.hands[room.host] = hostHand;

      // 4. Assign 2 cards to every other player
      room.players.forEach((player) => {
        if (player.id !== room.host) {
          room.hands[player.id] = [cards.shift(), cards.shift()];
        }
      });

      // 5. Build counts for all players (host included)
      const counts = room.players.map((player) => ({
        id: player.id,
        name: player.id === room.host ? "Host" : player.name,
        cardCount: room.hands[player.id].length,
      }));
      // 6. Notify host with all counts + their hand
      io.to(room.host).emit("gameStartedHost", {
        roomCode,
        counts,
        hostHand: room.hands[room.host],
        currentTurn: room.currentTurn,
      });

      // 7. Notify each player with only their hand
      room.players.forEach((player) => {
        io.to(player.id).emit("gameStartedPlayer", {
          roomCode,
          hand: room.hands[player.id],
          currentTurn: room.currentTurn,
        });
      });

      console.log("Game started in room:", roomCode);
      console.log("Hands:", room.hands);
      console.log("Next turn: ", room.currentTurn);

    } catch (err) {
      console.error("Error starting game:", err);
      socket.emit("errorMessage", "Failed to start game");
    }

  });

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const [roomCode, room] of Object.entries(rooms)) {
      // Player disconnect
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        delete room.hands[socket.id];
        io.to(roomCode).emit("playerList", room.players);
        console.log(`${playerName} removed from room ${roomCode}`);
        break;
      }

      // Host disconnect
      if (room.host === socket.id) {
        io.to(roomCode).emit("errorMessage", "Host disconnected. Room closed.");
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted (host left)`);
        break;
      }
    }
  });

  socket.on("playCard", ({ roomCode, cardCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

    // 1. Check if player is in room && if it is player turn 
    const player = room.players.find(p => p.id === socket.id);
    if (!player) {
      socket.emit("errorMessage", "You are not in this room");
      return;
    }
    if (room.currentTurn !== socket.id) {
      socket.emit("errorMessage", "Not your turn!");
      return;
    }

    // 2. Remove card from player's hand
    const cardIndex = room.hands[socket.id].findIndex(c => c.code === cardCode);
    if (cardIndex === -1) {
      socket.emit("errorMessage", "Card not in hand");
      return;
    }
    const [playedCard] = room.hands[socket.id].splice(cardIndex, 1);

    // 3. Add card to host's hand (or host's discard pile)
    if (!room.hands[room.host]) room.hands[room.host] = [];
    room.hands[room.host].push(playedCard);

    const nonHostPlayers = room.players.filter(p => p.id !== room.host);
    const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
    const nextIndex = (currentIndex + 1) % nonHostPlayers.length;
    room.currentTurn = nonHostPlayers[nextIndex].id;


    // 4. Broadcast updated game state
    io.to(roomCode).emit("gameState", {
      topCard: playedCard, // the last card played
      hands: room.hands,
    });
    // 5. Emit currentTurn
    io.to(roomCode).emit("turnUpdate", {
      currentTurn: room.currentTurn,
    });
    
  });

    // Player draws a card
  socket.on("drawCard", async ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("errorMessage", "Room not found");
      return;
    }

    if (!room.deckId) {
      socket.emit("errorMessage", "Deck not initialized");
      return;
    }

    try {
      const drawRes = await axios.get(
        `https://deckofcardsapi.com/api/deck/${room.deckId}/draw/?count=1`
      );
      const drawnCard = drawRes.data.cards[0];

      if (!room.hands[socket.id]) room.hands[socket.id] = [];
      room.hands[socket.id].push(drawnCard);
      
      const nonHostPlayers = room.players.filter(p => p.id !== room.host);
      const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
      const nextIndex = (currentIndex + 1) % nonHostPlayers.length;
      room.currentTurn = nonHostPlayers[nextIndex].id;

      // Broadcast updated hands
      io.to(roomCode).emit("gameState", {
        topCard: drawnCard,
        hands: room.hands,
      });
      // Emit currentTurn
      io.to(roomCode).emit("turnUpdate", {
        currentTurn: room.currentTurn,
      });
    } catch (err) {
      console.error("Error drawing card:", err);
      socket.emit("errorMessage", "Failed to draw a card");
    }
  });


});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
