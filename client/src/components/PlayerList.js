import React from "react";

function PlayerList({ players }) {
  if (!players || players.length <= 1) return <p>No other players yet</p>;

  // Skip host (first player)
  const nonHostPlayers = players.slice(1);

  // Split into two columns if more than 5 players
  const firstColumn = nonHostPlayers.slice(0, 5);
  const secondColumn = nonHostPlayers.slice(5);

  const containerStyle = {
    display: "flex",
    gap: "40px", // space between columns
    justifyContent: "center",
  };

  const listStyle = {
    listStyleType: "decimal",
    paddingLeft: "20px",
    fontSize: "20px",
    color: "#333",
  };

  return (
    <div style={containerStyle}>
      <ol style={listStyle}>
        {firstColumn.map((player, index) => (
          <li key={player.id}>{player.name}</li>
        ))}
      </ol>
      {secondColumn.length > 0 && (
        <ol style={listStyle} start={6}>
          {secondColumn.map((player, index) => (
            <li key={player.id}>{player.name}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default PlayerList;
