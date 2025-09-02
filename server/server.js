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

// In-memory rooms
const rooms = {};

// --- Helpers ---
function isSpecialCard(card) {
  return (
    card.value === "ACE" ||
    card.value === "2" ||
    card.value === "3" ||
    card.value === "4" ||
    card.value === "JOKER"
  );
}

function giveFirstTwoPlayersTwosAndThrees(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const nonHostPlayers = room.players.filter(p => p.id !== room.host);

  nonHostPlayers.slice(0, 2).forEach((player, index) => {
    if (!room.hands[player.id]) room.hands[player.id] = [];

    const twoCard = { code: `2H-${Date.now() + index * 2}`, value: "2", suit: "HEARTS", image: "https://deckofcardsapi.com/static/img/2H.png" };
    const threeCard = { code: `3H-${Date.now() + index * 2 + 1}`, value: "3", suit: "HEARTS", image: "https://deckofcardsapi.com/static/img/3H.png" };
    const aceCard = { 
  code: `AH-${Date.now() + index * 2 + 2}`, 
  value: "ACE", 
  suit: "HEARTS", 
  image: "https://deckofcardsapi.com/static/img/AH.png" 
};
const jokerCard = {
  code: `JOKER-${Date.now() + index * 2 + 2}`,
  value: "JOKER",
  suit: "RED", // or "RED"
  image: "https://deckofcardsapi.com/static/img/XX.png"
};


    const fours = [
  { code: `4H-${Date.now()}`, value: "4", suit: "HEARTS", image: "https://deckofcardsapi.com/static/img/4H.png" },
  { code: `4D-${Date.now() + 1}`, value: "4", suit: "DIAMONDS", image: "https://deckofcardsapi.com/static/img/4D.png" },
  { code: `4S-${Date.now() + 2}`, value: "4", suit: "SPADES", image: "https://deckofcardsapi.com/static/img/4S.png" }
];

room.hands[player.id].push(...fours);
    room.hands[player.id].push(twoCard, threeCard,aceCard,jokerCard);

    console.log(`Added 2 and 3 to ${player.name}`);
  });

  // Broadcast updated game state
  io.to(roomCode).emit("gameState", {
    topCard: room.hands[room.host][room.hands[room.host].length - 1],
    hands: room.hands,
    currentSuit: room.currentSuit
  });
}

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

// --- Game Logic ---
function checkWinCondition(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return;

  if (room.hands[playerId] && room.hands[playerId].length === 0) {
    const winner = room.players.find(p => p.id === playerId);
    room.gameOver = true;
    io.to(roomCode).emit("gameOver", {
      winner: winner?.name || "Unknown Player"
    });

    console.log(` Player ${winner?.name} won in room ${roomCode}`);

    // Create a new room and move all players
    const newRoomCode = nanoid(4).toUpperCase();
    const newRoom = {
      host: room.host,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        skipTurnCounter: 0
      })),
      hands: {},
      deckId: null,
      gameOver: false,
      stackedFours: 0,
      stackedDraw: 0
    };

    rooms[newRoomCode] = newRoom;

    newRoom.players.forEach(player => {
      const socketInstance = io.sockets.sockets.get(player.id);
      if (socketInstance) {
        socketInstance.leave(roomCode);
        socketInstance.join(newRoomCode);
      }
    });

    io.to(newRoomCode).emit("newRoom", {
      roomCode: newRoomCode,
      players: newRoom.players
    });
    io.to(newRoomCode).emit("playerList", newRoom.players);
  }
}

function canPlayerPlay(roomCode, playerId) {
  const room = rooms[roomCode];
  if (!room) return false;

  const playerHand = room.hands[playerId];
  if (!playerHand || playerHand.length === 0) return false;

  const player = room.players.find(p => p.id === playerId);
  if (!player) return false;

  if (player.freePlayNextTurn) {
    player.freePlayNextTurn = false;
    return true;
  }

  if (player.skipTurnCounter > 0){
    player.skipTurnCounter -= 1;
    return false;
  }

  if (player.voluntarySkip) {
    // Assign skipTurnCounter if stackedFours is active
    if (room.stackedFours > 0) {
      player.skipTurnCounter = room.stackedFours;
      room.stackedFours = 0;
    } else {
      player.skipTurnCounter -= 1;
    }
    player.voluntarySkip = false;
    return false;
  }


  // If stackedFours rule is active → must play a 4
  if (room.stackedFours > 0) {
    const hasFour = playerHand.some(c => c.value === "4");
    if (!hasFour) {
      // Player cannot play → assign skipTurnCounter the stackedFours value
      player.skipTurnCounter = room.stackedFours;
      room.stackedFours = 0; // reset after assigning
      return false;
    }
    return true; // player has a 4, can play
  }

  // If stackedDraw rule is active → must play 2,3 or Joker
  if (room.stackedDraw > 0) {
    return playerHand.some(c => c.value === "2" || c.value === "3" || c.value === "JOKER");
  }

  return true;
}

// --- Socket.IO ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("createRoom", () => {
    const roomCode = nanoid(4).toUpperCase();
    rooms[roomCode] = {
      host: socket.id,
      players: [{ id: socket.id, name: "Host" }],
      hands: {},
      deckId: null,
      gameOver: false,
      stackedFours: 0,
      stackedDraw: 0
    };
    socket.join(roomCode);
    socket.emit("roomCreated", roomCode);
    io.to(roomCode).emit("playerList", rooms[roomCode].players);
    console.log("Room created:", roomCode);
  });

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    if (!rooms[roomCode]) {
      socket.emit("errorMessage", "Room not found");
      return;
    }
    const nameExists = rooms[roomCode].players.some(
      (p) => p.name.toLowerCase() === playerName.toLowerCase()
    );
    if (nameExists) {
      socket.emit("errorMessage", "That name is already taken in this room");
      return;
    }

    rooms[roomCode].players.push({ id: socket.id, name: playerName, skipTurnCounter: 0 });
    socket.join(roomCode);
    io.to(roomCode).emit("playerList", rooms[roomCode].players);
    console.log(`${playerName} joined room ${roomCode}`);
  });

  socket.on("startGame", async ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || socket.id !== room.host) return;

    const firstPlayer = room.players.find(p => p.id !== room.host);
    room.currentTurn = firstPlayer ? firstPlayer.id : room.host;

    try {
      const deckRes = await axios.get("https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1&jokers_enabled=true");
      const deckId = deckRes.data.deck_id;
      room.deckId = deckId;

      const nonHostCount = room.players.filter(p => p.id !== room.host).length;
      const totalCards = 1 + nonHostCount * 2;

      const drawRes = await axios.get(
        `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=${totalCards}`
      );
      const cards = drawRes.data.cards;

      let hostCard = cards.shift();
      while (isSpecialCard(hostCard)) {
        await axios.get(`https://deckofcardsapi.com/api/deck/${deckId}/return/?cards=${hostCard.code}`);
        const redrawRes = await axios.get(
          `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`
        );
        hostCard = redrawRes.data.cards[0];
      }

      room.hands[room.host] = [hostCard];
      room.currentSuit = room.hands[room.host][0].suit;

      room.players.forEach((player) => {
        if (player.id !== room.host) {
          room.hands[player.id] = [cards.shift(), cards.shift()];
        }
      });
      giveFirstTwoPlayersTwosAndThrees(roomCode);
      const counts = room.players.map((player) => ({
        id: player.id,
        name: player.id === room.host ? "Host" : player.name,
        cardCount: room.hands[player.id].length,
      }));

      io.to(room.host).emit("gameStartedHost", {
        roomCode,
        counts,
        hostHand: room.hands[room.host],
        currentTurn: room.currentTurn,
      });

      room.players.forEach((player) => {
        io.to(player.id).emit("gameStartedPlayer", {
          roomCode,
          hand: room.hands[player.id],
          currentTurn: room.currentTurn,
        });
      });

      console.log("Game started in room:", roomCode);
    } catch (err) {
      console.error("Error starting game:", err);
      socket.emit("errorMessage", "Failed to start game");
    }
  });

  socket.on("playCard", ({ roomCode, cardCodes, chosenSuit }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit("errorMessage", "Room not found");

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return socket.emit("errorMessage", "You are not in this room");
    if (room.currentTurn !== socket.id) return socket.emit("errorMessage", "Not your turn!");

    if (!Array.isArray(cardCodes) || cardCodes.length === 0) {
      return socket.emit("errorMessage", "No cards selected");
    }

    let topCard = room.hands[room.host][room.hands[room.host].length - 1];

    for (let i = 0; i < cardCodes.length; i++) {
      const cardCode = cardCodes[i];
      const cardIndex = room.hands[socket.id].findIndex(c => c.code === cardCode);
      if (cardIndex === -1) return socket.emit("errorMessage", "Card not in hand");

      const playedCard = room.hands[socket.id][cardIndex];

      // --- FREE PLAY: skip normal rules if freePlayNextTurn is true ---
      if (!player.freePlayNextTurn) {
        if (playedCard.value !== "ACE" && playedCard.value !== "JOKER") {
          // Normal draw/four rules
          if (room.stackedFours > 0 && playedCard.value !== "4") {
            return socket.emit("errorMessage", "You must play a 4 because of stacked 4s!");
          } 
          else if (room.stackedDraw > 0 && !["2","3","JOKER"].includes(playedCard.value)) {
            return socket.emit("errorMessage", "You must continue the draw chain!");
          } 
          else if (room.stackedFours === 0 && room.stackedDraw === 0 &&
                  playedCard.suit !== room.currentSuit && playedCard.value !== topCard.value) {
            return socket.emit("errorMessage", "Invalid move: must match suit or rank of top card");
          }
        } else if (playedCard.value === "ACE") {
          // Ace rules (as before)
          if (room.stackedDraw > 0 || room.stackedFours > 0) {
            return socket.emit("errorMessage", "You cannot play an Ace to stop a draw chain!");
          }
          if (!chosenSuit || !["HEARTS","DIAMONDS","CLUBS","SPADES"].includes(chosenSuit)) {
            return socket.emit("errorMessage", "You must choose a valid suit for the Ace");
          }
        } else if (playedCard.value === "JOKER") {
          // Joker rules
          if (room.stackedFours > 0) {
            return socket.emit("errorMessage", "You cannot play a Joker to stop a draw chain!");
          }
        }
      } else {
        // --- Player is on free play turn, any card is allowed ---
        // Reset freePlayNextTurn after playing
        player.freePlayNextTurn = false;
      }
      
      room.hands[socket.id].splice(cardIndex, 1);
      if (!room.hands[room.host]) room.hands[room.host] = [];
      room.hands[room.host].push(playedCard);

      // --- Update penalties ---
      if (playedCard.value === "4") {
        room.stackedFours += 1;
        room.stackedDraw = 0;
      } else if (playedCard.value === "2") {
        room.stackedDraw += 2;
        room.stackedFours = 0;
      } else if (playedCard.value === "3") {
        room.stackedDraw += 3;
        room.stackedFours = 0;
      } else if (playedCard.value === "JOKER") {
        const isRed = playedCard.suit === "RED" || playedCard.suit === "BLACK";
        room.stackedDraw += isRed ? 10 : 5;
        room.stackedFours = 0;
      } else {
        room.stackedFours = 0;
        room.stackedDraw = 0;
      }

      topCard = playedCard;
    }

    const lastCard = room.hands[room.host][room.hands[room.host].length - 1];
    room.currentSuit = lastCard.value === "ACE" ? chosenSuit : lastCard.suit;

    if (checkWinCondition(roomCode, socket.id)) return;

    const nonHostPlayers = room.players.filter(p => p.id !== room.host);
    const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
    let nextPlayerId;

    for (let i = 1; i <= nonHostPlayers.length; i++) {
      const nextIndex = (currentIndex + i) % nonHostPlayers.length;
      const candidateId = nonHostPlayers[nextIndex].id;
      if (canPlayerPlay(roomCode, candidateId)) {
        nextPlayerId = candidateId;
        break;
      }
    }
    if (!nextPlayerId) {
      nextPlayerId = nonHostPlayers[(currentIndex + 1) % nonHostPlayers.length].id;
    }

    room.currentTurn = nextPlayerId;

    io.to(roomCode).emit("gameState", {
      topCard: lastCard,
      hands: room.hands,
      currentSuit: room.currentSuit,
    });
    io.to(roomCode).emit("turnUpdate", { currentTurn: room.currentTurn });
    io.to(roomCode).emit("stackedFoursUpdate", { stackedFours: room.stackedFours });
    io.to(roomCode).emit("stackedDrawUpdate", { stackedDraw: room.stackedDraw });
  });

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
    if (room.gameOver) return;

    try {
      let drawCount = 1;
      if (room.stackedDraw > 0) {
        drawCount = room.stackedDraw;

        const nonHostPlayers = room.players.filter(p => p.id !== room.host);
        const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
        const nextIndex = (currentIndex + 1) % nonHostPlayers.length;
        nonHostPlayers[nextIndex].freePlayNextTurn = true;

        room.stackedDraw = 0;
      }

      const drawRes = await axios.get(
        `https://deckofcardsapi.com/api/deck/${room.deckId}/draw/?count=${drawCount}`
      );
      const drawnCards = drawRes.data.cards;

      if (!room.hands[socket.id]) room.hands[socket.id] = [];
      room.hands[socket.id].push(...drawnCards);

      const nonHostPlayers = room.players.filter(p => p.id !== room.host);
      const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
      const nextIndex = (currentIndex + 1) % nonHostPlayers.length;
      room.currentTurn = nonHostPlayers[nextIndex].id;

      io.to(roomCode).emit("gameState", {
        topCard: room.hands[room.host][room.hands[room.host].length - 1],
        hands: room.hands,
        currentSuit: room.currentSuit
      });
      io.to(roomCode).emit("turnUpdate", { currentTurn: room.currentTurn });
      io.to(roomCode).emit("stackedFoursUpdate", { stackedFours: room.stackedFours });
      io.to(roomCode).emit("stackedDrawUpdate", { stackedDraw: room.stackedDraw });
    } catch (err) {
      console.error("Error drawing card:", err);
      socket.emit("errorMessage", "Failed to draw a card");
    }
  });

  socket.on("skipTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return socket.emit("errorMessage", "Room not found");

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return socket.emit("errorMessage", "You are not in this room");
    if (room.currentTurn !== socket.id) return socket.emit("errorMessage", "Not your turn!");

    player.voluntarySkip = true;

    const nonHostPlayers = room.players.filter(p => p.id !== room.host);
    const currentIndex = nonHostPlayers.findIndex(p => p.id === socket.id);
    let nextPlayerId;

    for (let i = 1; i <= nonHostPlayers.length; i++) {
      const nextIndex = (currentIndex + i) % nonHostPlayers.length;
      const candidateId = nonHostPlayers[nextIndex].id;
      if (canPlayerPlay(roomCode, candidateId)) {
        nextPlayerId = candidateId;
        break;
      }
    }
    if (!nextPlayerId) {
      nextPlayerId = nonHostPlayers[(currentIndex + 1) % nonHostPlayers.length].id;
    }

    room.currentTurn = nextPlayerId;
    room.stackedFours = 0;

    io.to(roomCode).emit("turnUpdate", { currentTurn: room.currentTurn });
    io.to(roomCode).emit("stackedFoursUpdate", { stackedFours: room.stackedFours });
    io.to(roomCode).emit("stackedDrawUpdate", { stackedDraw: room.stackedDraw });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const [roomCode, room] of Object.entries(rooms)) {
      const playerIndex = room.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        const playerName = room.players[playerIndex].name;
        room.players.splice(playerIndex, 1);
        delete room.hands[socket.id];
        io.to(roomCode).emit("playerList", room.players);
        console.log(`${playerName} removed from room ${roomCode}`);
        break;
      }
      if (room.host === socket.id) {
        io.to(roomCode).emit("errorMessage", "Host disconnected. Room closed.");
        delete rooms[roomCode];
        console.log(`Room ${roomCode} deleted (host left)`);
        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
