import { useState } from 'react';
import { useAuth } from '../auth/useAuth';
import TextInput from '../components/TextInput';
import Button from '../components/Button';

function RegisterPage({ onSwitchToLogin }) {
  const { register, isLoading, authError } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register({ username, email, password });
    } catch {
      // authError is already surfaced via context state.
    }
  }

  return (
    <div className="bz-panel bz-panel--auth">
      <p className="bz-eyebrow">BlastZone</p>
      <h1 className="bz-panel__title">Create an account</h1>

      <form className="bz-form" onSubmit={handleSubmit}>
        <TextInput label="Username" value={username} onChange={setUsername} autoComplete="username" required />
        <TextInput label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <TextInput
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
        />

        {authError && <p className="bz-error">{authError}</p>}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Register'}
        </Button>
      </form>

      <p className="bz-switch">
        Already have an account?{' '}
        <button type="button" className="bz-link" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </div>
  );
}

export default RegisterPage;
