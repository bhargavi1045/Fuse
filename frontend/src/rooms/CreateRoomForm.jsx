import { useState } from 'react';
import * as roomsApi from '../api/roomsApi';
import Button from '../components/Button';

function CreateRoomForm({ onCreated }) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      const room = await roomsApi.createRoom();
      onCreated(room.roomId);
    } catch (err) {
      setError(err.message || 'Could not create a room');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="bz-create-room">
      <Button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? 'Creating…' : 'Create a new room'}
      </Button>
      {error && <p className="bz-error">{error}</p>}
    </div>
  );
}

export default CreateRoomForm;
