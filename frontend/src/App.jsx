import { useState } from 'react';
import { useAuth } from './auth/useAuth';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RoomListPage from './rooms/RoomListPage';
import GamePage from './game/GamePage';

function App() {
  const { isAuthenticated, user } = useAuth();
  const [authScreen, setAuthScreen] = useState('login'); 
  const [activeRoomId, setActiveRoomId] = useState(null);

  if (!isAuthenticated) {
    return authScreen === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthScreen('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthScreen('login')} />
    );
  }

  if (activeRoomId) {
    return <GamePage roomId={activeRoomId} selfId={user.id} onLeaveRoom={() => setActiveRoomId(null)} />;
  }

  return <RoomListPage onJoinedRoom={setActiveRoomId} />;
}

export default App;
