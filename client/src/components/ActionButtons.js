// ActionButtons.js
import React from "react";

function ActionButtons({
  selectedCards,
  currentTurn,
  gameOver,
  stackedFours,
  hasDrawn,
  hand,
  roomCode,
  socket,
  playSelected,
  setHasDrawn,
}) {
  const isMyTurn = currentTurn === socket.id;

  const baseButtonStyle = {
    width: "100%",
    maxWidth: "260px", // about 2 card widths
    padding: "14px 18px",
    fontSize: 16,
    borderRadius: 10,
    border: "none",
    cursor: "pointer",
    color: "white",
    margin: "6px 0", // center buttons
    display: "block",
  };

  const getButtonStyle = (color) => ({
    ...baseButtonStyle,
    backgroundColor: color,
  });

  return (
    <div style={{ marginTop: 20, textAlign: "left" }}>
      {/* Play button */}
      <button
        onClick={playSelected}
        disabled={selectedCards.length === 0 || !isMyTurn || gameOver}
        style={getButtonStyle("#4CAF50")}
      >
        Play Selected
      </button>

      {/* Draw button */}
      <button
        onClick={() => {
          if (isMyTurn && !gameOver && stackedFours < 1 && !hasDrawn) {
            socket.emit("drawCard", { roomCode });
            setHasDrawn(true);
          }
        }}
        disabled={!isMyTurn || gameOver || stackedFours > 0}
        style={getButtonStyle("#2196F3")}
      >
        Draw Card
      </button>

      {/* Skip button */}
      {stackedFours > 0 &&
        hand.some((card) => card.value === "4") &&
        isMyTurn &&
        !gameOver && (
          <button
            onClick={() => socket.emit("skipTurn", { roomCode })}
            style={getButtonStyle("orange")}
          >
            Skip Turn
          </button>
        )}
    </div>
  );
}

export default ActionButtons;
