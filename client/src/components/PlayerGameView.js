import React, { useState, useMemo } from "react";
import { socket } from "../App";

function PlayerGameView({ hand, roomCode, currentTurn, players, currentSuit }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [chosenSuit, setChosenSuit] = useState(null); // suit for Ace

  // Suit images from public folder
  const spadesImg = "/Suitspades.png";
  const heartsImg = "/Suithearts.png";
  const diamondsImg = "/Suitdiamonds.png";
  const clubsImg = "/Suitclubs.png";

  // Handle clicking a card
  const handleCardClick = (card) => {
    if (currentTurn !== socket.id) return;

    // Deselect card if already selected
    if (selectedCards.some((c) => c.code === card.code)) {
      setSelectedCards(selectedCards.filter((c) => c.code !== card.code));
      if (card.value === "ACE") setChosenSuit(null);
      return;
    }

    // Ace can always be selected
    setSelectedCards([...selectedCards, card]);

    if (card.value === "ACE") setChosenSuit(null);
  };

  // Handle choosing suit for Ace
  const handleChooseSuit = (suit) => {
    setChosenSuit(suit);
  };

  // Play selected cards
  const playSelected = () => {
    if (selectedCards.length === 0) return;

    // Check if any Ace requires a suit
    const aceCards = selectedCards.filter((c) => c.value === "ACE");
    if (aceCards.length > 0 && !chosenSuit) {
      alert("Please choose a suit for the Ace!");
      return;
    }

    selectedCards.forEach((card) => {
      if (card.value === "ACE") {
        socket.emit("playCard", { roomCode, cardCode: card.code, chosenSuit });
      } else {
        socket.emit("playCard", { roomCode, cardCode: card.code });
      }
    });

    setSelectedCards([]);
    setChosenSuit(null);
  };

  // Determine selectable cards (same number as first non-Ace or Ace)
  const selectableCards = useMemo(() => {
    if (selectedCards.length === 0) return hand;
    const firstValue = selectedCards.find((c) => c.value !== "ACE")?.value;
    return hand.filter((c) => c.value === firstValue || c.value === "ACE");
  }, [hand, selectedCards]);

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

      {/* Ace suit choice row */}
      {selectedCards.some((c) => c.value === "ACE") && (
        <div style={{ display: "flex", gap: 20, marginTop: 20, alignItems: "center" }}>
          <p>Choose suit for Ace:</p>
          <img
            src={spadesImg}
            alt="SPADES"
            width={80}
            style={{
              border: chosenSuit === "SPADES" ? "3px solid blue" : "1px solid gray",
              cursor: "pointer",
            }}
            onClick={() => handleChooseSuit("SPADES")}
          />
          <img
            src={heartsImg}
            alt="HEARTS"
            width={80}
            style={{
              border: chosenSuit === "HEARTS" ? "3px solid blue" : "1px solid gray",
              cursor: "pointer",
            }}
            onClick={() => handleChooseSuit("HEARTS")}
          />
          <img
            src={diamondsImg}
            alt="DIAMONDS"
            width={80}
            style={{
              border: chosenSuit === "DIAMONDS" ? "3px solid blue" : "1px solid gray",
              cursor: "pointer",
            }}
            onClick={() => handleChooseSuit("DIAMONDS")}
          />
          <img
            src={clubsImg}
            alt="CLUBS"
            width={80}
            style={{
              border: chosenSuit === "CLUBS" ? "3px solid blue" : "1px solid gray",
              cursor: "pointer",
            }}
            onClick={() => handleChooseSuit("CLUBS")}
          />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: 20, display: "flex", gap: 20 }}>
        <button
          onClick={playSelected}
          disabled={selectedCards.length === 0 || currentTurn !== socket.id}
          style={{ padding: "10px 20px", fontSize: 16 }}
        >
          Play Selected Cards
        </button>

        <button
          onClick={() => currentTurn === socket.id && socket.emit("drawCard", { roomCode })}
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
