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
      <Link to="/" style={link}>← Volver a Spin Trainer</Link>
      <h1 id="privacy-title" style={{ ...h1, marginTop: theme.space.lg }}>Privacidad</h1>
      <p style={muted}>Última actualización: 27 de septiembre de 2026</p>
      <p>
        Spin Trainer es un proyecto personal y gratuito para entrenar rangos preflop de Spin &amp; Go. Aquí se explica qué
        datos guarda, para qué y cómo puedes pedir que se borren. Está pensado para mayores de edad.
      </p>

      <h2 style={h2}>Responsable</h2>
      <p>Pedro Morago López-Vázquez · <a href={`mailto:${CONTACT}`} style={link}>{CONTACT}</a></p>

      <h2 style={h2}>Qué datos se guardan</h2>
      <ul>
        <li>
          <strong>Tu cuenta:</strong> el email con el que entras. Al entrar con Google, Google comparte también tu nombre y
          tu foto de perfil; se guardan con la cuenta, pero Spin Trainer solo usa el email.
        </li>
        <li>
          <strong>Tu entrenamiento:</strong> los rangos que personalizas y cada respuesta del Quiz (situación, stack, mano,
          acción elegida, si era correcta y cuándo). Con eso se calculan tus estadísticas.
        </li>
        <li>
          No hay analítica, publicidad ni cookies de seguimiento. El navegador guarda tu sesión solo para mantenerte
          conectado.
        </li>
      </ul>

      <h2 style={h2}>Para qué</h2>
      <p>
        Solo para darte el servicio que pides: entrenar y ver tu progreso (art. 6.1.b del RGPD). Los datos no se venden,
        no se ceden a nadie y no se usan para nada más.
      </p>

      <h2 style={h2}>Quién los trata y dónde</h2>
      <ul>
        <li><strong>Supabase</strong> (acceso y base de datos), en la Unión Europea (Fráncfort).</li>
        <li><strong>Render</strong> (el servidor de la aplicación), en Fráncfort.</li>
        <li>
          <strong>Vercel</strong> sirve la web y <strong>Cloudflare</strong> resuelve el dominio: no guardan tu
          entrenamiento, aunque, como cualquier servidor web, registran datos técnicos de las visitas (IP, navegador).
        </li>
        <li><strong>Google</strong>, solo para identificarte cuando entras con Google.</li>
      </ul>
      <p>
        Vercel, Cloudflare y Google son empresas estadounidenses: cuando intervienen, se aplican sus garantías para
        transferencias internacionales (el Marco de Privacidad de Datos UE-EE. UU. o cláusulas contractuales tipo).
      </p>

      <h2 style={h2}>Cuánto tiempo</h2>
      <p>Mientras tengas la cuenta. Al borrarla se eliminan la cuenta, tus rangos y todas tus respuestas.</p>

      <h2 style={h2}>Tus derechos</h2>
      <p>
        Puedes pedir el acceso a tus datos, corregirlos, llevártelos, oponerte a su uso o borrar tu cuenta con todo lo que
        contiene escribiendo a <a href={`mailto:${CONTACT}`} style={link}>{CONTACT}</a>. Respondo en menos de un mes. Si
        crees que no se han respetado tus derechos, puedes reclamar ante la{' '}
        <a href="https://www.aepd.es" style={link} rel="noopener noreferrer" target="_blank">Agencia Española de Protección de Datos</a>.
      </p>
    </main>
  );
}
