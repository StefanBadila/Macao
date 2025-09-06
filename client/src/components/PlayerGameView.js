import React, { useState, useMemo, useEffect } from "react";
import { socket } from "../App";
import CardCarousel from "./CardCarousel";
import ActionButtons from "./ActionButtons";

function PlayerGameView({ hand, roomCode, currentTurn, players, gameOver, stackedFours, stackedDraw }) {
  const [selectedCards, setSelectedCards] = useState([]);
  const [chosenSuit, setChosenSuit] = useState(null); // suit for Ace
  const [hasDrawn, setHasDrawn] = useState(false);

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

    const cardCodes = selectedCards.map((c) => c.code);
    socket.emit("playCard", { roomCode, cardCodes, chosenSuit });

    setSelectedCards([]);
    setChosenSuit(null);
  };

  // Determine selectable cards (all cards are selectable now)
  const selectableCards = useMemo(() => {
    if (currentTurn !== socket.id) return [];
    return hand; // no restriction, all cards can be played
  }, [hand, currentTurn]);

  // Find this player
  const thisPlayer = players.find((p) => p.id === socket.id);
  const playerName = thisPlayer?.name || "Player";

  return (
    <div style={{ padding: 20 }}>
      {/* Current turn on top */}
      <h2>
        Current Turn:{" "}
        {currentTurn === socket.id
          ? "Your turn"
          : players.find((p) => p.id === currentTurn)?.name || "Unknown player"}
      </h2>

      {/* Player hand title */}
      <h3>{playerName}'s Hand</h3>

      <CardCarousel
        hand={hand}
        selectedCards={selectedCards}
        selectableCards={selectableCards}
        onCardClick={handleCardClick}
        chosenSuit={chosenSuit}
        handleChooseSuit={handleChooseSuit}
      />

      {/* Show draw penalty only if active */}
      {stackedDraw > 0 && (
        <p>Draw Penalty: {stackedDraw} cards</p>
      )}
      {/* Show skip turns based on stackedFours */}
      {stackedFours > 0 && (
        <p>Skip Turn: {stackedFours} {stackedFours === 1 ? "turn" : "turns"}</p>
      )}

      <ActionButtons
        selectedCards={selectedCards}
        currentTurn={currentTurn}
        gameOver={gameOver}
        stackedFours={stackedFours}
        hasDrawn={hasDrawn}
        hand={hand}
        roomCode={roomCode}
        socket={socket}
        playSelected={playSelected}
        setHasDrawn={setHasDrawn}
      />

    </div>
  );
}

export default PlayerGameView;
