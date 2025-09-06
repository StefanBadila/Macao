import React, { useRef, useEffect } from "react";

function JoinRoom({ roomCode, setRoomCode, playerName, setPlayerName, joinRoom, focusNameInput }) {
  const nameInputRef = useRef(null);

  useEffect(() => {
    if (focusNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [focusNameInput]);

  const inputStyle = {
    width: "300px",
    padding: "16px",
    margin: "10px 0",
    fontSize: "18px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    outline: "none",
    boxSizing: "border-box",
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
    marginTop: "20px",
    transition: "transform 0.1s ease",
  };

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
    marginBottom: "30px",
    color: "#333",
  };

  return (
    <div style={containerStyle}>
      <h2 style={titleStyle}>Join a Room</h2>
      <input
        type="text"
        placeholder="Room Code"
        value={roomCode || ""}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
        style={inputStyle}
      />
      <input
        ref={nameInputRef}
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={inputStyle}
      />
      <button
        onClick={joinRoom}
        disabled={!roomCode || !playerName}
        style={buttonStyle}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Join
      </button>
    </div>
  );
}

export default JoinRoom;
