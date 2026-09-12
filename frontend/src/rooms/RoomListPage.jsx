import { useCallback, useEffect, useState } from 'react';
import * as roomsApi from '../api/roomsApi';
import CreateRoomForm from './CreateRoomForm';
import useJoinRoom from './useJoinRoom';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import { useAuth } from '../auth/useAuth';

const POLL_MS = 4000;

function RoomListPage({ onJoinedRoom }) {
  const { user, logout } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [listError, setListError] = useState(null);
  const { joinRoom, isJoining, joinError } = useJoinRoom();
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [roomIdInput, setRoomIdInput] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await roomsApi.listRooms();
      setRooms(data);
      setListError(null);
    } catch (err) {
      setListError(err.message || 'Could not load rooms');
    }
  }, []);

  useEffect(() => {
    refresh();
    const intervalId = setInterval(refresh, POLL_MS);
    return () => clearInterval(intervalId);
  }, [refresh]);

  async function handleJoin(roomId) {
    setJoiningRoomId(roomId);
    try {
      await joinRoom(roomId);
      onJoinedRoom(roomId);
    } catch {
      // joinError is already surfaced via the hook's state.
    } finally {
      setJoiningRoomId(null);
    }
  }

  function handleCreated(roomId) {
    refresh();
    handleJoin(roomId);
  }

  async function handleJoinById(event) {
    event.preventDefault();
    const roomId = roomIdInput.trim();
    if (!roomId) return;

    await handleJoin(roomId);
  }

  return (
    <div className="bz-panel">
      <header className="bz-panel__header">
        <div>
          <p className="bz-eyebrow">Signed in as {user?.username}</p>
          <h1 className="bz-panel__title">Rooms</h1>
        </div>
        <Button variant="ghost" onClick={logout}>
          Log out
        </Button>
      </header>

      <CreateRoomForm onCreated={handleCreated} />

      <form className="bz-join-room" onSubmit={handleJoinById}>
        <TextInput
          label="Join with room ID"
          value={roomIdInput}
          onChange={setRoomIdInput}
          placeholder="room_..."
          autoComplete="off"
          required
        />
        <Button type="submit" disabled={isJoining || !roomIdInput.trim()}>
          {isJoining ? 'Joining…' : 'Join room'}
        </Button>
      </form>

      {listError && <p className="bz-error">{listError}</p>}
      {joinError && <p className="bz-error">{joinError}</p>}

      {rooms.length === 0 ? (
        <p className="bz-hint">Create a room and share its ID, or join a room using an ID someone shared with you.</p>
      ) : (
        <ul className="bz-room-list">
          {rooms.map((room) => (
            <li key={room.roomId} className="bz-room-list__row">
              <div>
                <p className="bz-room-list__id">{room.roomId}</p>
                <p className="bz-room-list__meta">
                  {room.playerCount}/{room.maxPlayers} players · {room.status.replace('_', ' ')}
                </p>
              </div>
              <Button
                onClick={() => handleJoin(room.roomId)}
                disabled={(isJoining && joiningRoomId === room.roomId) || room.playerCount >= room.maxPlayers}
              >
                {isJoining && joiningRoomId === room.roomId
                  ? 'Joining…'
                  : room.playerCount >= room.maxPlayers
                    ? 'Full'
                    : 'Join'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RoomListPage;
