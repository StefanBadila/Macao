import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom";

import RoomControl from "./components/RoomControl";
import HostView from "./components/HostView";
import JoinRoom from "./components/JoinRoom";
import PlayerView from "./components/PlayerView";
import HostGameView from "./components/HostGameView";
import PlayerGameView from "./components/PlayerGameView";

export const socket = io("192.168.0.199:5000"); 

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function App() {
  const query = useQuery();
  const roomFromQR = query.get("room");

  const [roomCode, setRoomCode] = useState(roomFromQR || null);
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState("");
  const [joined, setJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [lanIp, setLanIp] = useState("");

  
  useEffect(() => {
    fetch("http://localhost:5000/api/lan-ip")
      .then(res => res.json())
      .then(data => setLanIp(data.ip));
  }, []);

  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [hostCounts, setHostCounts] = useState([]);
  const [hostHand, setHostHand] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [currentSuit, setCurrentSuit] = useState(null); 
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [stackedFours,setStackedFours] = useState(0);
  const [stackedDraw,setStackedDraw] = useState(0);
  // Socket listeners
  useEffect(() => {

    socket.on("gameOver", ({ winner }) => {
    setGameOver(true);
    setWinner(winner);
    alert(`${winner} has won the game!`);
  });

    socket.on("newRoom", ({ roomCode, players }) => {
    setRoomCode(roomCode);
    setGameStarted(false);
    setPlayerHand([]);
    setHostHand([]);
    setHostCounts([]);
    setCurrentTurn(null);
    setCurrentSuit(null);
    setGameOver(false);
    setPlayers(players || []);

  });


    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      setIsHost(true);
    });

    socket.on("playerList", (players) =>{ 
      setPlayers(players);
      if (players.some((p) => p.id === socket.id)) {
      setJoined(true);
    }
    });
    socket.on("errorMessage", (msg) => {
      alert(msg)
      setPlayerName("");
      //setJoined(false);
    });


    socket.on("gameStartedHost", ({ counts, hostHand, currentTurn }) => {
      setGameStarted(true);
      setHostCounts(counts);
      setHostHand(hostHand);
      setCurrentTurn(currentTurn);
    });

    socket.on("gameStartedPlayer", ({ hand, currentTurn }) => {
      setGameStarted(true);
      setPlayerHand(hand);
      setCurrentTurn(currentTurn);
    });

    socket.on("gameState", ({ topCard, hands, currentSuit: suitFromServer }) => {
      
      const hostId = players[0]?.id; // safe check for host
      if (isHost) {
        // Update host hand
        if (hands[hostId]) 
          setHostHand(hands[hostId]);
          // Update counts for all players
          setHostCounts(
            Object.keys(hands).map((id) => ({
              id,
              name: id === hostId ? "Host" : players.find((p) => p.id === id)?.name,
              cardCount: hands[id].length,
            }))
          );
      }
      else {
        // Update only this player's hand
        setPlayerHand(hands[socket.id] || []);
      }
      // Update currentSuit
      if (suitFromServer) setCurrentSuit(suitFromServer);
      console.log("Top card:", topCard);
      console.log("Hands:", hands);
      socket.emit("checkTurn", { roomCode });
    });
    socket.on("turnUpdate", ({ currentTurn }) => {
      setCurrentTurn(currentTurn);
    });
    socket.on("stackedFoursUpdate", ({ stackedFours }) => {
      setStackedFours(stackedFours);
    });
    socket.on("stackedDrawUpdate", ({ stackedDraw }) => {
      setStackedDraw(stackedDraw);  
    });


    return () => {
      socket.off("roomCreated");
      socket.off("playerList");
      socket.off("errorMessage");
      socket.off("gameStartedHost");
      socket.off("gameStartedPlayer");
      socket.off("gameState");
      socket.off("currentTurn");
      socket.off("gameOver");
      socket.off("newRoom");
      socket.off("stackedFours");
      socket.off("stackedDraw");
    };
  }, [isHost, players, playerName,roomCode]);


  // Create / join room
  const createRoom = () => socket.emit("createRoom");
  const joinRoom = () => {
    socket.emit("joinRoom", { roomCode, playerName });
  };

  // Start game (host only)
  const startGame = () => {
    // if (players.length < 2) {
    //   alert("At least 2 players are required to start the game!");
    //   return;
    // }
    socket.emit("startGame", { roomCode });
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Macao MVP</h1>
      {/* Room creation */}
      {!roomCode && <RoomControl createRoom={createRoom} />}

      {/* Host view before game starts */}
      {!gameStarted && isHost && roomCode && (
        <HostView
          roomCode={roomCode}
          lanIp={lanIp}
          players={players}
          startGame={startGame}
        />
      )}

      {/* Player view before game starts */}
      {!gameStarted && !isHost && joined && (
        <PlayerView
          playerName={playerName}
          players={players}
        />
      )}

      {/* Join form if not host and not joined */}
      {!isHost && !joined && (
        <JoinRoom
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          playerName={playerName}
          setPlayerName={setPlayerName}
          joinRoom={joinRoom}
        />
      )}

      {/* Game views */}
     {gameStarted && isHost && (
        <HostGameView
          counts={hostCounts}
          hostHand={hostHand}
          roomCode={roomCode}
          players={players}
          currentTurn={currentTurn}
          currentSuit = {currentSuit ?? null}
          gameOver={gameOver}
        />
)}
      {gameStarted && !isHost && (
        <PlayerGameView hand={playerHand} roomCode={roomCode} currentTurn={currentTurn} players={players} topCard={hostHand[hostHand.length-1]} gameOver={gameOver} stackedFours={stackedFours} stackedDraw={stackedDraw} />
      )}
    </div>
  );
}

export default App;
