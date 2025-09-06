import React, { useMemo } from "react";

function HostGameView({
  counts,
  hostHand,
  roomCode,
  players,
  currentTurn,
  currentSuit,
  stackedDraw = 0,
  stackedFours = 0,
}) {
  // Extract top card and last 5 previous
  const topCard = hostHand.length > 0 ? hostHand[hostHand.length - 1] : null;
  const lastFive = useMemo(() => {
    if (hostHand.length <= 1) return [];
    return hostHand.slice(-6, -1); // last 5 before top card
  }, [hostHand]);

  // Other players excluding host
  const otherPlayers = counts.filter((p) => p.name !== "Host");

  // Split players into columns of max 5
  const firstColumn = otherPlayers.slice(0, 5);
  const secondColumn = otherPlayers.slice(5);

  // Styles
  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    textAlign: "center",
    padding: "10px",
    gap: "10px",
  };

  const roomCodeStyle = {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#333",
    margin: 0,
  };

  const currentTurnStyle = {
    fontSize: "28px",
    fontWeight: "600",
    color: "#d32f2f",
    margin: 0,
  };

  const sectionTitleStyle = {
    fontSize: "22px",
    margin: "10px 0",
    color: "#333",
  };

  const topCardContainer = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap",
  };

  const prevCardsContainer = {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    flexWrap: "wrap",
  };

  const playerListContainer = {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    flexWrap: "wrap",
    marginBottom: 0,
  };

  const listStyle = {
    listStyleType: "decimal",
    paddingLeft: "20px",
    fontSize: "18px",
    color: "#333",
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <p style={roomCodeStyle}>Room Code: {roomCode}</p>
      <p style={currentTurnStyle}>
        Current Turn: {players.find((p) => p.id === currentTurn)?.name || "Unknown player"}
      </p>

      {/* Draw and Skip penalties */}
      {stackedDraw !== 0 && (
        <p style={currentTurnStyle}>Draw Penalty: {stackedDraw}</p>
      )}
      {stackedFours !== 0 && (
        <p style={currentTurnStyle}>Turn Skip Penalty: {stackedFours}</p>
      )}

      {/* Top Card */}
      <h3 style={sectionTitleStyle}>Top Card on Stack</h3>
      {topCard ? (
        <div style={topCardContainer}>
          <img
            src={topCard.image}
            alt={topCard.code}
            width={170}
            style={{ borderRadius: "8px" }}
          />
          {currentSuit && currentSuit !== topCard.suit && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <p style={{ margin: 0 }}>Next suit:</p>
              <img
                src={`${process.env.PUBLIC_URL}/Suit${currentSuit.toLowerCase()}.png`}
                alt={currentSuit}
                width={50}
              />
            </div>
          )}
        </div>
      ) : (
        <p>No card played yet</p>
      )}

      {/* Previous 5 Cards */}
      {lastFive.length > 0 && (
        <>
          <h4 style={sectionTitleStyle}>Previous 5 Cards</h4>
          <div style={prevCardsContainer}>
            {lastFive.map((card, i) => (
              <img
                key={i}
                src={card.image}
                alt={card.code}
                width={100}
                style={{ borderRadius: "6px" }}
              />
            ))}
          </div>
        </>
      )}

      {/* Other Players */}
      <h3 style={sectionTitleStyle}>Other Players</h3>
      <div style={playerListContainer}>
        <ol style={listStyle}>
          {firstColumn.map((p) => (
            <li key={p.id}>
              {p.name}: {p.cardCount} card{p.cardCount !== 1 ? "s" : ""}
            </li>
          ))}
        </ol>
        {secondColumn.length > 0 && (
          <ol style={listStyle} start={6}>
            {secondColumn.map((p) => (
              <li key={p.id}>
                {p.name}: {p.cardCount} card{p.cardCount !== 1 ? "s" : ""}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

export default HostGameView;
