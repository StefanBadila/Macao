import React from "react";
import { QRCodeSVG } from "qrcode.react";
import PlayerList from "./PlayerList";

function HostView({ roomCode, lanIp, players,startGame }) {
  return (
    <div>
      <h2>Room Code: {roomCode}</h2>
      <button onClick={() => navigator.clipboard.writeText(roomCode)}>Copy Code</button>
      <p>Share this code with your friends:</p>
      <div style={{ marginTop: 20 }}>
        {lanIp && <QRCodeSVG value={`http://${lanIp}:3000/?room=${roomCode}`} />}
      </div>

      <h3>Players:</h3>
      <PlayerList players={players} />

      {/* Start Game button */}
      <button
        onClick={startGame}
        style={{ marginTop: 20, padding: "10px 20px", fontSize: 16 }}
      >
        Start Game
      </button>
    </div>
  );
}

export default HostView;
