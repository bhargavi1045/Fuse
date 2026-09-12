function ConnectionBadge({ connected }) {
  return (
    <span className={`bz-badge ${connected ? 'bz-badge--online' : 'bz-badge--offline'}`}>
      <span className="bz-badge__dot" />
      {connected ? 'connected' : 'reconnecting…'}
    </span>
  );
}

export default ConnectionBadge;
