import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { useLocation } from "react-router-dom";

const socket = io("localhost:5000"); 

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

  // Fetch LAN IP from backend
  useEffect(() => {
    fetch("http://localhost:5000/api/lan-ip")
      .then(res => res.json())
      .then(data => setLanIp(data.ip));
  }, []);
  
  // Listen for server events
  useEffect(() => {
    socket.on("roomCreated", (code) => {
      setRoomCode(code);
      setIsHost(true);
    });

    socket.on("playerList", (players) => setPlayers(players));
    socket.on("errorMessage", (msg) => alert(msg));

    return () => {
      socket.off("roomCreated");
      socket.off("playerList");
      socket.off("errorMessage");
    };
  }, []);

  const createRoom = () => socket.emit("createRoom");
  const joinRoom = () => { 
    socket.emit("joinRoom", { roomCode, playerName }); 
    setJoined(true); 
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Macao MVP</h1>

      {/* Host view */}
      {!roomCode && <button onClick={createRoom}>Create Room (Host)</button>}

      {roomCode && (
        <div>
          <div>
            <h2>Room Code: {roomCode}</h2>
            <p>Share this code with your friends:</p>
            <strong>{roomCode}</strong>
            <button onClick={() => navigator.clipboard.writeText(roomCode)}>Copy Code</button>
            <div style={{ marginTop: 20 }}>
              <p>LAN IP: {lanIp}</p>
              {lanIp && <QRCodeSVG value={`http://${lanIp}:3000/?room=${roomCode}`} />}
            </div>
          </div>

          <h3>Players:</h3>
          <ul>{players.map((p) => <li key={p.id}>{p.name}</li>)}</ul>
        </div>
      )}

      <hr />

      {/* Player view */}
      {!isHost && !joined && (
        <div>
          <h2>Join a Room</h2>
          <input
            type="text"
            placeholder="Room Code"
            value={roomCode || ""}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          />
          <input
            type="text"
            placeholder="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
          />
          <button onClick={joinRoom}>Join</button>
        </div>
      )}

      {joined && <h3>Welcome, {playerName}!</h3>}
    </div>
  );
}

export default App;
