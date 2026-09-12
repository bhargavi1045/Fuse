# Fuse

Fuse is a real-time multiplayer 2D battle game inspired by classic Bomberman-style gameplay.

The project uses a server-authoritative architecture where clients send player actions to the server, the server validates and processes those actions, updates the authoritative game state, and synchronizes the resulting state with connected players.

The primary focus of Fuse is the engineering behind a real-time multiplayer system, including real-time networking, state synchronization, concurrent actions, game simulation, authentication, room management, and connection handling.

## Features

* Real-time multiplayer gameplay
* Socket.IO-based real-time communication
* Multiplayer room management
* JWT-based authentication
* Password hashing with bcrypt
* Server-authoritative game state
* Fixed-rate game simulation loop
* Player movement
* Collision detection
* Bomb placement and timed explosions
* Explosion propagation
* Player health and elimination
* Real-time game-state synchronization
* MongoDB persistence
* Automated backend tests

## Architecture

Fuse follows a client-server architecture.

```text
                         Client
                    React + Canvas
                          |
                    HTTP/Socket.IO
                          |
                          v
                  +------------------+
                  |   Game Server    |
                  |                  |
                  | Express          |
                  | Socket.IO        |
                  | Authentication   |
                  | Room Management  |
                  | Input Validation |
                  | Game State       |
                  | Game Loop        |
                  | Game Rules       |
                  +--------+---------+
                           |
                 +---------+---------+
                 |                   |
                 v                   v
          In-Memory State         MongoDB
          Players                 Users
          Bombs                   Match Data
          Rooms                   Persistent Data
```

The server maintains the authoritative state of active games, while MongoDB is used for persistent application data.

## Server-Authoritative Architecture

Clients do not directly control the authoritative game state.

Instead of sending an authoritative position such as:

```text
"my position is (10, 5)"
```

the client sends an action such as:

```text
"move right"
```

The server then:

1. Receives the input.
2. Validates the request.
3. Processes the action.
4. Checks game rules and collisions.
5. Updates the authoritative state.
6. Broadcasts the resulting state to connected players.

This prevents clients from independently determining the state of the game.

The overall flow is:

```text
Client
  |
  v
Socket.IO
  |
  v
Socket Handler
  |
  v
Validation
  |
  v
Input Processing
  |
  v
Game State
  |
  v
Game Loop
  |
  v
State Update
  |
  v
Broadcast
  |
  v
Connected Clients
```

## Real-Time Communication

Fuse uses Socket.IO for bidirectional communication between the frontend and backend.

Clients send gameplay actions to the server, while the server broadcasts updated game state to players in the corresponding room.

```text
Player A --------\
Player B ---------> Game Server
Player C --------/

                     |
                     v

              Authoritative State
                     |
          +----------+----------+
          |          |          |
          v          v          v
       Player A   Player B   Player C
```

This allows multiple players to maintain a synchronized view of the same game.

## Game Loop

The server continuously runs the game simulation rather than allowing individual clients to independently determine the game state.

A game tick conceptually follows:

```text
Receive Inputs
      |
      v
Process Player Actions
      |
      v
Update Positions
      |
      v
Check Collisions
      |
      v
Process Bombs
      |
      v
Resolve Explosions
      |
      v
Update Player State
      |
      v
Broadcast State
      |
      v
Next Tick
```

This provides a single authoritative location where gameplay state is updated.

## Room Management

A room represents an individual multiplayer game.

Room management is responsible for:

* Creating rooms
* Joining rooms
* Tracking players
* Leaving rooms
* Managing game state
* Managing the match lifecycle
* Cleaning up completed or abandoned rooms

There is a distinction between the application-level game room and a Socket.IO room.

The application-level room represents the actual game and its state.

The Socket.IO room is a networking mechanism used to group connections and broadcast messages.

## Game Mechanics

### Player Movement

Player movement is validated by the server before modifying authoritative state.

```text
Player Input
     |
     v
Validate Input
     |
     v
Calculate New Position
     |
     v
Collision Check
     |
     v
Accept / Reject Movement
     |
     v
Update Game State
```

The client does not directly determine the final player position.

### Bombs

Bombs are part of the server-controlled game state.

A typical bomb lifecycle is:

```text
Player Places Bomb
       |
       v
Bomb Added to Game State
       |
       v
Timer / Game Loop
       |
       v
Explosion
       |
       v
Collision Detection
       |
       v
Damage
       |
       v
Player Elimination
       |
       v
Game State Update
       |
       v
Broadcast
```

## Authentication

Fuse uses JWT-based authentication and bcrypt for password hashing.

The registration flow is:

```text
Register
   |
   v
Hash Password
   |
   v
Store User
   |
   v
MongoDB
```

The login flow is:

```text
Login
  |
  v
Verify Credentials
  |
  v
Generate JWT
  |
  v
Authenticated Client
```

Socket connections are also associated with authenticated users so that the server can identify which user is performing an action.

## Persistence and Game State

Fuse separates persistent application data from high-frequency real-time game state.

During an active match, frequently changing state such as:

* Player positions
* Active bombs
* Temporary gameplay state
* Current room state

is maintained in memory.

Persistent information is stored in MongoDB.

This avoids turning every game tick or player movement into a database write.

```text
                 Game Server
                     |
          +----------+----------+
          |                     |
          v                     v
    In-Memory State          MongoDB
          |                     |
          v                     v
   Active Game State       Persistent Data
   Players                 Users
   Bombs                   Match Data
   Rooms
```

## Frontend

The frontend is built with React and is responsible for interacting with the game server and rendering the current game state.

Its responsibilities include:

* Authentication UI
* Room interaction
* Socket.IO connection
* Keyboard input
* Receiving game state
* Maintaining the client-side representation
* Rendering the game

The frontend primarily acts as an input producer and renderer, while the server remains responsible for authoritative gameplay decisions.

## Canvas Rendering

The game is rendered using the HTML Canvas API.

The rendering layer converts the latest game state received from the server into a visual representation of the game.

```text
Server Game State
       |
       v
Socket.IO
       |
       v
React State
       |
       v
Canvas Renderer
       |
       v
Game Frame
```

The Canvas is responsible for rendering elements such as players, bombs, explosions, and the game map.

## Concurrency and State Synchronization

Multiple players can perform actions at approximately the same time.

For example:

```text
Player A -> MOVE
Player B -> PLACE_BOMB
Player C -> MOVE
```

These inputs may arrive close together.

The server processes state-changing actions within the game simulation so that all clients ultimately observe the same authoritative state.

The important principle is:

```text
Multiple Clients
       |
       v
    Inputs
       |
       v
  Game Server
       |
       v
Authoritative State
       |
       v
Broadcast
       |
       v
All Clients
```

This prevents individual clients from independently producing conflicting game states.

## Connection Handling

Real-time multiplayer applications need to handle clients disconnecting unexpectedly.

Fuse handles Socket.IO connection lifecycle events so that the server can react when a player disconnects and maintain appropriate room and player state.

The general flow is:

```text
Client Disconnects
       |
       v
Server Detects Disconnect
       |
       v
Update Player / Room State
       |
       v
Continue or Clean Up Game
```

## Testing

The backend contains automated tests covering important application and game behavior.

Testing includes areas such as:

* User registration
* Login
* Authentication
* Room creation
* Room joining
* Player movement
* Bomb mechanics
* Collision handling
* Player damage and elimination
* Input validation
* Socket communication
* Connection handling

The goal is to verify actual system behavior rather than simply maximize code coverage.

## Tech Stack

### Backend

* Node.js
* TypeScript
* Express.js
* Socket.IO
* MongoDB
* Mongoose
* JWT
* bcrypt
* Jest
* Supertest

### Frontend

* React
* TypeScript
* Socket.IO Client
* HTML Canvas
* CSS

## Project Structure

```text
fuse/
|
+-- backend/
|   +-- ...
|
+-- frontend/
|   +-- ...
|
+-- README.md
```

The backend contains the server, authentication, room management, Socket.IO communication, game state, and game logic.

The frontend contains the React application, socket communication, user input handling, and rendering.

## Getting Started

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB

### Clone the Repository

```bash
git clone https://github.com/bhargavi1045/fuse.git
cd fuse
```

### Backend

```bash
cd backend
npm install
```

Create a `.env` file with the required configuration:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
```

Start the backend:

```bash
npm run dev
```

### Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will connect to the running backend and establish the Socket.IO connection.

## Engineering Concepts Demonstrated

Fuse was built to explore the engineering challenges involved in real-time multiplayer systems.

The project demonstrates practical experience with:

* REST APIs
* WebSocket communication
* Socket.IO
* Authentication
* JWT authorization
* Password hashing
* Server-authoritative state
* Real-time state synchronization
* Concurrent client actions
* Game simulation loops
* Collision detection
* Room management
* Connection handling
* In-memory state management
* Database persistence
* Automated testing

The central architectural principle is:

> Clients produce inputs. The server owns the truth.

## Design Trade-offs

Fuse intentionally prioritizes simplicity and understandability over introducing infrastructure that is unnecessary for the current scope.

The project does not depend on technologies such as:

* Redis
* Kafka
* RabbitMQ
* Kubernetes
* Microservices

A single game server with in-memory active game state is sufficient for the current scale.

A production-scale version could introduce additional infrastructure for:

* Horizontal scaling
* Cross-server room synchronization
* Distributed game state
* Message brokering
* Session management
* More advanced lag compensation
* Reduced bandwidth usage

These are potential future improvements rather than requirements of the current architecture.

## Future Improvements

Potential improvements include:

* Client-side interpolation
* Client prediction and reconciliation
* More advanced lag compensation
* Distributed game servers
* Redis-backed shared state
* Horizontal scaling
* Delta-based state synchronization
* Improved matchmaking
* Spectator mode
* Additional game modes
* Improved reconnection guarantees
* Performance testing under higher player counts
