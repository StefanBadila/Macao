# Macao Web Card Game

A real-time, multiplayer web implementation of the classic European card game Macao, built with React, Node.js, Express.js and Socket.io. This project features a centralized server-side game state, special card mechanics, and seamless room-based matchmaking.

# How it Works
The first user creates a room and becomes the Host. The Host sees the table overview (card counts of all players) and the central discard pile. Players join using the room code and see their private hand.
  ## Gameplay Mechanics
  1. Valid Moves: Players must match the current suit or the value of the top card.
  2. Stacking Penalties: If a 2, 3, or Joker is played, the stackedDraw counter increases. The next player must either play another draw card or draw the total amount.
  3. If a 4 is played, the stackedFours counter increases. The next player must play a 4 or skip turns equal to the stack.
  4. Deck Management: If the draw pile is empty, the server automatically takes the discard pile (excluding the top card), returns it to the API, and reshuffles.
  ## Win Condition
  When a player’s hand reaches zero cards, the server triggers a gameOver event, announces the winner, and automatically migrates all players into a new room for a rematch.
  
# Tech Stack
* Frontend: React.js, React Router, Socket.io-client.
* Backend: Node.js, Express.
* Communication: Socket.io (Bi-directional Event-based communication).
* Utilities: Axios (API requests), Nanoid (Room IDs).
  
# Contents

| File/folder | Description |
|-------------|-------------|
| `digitaltimer.kicad_sch`       | Schematic |
| `digitaltimer.kicad_pcb`       | PCB editor |
| `digitaltimer.kicad_pro`       | KiCad project file |
| `digitaltimer.kicad_prl`       | KiCad project rules |
| `README.md` | This README file. |
