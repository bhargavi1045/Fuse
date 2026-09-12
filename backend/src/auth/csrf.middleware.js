const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function requireTrustedOrigin(allowedOrigins) {
  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();

    const origin = req.get('Origin');
    if (origin && allowedOrigins.includes(origin)) return next();

    const referer = req.get('Referer');
    if (referer && allowedOrigins.some((allowed) => referer.startsWith(`${allowed}/`))) {
      return next();
    }

    if (!origin && !referer && process.env.NODE_ENV !== 'production') return next();

    return res.status(403).json({ error: 'Untrusted request origin' });
  };
}

module.exports = { requireTrustedOrigin };