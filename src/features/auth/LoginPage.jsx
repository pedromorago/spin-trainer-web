import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../shared/auth/useAuth';
import { theme } from '../../shared/theme/theme';
import { layout } from '../../shared/ui/styles';

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  if (user) {
    const from = location.state?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/'} replace />;
  }

  const submit = async e => {
    e.preventDefault();
    setError(null); setInfo(null); setSubmitting(true);
    const { error } = await (mode === 'signin' ? signIn : signUp)(email, password);
    setSubmitting(false);
    if (error) setError(error.message);
    else if (mode === 'signup') setInfo('Cuenta creada. Revisa tu email para confirmarla.');
  };

  const box = { maxWidth: 360, margin: '10vh auto', padding: theme.space.xl, background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, display: 'flex', flexDirection: 'column', gap: theme.space.md };
  const field = { display: 'flex', flexDirection: 'column', gap: theme.space.xs, fontSize: theme.font.sizeSm, color: theme.colors.textMuted };
  const input = { padding: theme.space.sm, background: theme.colors.bg, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm };
  const title = mode === 'signin' ? 'Entrar' : 'Crear cuenta';

  return (
    <form style={box} onSubmit={submit} aria-label={title}>
      <h1 style={{ margin: 0, fontSize: theme.font.sizeLg }}>Spin Trainer</h1>
      <label style={field}>
        Email
        <input style={input} type="email" autoComplete="email" required value={email}
          onChange={e => setEmail(e.target.value)} data-testid="login-email" />
      </label>
      <label style={field}>
        Contraseña
        <input style={input} type="password" autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} required
          minLength={6} value={password} onChange={e => setPassword(e.target.value)} data-testid="login-password" />
      </label>
      <div role="status" aria-live="polite">
        {error && <small style={{ color: theme.colors.danger }} data-testid="login-error">{error}</small>}
        {info && <small style={{ color: theme.colors.success }} data-testid="login-info">{info}</small>}
      </div>
      <button type="submit" style={layout.primary} disabled={submitting} data-testid="login-submit">{title}</button>
      <button type="button" style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer' }}
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} data-testid="login-toggle-mode">
        {mode === 'signin' ? '¿No tienes cuenta? Crear una' : 'Ya tengo cuenta'}
      </button>
    </form>
  );
}
