import React from "react";

function RoomControl({ createRoom }) {
  return (
    <div>
      <button onClick={createRoom}>Create Room (Host)</button>
    </div>
  );
}

export default RoomControl;
