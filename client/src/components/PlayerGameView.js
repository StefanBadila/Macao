import React, { useState } from "react";
import { socket } from "../App";

function PlayerGameView({ hand, roomCode, currentTurn, players  }) {
  const [selectedCard, setSelectedCard] = useState(null);

  // Play selected card
  const playCard = () => {
    if (currentTurn !== socket.id) {
      alert("It's not your turn!");
      return;
    }
    if (!selectedCard) {
      alert("Select a card to play");
      return;
    }

    socket.emit("playCard", { roomCode, cardCode: selectedCard.code });
    setSelectedCard(null); // reset selection after playing
  };

  // Draw a card
  const drawCard = () => {
    if (currentTurn !== socket.id) {
      alert("It's not your turn!");
      return;
    }
    socket.emit("drawCard", { roomCode });
  };

  return (
    <div>
      <h2>Your Hand</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {hand.map((card) => (
          <div key={card.code} style={{ textAlign: "center" }}>
            <img
              src={card.image}
              alt={card.code}
              width={100}
              style={{
                border: selectedCard?.code === card.code ? "3px solid blue" : "1px solid gray",
                cursor: currentTurn === socket.id ? "pointer" : "not-allowed",
              }}
              onClick={() => {
                if (currentTurn === socket.id) setSelectedCard(card);
              }}
            />
            <p>{card.code}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
        <button
          onClick={playCard}
          disabled={currentTurn !== socket.id || !selectedCard}
          style={{ padding: "10px 20px", fontSize: 16 }}
        >
          Play Selected Card
        </button>

        <button
          onClick={drawCard}
          disabled={currentTurn !== socket.id}
          style={{ padding: "10px 20px", fontSize: 16 }}
        >
          Draw Card
        </button>
      </div>
        <p style={{ marginTop: 10 }}>
          Current Turn:{" "}
          {currentTurn === socket.id
            ? "Your turn"
            : players.find((p) => p.id === currentTurn)?.name || "Unknown player"}
        </p>
    </div>
  );
}

export default PlayerGameView;
