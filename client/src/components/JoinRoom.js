import React, { useRef, useEffect } from "react";

function JoinRoom({ roomCode, setRoomCode, playerName, setPlayerName, joinRoom, focusNameInput }) {
  const nameInputRef = useRef(null);

  // focus the name input if parent requests it
  useEffect(() => {
    if (focusNameInput && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [focusNameInput]);

  return (
    <div>
      <h2>Join a Room</h2>
      <input
        type="text"
        placeholder="Room Code"
        value={roomCode || ""}
        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
      />
      <input
        ref={nameInputRef}
        type="text"
        placeholder="Your Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button
        onClick={joinRoom}
        disabled={!roomCode || !playerName} // disable if empty
      >
        Join
      </button>
    </div>
  );
}

export default JoinRoom;
