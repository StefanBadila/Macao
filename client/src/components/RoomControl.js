import React from "react";

function RoomControl({ createRoom }) {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px",
  };

  const buttonStyle = {
    width: "320px",
    padding: "16px",
    fontSize: "18px",
    borderRadius: "10px",
    border: "none",
    backgroundColor: "#2196F3",
    color: "white",
    cursor: "pointer",
    transition: "transform 0.1s ease",
  };

  return (
    <div style={containerStyle}>
      <button
        onClick={createRoom}
        style={buttonStyle}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        Create Room (Host)
      </button>
    </div>
  );
}

export default RoomControl;
