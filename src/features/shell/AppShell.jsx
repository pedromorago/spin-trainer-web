import { Outlet } from 'react-router';
import { useSituations, useSlowRequests } from '../../shared/api/queries';
import { useAuth } from '../../shared/auth/useAuth';
import { useSession } from '../../shared/session/useSession';
import { useSituationSelection } from '../../shared/ui/useSituationSelection';
import { Layout } from '../../shared/ui/Layout';
import { SituationBar } from '../../shared/ui/SituationBar';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { ServerWakeNotice } from '../../shared/ui/ServerWakeNotice';

/**
 * Common frame of the tabs: header with the session scoreboard and a single situation/stack selector.
 * Pages receive { situations, selection } via useOutletContext(); none has its own selector.
 */
export function AppShell() {
  const { user, signOut } = useAuth();
  const { session, accuracy } = useSession();
  const situations = useSituations();
  const selection = useSituationSelection(situations.data);
  const waking = useSlowRequests();

  const content = situations.isLoading ? <Loading />
    : situations.error ? <ErrorBox error={situations.error} />
      : situations.data.length === 0 ? <Empty>No hay situaciones disponibles.</Empty>
        : <Outlet context={{ situations: situations.data, selection }} />;

  return (
    <Layout user={user} onSignOut={signOut} score={{ accuracy, streak: session.streak, total: session.total }}
      toolbar={situations.data?.length ? <SituationBar situations={situations.data} selection={selection} /> : null}>
      <ServerWakeNotice visible={waking} />
      {content}
    </Layout>
  );
}
