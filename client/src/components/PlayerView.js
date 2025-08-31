import React from "react";
import PlayerList from "./PlayerList";


function PlayerView({ playerName, players }) {
  return (
    <div>
      <h3>Welcome, {playerName}!</h3>

      <h4>Other players in the room:</h4>
      <PlayerList players={players} />
    </div>
  );
}

export default PlayerView;
