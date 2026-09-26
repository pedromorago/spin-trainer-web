import { useState } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '../../shared/auth/useAuth';
import { theme } from '../../shared/theme/theme';
import { layout } from '../../shared/ui/styles';

export function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin');
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  if (user) return <Navigate to="/" replace />;

  const submit = async () => {
    setError(null); setInfo(null);
    const { error } = await (mode === 'signin' ? signIn : signUp)(email, password);
    if (error) setError(error.message);
    else if (mode === 'signup') setInfo('Cuenta creada. Revisa tu email para confirmarla.');
  };

  const box = { maxWidth: 360, margin: '10vh auto', padding: theme.space.xl, background: theme.colors.bgElevated,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, display: 'flex', flexDirection: 'column', gap: theme.space.md };
  const input = { padding: theme.space.sm, background: theme.colors.bg, color: theme.colors.text,
    border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm };

  return (
    <div style={box}>
      <h1 style={{ margin: 0, fontSize: theme.font.sizeLg }}>Spin Trainer</h1>
      <input style={input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} data-testid="login-email" />
      <input style={input} type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} data-testid="login-password" />
      {error && <small style={{ color: theme.colors.danger }} data-testid="login-error">{error}</small>}
      {info && <small style={{ color: theme.colors.success }}>{info}</small>}
      <button style={layout.primary} onClick={submit} data-testid="login-submit">{mode === 'signin' ? 'Entrar' : 'Crear cuenta'}</button>
      <button style={{ background: 'none', border: 'none', color: theme.colors.textMuted, cursor: 'pointer' }}
        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? '¿No tienes cuenta? Crear una' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}
