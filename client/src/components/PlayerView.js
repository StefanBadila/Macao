import React from "react";
import PlayerList from "./PlayerList";

function PlayerView({ playerName, players }) {
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "10px",
  };

  const welcomeStyle = {
    fontSize: "28px",
    marginBottom: "20px",
    color: "#333",
  };

  const subtitleStyle = {
    fontSize: "22px",
    marginBottom: "15px",
  };

  return (
    <div style={containerStyle}>
      <h3 style={welcomeStyle}>Welcome, {playerName}!</h3>
      <h4 style={subtitleStyle}>Other players in the room:</h4>
      <PlayerList players={players} />
    </div>
  );
}

export default PlayerView;
