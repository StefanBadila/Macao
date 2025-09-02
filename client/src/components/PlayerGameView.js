import React, { useState, useMemo, useEffect } from "react";
import { socket } from "../App";

function PlayerGameView({ hand, roomCode, currentTurn, players, gameOver, stackedFours,stackedDraw }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [chosenSuit, setChosenSuit] = useState(null); // suit for Ace
  const [hasDrawn, setHasDrawn] = useState(false);

  // Suit images
  const spadesImg = "/Suitspades.png";
  const heartsImg = "/Suithearts.png";
  const diamondsImg = "/Suitdiamonds.png";
  const clubsImg = "/Suitclubs.png";

  useEffect(() => {
    setHasDrawn(false); // reset when turn switches
  }, [currentTurn]);

// Handle clicking a card
const handleCardClick = (card) => {
  if (currentTurn !== socket.id) return;

  // Deselect if already selected
  if (selectedCards.some((c) => c.code === card.code)) {
    setSelectedCards(selectedCards.filter((c) => c.code !== card.code));
    if (card.value === "ACE") setChosenSuit(null);
    return;
  }

  // If there are already selected cards, check value
  if (selectedCards.length > 0 && selectedCards[0].value !== card.value) {
    // Reset selection if a different value is clicked
    setSelectedCards([card]);
  } else {
    setSelectedCards([...selectedCards, card]);
  }

  if (card.value === "ACE") setChosenSuit(null);
};


  // Choose suit for Ace
  const handleChooseSuit = (suit) => {
    setChosenSuit(suit);
  };

  // Play selected cards
  const playSelected = () => {
    if (selectedCards.length === 0 || gameOver) return;

    const aceCards = selectedCards.filter((c) => c.value === "ACE");
    if (aceCards.length > 0 && !chosenSuit) {
      alert("Please choose a suit for the Ace!");
      return;
    }

    const cardCodes = selectedCards.map(c => c.code);
    socket.emit("playCard", { roomCode, cardCodes, chosenSuit });

    setSelectedCards([]);
    setChosenSuit(null);
  };

  // Determine selectable cards (all cards are selectable now)
  const selectableCards = useMemo(() => {
    if (currentTurn !== socket.id) return [];
    return hand; // no restriction, all cards can be played
  }, [hand, currentTurn]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Your Hand</h2>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {hand.map((card) => {
            const isSelected = selectedCards.some((c) => c.code === card.code);
            const disabled = !selectableCards.includes(card);
            const position = isSelected
              ? selectedCards.findIndex((c) => c.code === card.code) + 1
              : null;

            // Check if this card is a Joker on top of stack
            let penaltyNumber = null;
            if (card.value === "JOKER") {
              penaltyNumber = card.suit === "RED" ? 10 : 5;
            }

            return (
              <div key={card.code} style={{ textAlign: "center", position: "relative" }}>
                {position && (
                  <div
                    style={{
                      position: "absolute",
                      top: -10,
                      left: 40,
                      background: "red",
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    {position}
                  </div>
                )}

                {/* Penalty number for Joker */}
                {penaltyNumber && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: -10,
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: "black",
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    {penaltyNumber}
                  </div>
                )}

                <img
                  src={card.image}
                  alt={card.code}
                  width={100}
                  style={{
                    border: isSelected ? "3px solid black" : "1px solid gray",
                    cursor: disabled ? "not-allowed" : "pointer",
                    opacity: disabled ? 0.5 : 1,
                  }}
                  onClick={() => !disabled && handleCardClick(card)}
                />
                <p>{card.code}</p>
              </div>
            );
          })}

      </div>
      <p>Stacked Draw Penalty: {stackedDraw > 0 ? `${stackedDraw} cards` : "None"}</p>
      {/* Ace suit choice */}
      {selectedCards.some((c) => c.value === "ACE") && (
        <div style={{ display: "flex", gap: 20, marginTop: 20, alignItems: "center" }}>
          <p>Choose suit for Ace:</p>
          {[["SPADES", spadesImg], ["HEARTS", heartsImg], ["DIAMONDS", diamondsImg], ["CLUBS", clubsImg]].map(
            ([suit, img]) => (
              <img
                key={suit}
                src={img}
                alt={suit}
                width={80}
                style={{ border: chosenSuit === suit ? "3px solid blue" : "1px solid gray", cursor: "pointer" }}
                onClick={() => handleChooseSuit(suit)}
              />
            )
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
        <button
          onClick={playSelected}
          disabled={selectedCards.length === 0 || currentTurn !== socket.id || gameOver}
          style={{ padding: "10px 20px", fontSize: 16 }}
        >
          Play Selected Cards
        </button>

        <button
          onClick={() => {
            if (currentTurn === socket.id && !gameOver && stackedFours < 1 && !hasDrawn) {
              socket.emit("drawCard", { roomCode });
              setHasDrawn(true);
            }
          }}
          disabled={currentTurn !== socket.id || gameOver || stackedFours > 0}
          style={{ padding: "10px 20px", fontSize: 16 }}
        >
          Draw Card
        </button>
      </div>

      {/* Voluntary skip button */}
      {stackedFours > 0 && hand.some(card => card.value === "4") && currentTurn === socket.id && !gameOver && (
        <button
          onClick={() => {
            socket.emit("skipTurn", { roomCode });
          }}
          style={{ padding: "10px 20px", fontSize: 16, backgroundColor: "orange", color: "white" }}
        >
          Skip Turn (Keep 4)
        </button>
      )}

      <p style={{ marginTop: 10 }}>
        Current Turn:{" "}
        {currentTurn === socket.id
          ? "Your turn"
          : players.find((p) => p.id === currentTurn)?.name || "Unknown player"}
      </p>

      {/* Display skipTurnCounter */}
      <div style={{ marginTop: 20 }}>
        <h3>Players Skip Turn Status</h3>
        {players.map((p) => (
          <p key={p.id}>
            {p.name}: {p.skipTurnCounter > 0 ? `Skip ${p.skipTurnCounter} turn(s)` : "Can play"}
          </p>
        ))}
      </div>
    </div>
  );
}

export default PlayerGameView;
