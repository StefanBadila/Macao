import React from "react";
import { QRCodeSVG } from "qrcode.react";
import PlayerList from "./PlayerList";

function HostView({ roomCode, lanIp, players, startGame }) {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px",
  };

  const titleStyle = {
    fontSize: "32px",
    marginBottom: "20px",
    color: "#333",
  };

  const buttonStyle = {
    width: "320px",
    padding: "16px",
    fontSize: "18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#4CAF50",
    color: "white",
    cursor: "pointer",
    marginTop: "15px",
    transition: "transform 0.1s ease",
  };

  const copyButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#2196F3",
  };

  const qrContainerStyle = {
    marginTop: "20px",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Room Code: {roomCode}</h2>

      <button
        onClick={() => navigator.clipboard.writeText(roomCode)}
        style={copyButtonStyle}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Copy Code
      </button>

      <p style={{ marginTop: "20px", fontSize: "18px", color: "#555" }}>
        Share this code with your friends:
      </p>

      <div style={qrContainerStyle}>
        {lanIp && <QRCodeSVG value={`http://${lanIp}:3000/?room=${roomCode}`} size={200} />}
      </div>

      <h3 style={{ marginTop: "30px", fontSize: "24px", color: "#333" }}>Players:</h3>
      <PlayerList players={players} />

      <button
        onClick={startGame}
        style={buttonStyle}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Start Game
      </button>
    </div>
  );
}

export default HostView;
