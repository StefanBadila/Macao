import React, { useMemo } from "react";

function HostGameView({ counts, hostHand, roomCode, players, currentTurn }) {
  // Extract top card and last 5 previous
  const topCard = hostHand.length > 0 ? hostHand[hostHand.length - 1] : null;
  const lastFive = useMemo(() => {
    if (hostHand.length <= 1) return [];
    return hostHand.slice(-6, -1); // last 5 before the top card
  }, [hostHand]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Game Started! (Host)</h2>
      <p>Room Code: {roomCode}</p>

      {/* Top card */}
      <h3>Top Card on Stack:</h3>
      {topCard ? (
        <img
          src={topCard.image}
          alt={topCard.code}
          width={100}
          style={{ border: "3px solid red", marginBottom: 20 }}
        />
      ) : (
        <p>No card played yet</p>
      )}

      {/* Last 5 previous cards */}
      <h4>Previous 5 cards:</h4>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {lastFive.map((card, i) => (
          <img
            key={i}
            src={card.image}
            alt={card.code}
            width={60}
          />
        ))}
      </div>
      {/* Other players card counts */}
      <h3>Other Players and number of cards:</h3>
      <ul>
        {counts
          .filter((p) => p.name !== "Host") // exclude host
          .map((p) => (
            <li key={p.id}>
              {p.name}: {p.cardCount} card{p.cardCount > 1 ? "s" : ""}
            </li>
          ))}
      </ul>

      <p style={{ marginTop: 10 }}>
        Current Turn: {players.find((p) => p.id === currentTurn)?.name || "Unknown player"}
      </p>
    </div>
  );
}

export default HostGameView;
