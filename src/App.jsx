import { Navigate, Route, Routes } from 'react-router';
import { RequireAuth } from './shared/auth/RequireAuth';
import { Layout } from './shared/ui/Layout';
import { LoginPage } from './features/auth/LoginPage';
import { ExplorerPage } from './features/explorer/ExplorerPage';
import { QuizPage } from './features/quiz/QuizPage';
import { BuilderPage } from './features/builder/BuilderPage';
import { StatsPage } from './features/stats/StatsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth><Layout /></RequireAuth>}>
        <Route index element={<Navigate to="/explorer" replace />} />
        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/builder" element={<BuilderPage />} />
        <Route path="/stats" element={<StatsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
