# Macao Web Card Game

A real-time, multiplayer web implementation of the classic European card game Macao, built with React, Node.js, Express.js and Socket.io. This project features a centralized server-side game state, special card mechanics, and seamless room-based matchmaking.

# Key Features
* Real-time Multiplayer: Instant synchronization between players using WebSockets.
* External API Integration: Powered by the Deck of Cards API for card shuffling, drawing, and image assets.
* Complex Game Logic: Fully implemented "Special Card" rules.
* Smart Room Management:
   * Unique 4-character room codes (via nanoid).
   * Automatic host/player role detection.
   * LAN IP discovery for local network play.
   * QR code support for quick joining.
* Robust Game Loop: Automatic deck refilling (shuffling the discard pile back into the deck) and post-game lobby transitions.
  
# How it Works
The first user creates a room and becomes the Host. The Host sees the table overview (card counts of all players) and the central discard pile. Players join using the room code and see their private hand.
  ## Gameplay Mechanics
  1. Valid Moves: Players must match the current suit or the value of the top card.
  2. Stacking Penalties: If a 2, 3, or Joker is played, the stackedDraw counter increases. The next player must either play another draw card or draw the total amount. If a 4 is played, the stackedFours counter increases. The next player must play a 4 or skip turns equal to the stack.
  3. Deck Management: If the draw pile is empty, the server automatically takes the discard pile (excluding the top card), returns it to the API, and reshuffles.
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
| `client/src/App.js`       | React App |
| `server/server.js`        | Server main file |

# Photos
<img width="570" height="737" alt="1" src="https://github.com/user-attachments/assets/47b7b80a-f250-4989-9c9e-fd21a71a5feb" />

![2](https://github.com/user-attachments/assets/c13f977f-9177-44ef-82ef-01f6e78b336b)
![3](https://github.com/user-attachments/assets/e4d4a291-e6dc-4d5d-8ac4-4a0087acaf4f)
![4](https://github.com/user-attachments/assets/bf0e045e-700a-48a1-8f02-8b679533d19b)
![5](https://github.com/user-attachments/assets/2c5f8fe2-48f0-405b-a3b2-8e7ecb20d016)

