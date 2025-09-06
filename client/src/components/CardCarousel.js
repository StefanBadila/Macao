
import React, { useState } from "react";

function CardCarousel({
  hand,
  selectedCards,
  selectableCards,
  onCardClick,
  chosenSuit,         // current suit for Ace
  handleChooseSuit,   // callback to choose suit
}) {
      // Suit images
      const spadesImg = "/Suitspades.png";
      const heartsImg = "/Suithearts.png";
      const diamondsImg = "/Suitdiamonds.png";
      const clubsImg = "/Suitclubs.png";
      const cardBackImg = "/back.png"
      const [hideCards, setHideCards] = useState(false);

  return (
    <div>
        {/* Toggle Button */}
        <div style={{ marginBottom: 10, textAlign: "left" }}>
        <button
            onClick={() => setHideCards(!hideCards)}
            style={{
            width: "100%",
            maxWidth: "260px", // same as action buttons
            padding: "14px 18px",
            fontSize: 16,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            backgroundColor: "#f44336", // red
            color: "white",
            margin: "6px 0",
            display: "block",
            transition: "transform 0.1s ease",
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.95)")}
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
            {hideCards ? "Show Cards" : "Hide Cards"}
        </button>
        </div>

      {/* Card Carousel */}
      <div
        style={{
          display: "flex",
          overflowX: "auto",
          gap: 10,
          padding: 10,
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          width: "100%",
        }}
      >
        {hand.map((card) => {
          const isSelected = selectedCards.some((c) => c.code === card.code);
          const disabled = !selectableCards.includes(card);
          const position = isSelected
            ? selectedCards.findIndex((c) => c.code === card.code) + 1
            : null;

          return (
            <div
              key={card.code}
              style={{
                flex: "0 0 auto",
                width: "calc(20% - 8px)", // 5 cards visible on desktop
                maxWidth: 150,
                minWidth: 100,
                position: "relative",
                textAlign: "center",
                scrollSnapAlign: "start",
              }}
            >
              {/* Selection badge */}
              {position && !hideCards && (
                <div
                  style={{
                    position: "absolute",
                    top: -10,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    zIndex: 2,
                  }}
                >
                  {position}
                </div>
              )}

              <img
                src={hideCards ? cardBackImg : card.image}
                alt={card.code}
                style={{
                  width: "100%",
                  height: "auto",
                  border: isSelected ? "3px solid black" : "1px solid gray",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: disabled ? 0.5 : 1,
                  display: "block",
                  margin: "0 auto",
                }}
                onClick={() => !disabled && !hideCards && onCardClick(card)}
              />
            </div>
          );
        })}
      </div>

      {/* Ace Suit Choice */}
      {selectedCards.some((c) => c.value === "ACE") && !hideCards  && (
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 20,
            alignItems: "center",
            flexWrap: "nowrap", // ensures it wraps nicely on mobile
          }}
        >
          {[
            ["SPADES", spadesImg],
            ["HEARTS", heartsImg],
            ["DIAMONDS", diamondsImg],
            ["CLUBS", clubsImg],
          ].map(([suit, img]) => (
            <img
              key={suit}
              src={img}
              alt={suit}
              width={45}
              style={{
                border: chosenSuit === suit ? "3px solid blue" : "1px solid gray",
                cursor: "pointer",
              }}
              onClick={() => handleChooseSuit(suit)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CardCarousel;
