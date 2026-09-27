import { Link } from 'react-router';
import { theme } from '../../shared/theme/theme';

const CONTACT = 'pedromoragolv@gmail.com';

/**
 * Privacy notice (GDPR arts. 13-14), public: it is linked from the login, before any account exists (ADR-0019).
 * It must match what the system actually stores; change both together.
 */
export function PrivacyPage() {
  const page = { maxWidth: 720, margin: '0 auto', padding: `${theme.space.xl} ${theme.space.lg}`, lineHeight: 1.6,
    color: theme.colors.text };
  const h1 = { margin: 0, fontFamily: theme.font.display, fontWeight: 400, fontSize: 40, letterSpacing: 2, color: theme.colors.accent };
  const h2 = { margin: `${theme.space.xl} 0 ${theme.space.sm}`, fontSize: theme.font.sizeLg, fontWeight: 600 };
  const link = { color: theme.colors.accent };
  const muted = { color: theme.colors.textMuted, fontSize: theme.font.sizeSm };

  return (
    <main style={page} aria-labelledby="privacy-title">
      <Link to="/" style={link}>← Back to Spin Trainer</Link>
      <h1 id="privacy-title" style={{ ...h1, marginTop: theme.space.lg }}>Privacy</h1>
      <p style={muted}>Last updated: 27 September 2026</p>
      <p>
        Spin Trainer is a free personal project for training Spin &amp; Go preflop ranges. This page explains what data it
        keeps, what for, and how to have it deleted. It is meant for adults.
      </p>

      <h2 style={h2}>Controller</h2>
      <p>Pedro Morago López-Vázquez · <a href={`mailto:${CONTACT}`} style={link}>{CONTACT}</a></p>

      <h2 style={h2}>What data is kept</h2>
      <ul>
        <li>
          <strong>Your account:</strong> the email you sign in with. When you sign in with Google, Google also shares
          your name and profile picture; they are stored with the account, but Spin Trainer only uses the email.
        </li>
        <li>
          <strong>Your training:</strong> the ranges you customize and every Quiz answer (situation, stack, hand, the
          action you chose, whether it was right, and when). Your stats are computed from them.
        </li>
        <li>
          No analytics, no advertising and no tracking cookies. Your browser keeps your session only to keep you signed in.
        </li>
      </ul>

      <h2 style={h2}>What for</h2>
      <p>
        Only to provide the service you ask for: training and seeing your progress (GDPR art. 6.1.b). The data is not
        sold, not shared with anyone and not used for anything else.
      </p>

      <h2 style={h2}>Who processes it, and where</h2>
      <ul>
        <li><strong>Supabase</strong> (sign-in and database), in the European Union (Frankfurt).</li>
        <li><strong>Render</strong> (the application server), in Frankfurt.</li>
        <li>
          <strong>Vercel</strong> serves the website and <strong>Cloudflare</strong> resolves the domain: they do not
          keep your training, although, like any web server, they log technical data about visits (IP, browser).
        </li>
        <li><strong>Google</strong>, only to identify you when you sign in with Google.</li>
      </ul>
      <p>
        Vercel, Cloudflare and Google are US companies: when they take part, their safeguards for international
        transfers apply (the EU-US Data Privacy Framework or standard contractual clauses).
      </p>

      <h2 style={h2}>How long</h2>
      <p>As long as you have the account. Deleting it removes the account, your ranges and all your answers.</p>

      <h2 style={h2}>Your rights</h2>
      <p>
        You can ask for access to your data, correct it, take it with you, object to its use or delete your account with
        everything in it by writing to <a href={`mailto:${CONTACT}`} style={link}>{CONTACT}</a>. You will get an answer
        within a month. If you think your rights have not been respected, you can complain to the{' '}
        <a href="https://www.aepd.es/en" style={link} rel="noopener noreferrer" target="_blank">Spanish Data Protection Agency (AEPD)</a>.
      </p>
    </main>
  );
}
