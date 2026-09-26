import { Outlet } from 'react-router';
import { useSituations } from '../../shared/api/queries';
import { useAuth } from '../../shared/auth/useAuth';
import { useSession } from '../../shared/session/useSession';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { Layout } from '../../shared/ui/Layout';
import { SituationBar } from '../../shared/ui/SituationBar';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';

/**
 * Marco común de las pestañas: cabecera con el marcador de sesión y un único selector de situación/stack.
 * Las páginas reciben { situations, selection } vía useOutletContext(); ninguna tiene selector propio.
 */
export function AppShell() {
  const { user, signOut } = useAuth();
  const { session, accuracy } = useSession();
  const situations = useSituations();
  const selection = useSituationSelection(situations.data);

  const content = situations.isLoading ? <Loading />
    : situations.error ? <ErrorBox error={situations.error} />
      : situations.data.length === 0 ? <Empty>No hay situaciones disponibles.</Empty>
        : <Outlet context={{ situations: situations.data, selection }} />;

  return (
    <Layout user={user} onSignOut={signOut} score={{ accuracy, streak: session.streak, total: session.total }}
      toolbar={situations.data?.length ? <SituationBar situations={situations.data} selection={selection} /> : null}>
      {content}
    </Layout>
  );
}
