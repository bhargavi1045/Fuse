import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import TextInput from '../components/TextInput';
import Button from '../components/Button';

function LoginPage({ onSwitchToRegister }) {
  const { login, isLoading, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch {
      // authError is already surfaced via context state.
    }
  }

  return (
    <div className="bz-panel bz-panel--auth">
      <p className="bz-eyebrow">BlastZone</p>
      <h1 className="bz-panel__title">Log in</h1>

      <form className="bz-form" onSubmit={handleSubmit}>
        <TextInput label="Username" value={username} onChange={setUsername} autoComplete="username" required />
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        {authError && <p className="bz-error">{authError}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="bz-switch">
        Need an account?{' '}
        <button type="button" className="bz-link" onClick={onSwitchToRegister}>
          Register
        </button>
      </p>
    </div>
  );
}

export default LoginPage;
