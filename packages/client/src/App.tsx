import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext.tsx';
import { Suspense, lazy } from 'react';
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const GamePage = lazy(() => import('./pages/GamePage.tsx'));
const LobbyPage = lazy(() => import('./pages/LobbyPage.tsx'));
const JoinPage = lazy(() => import('./pages/JoinPage.tsx'));
const RoleRevealPage = lazy(() => import('./pages/RoleRevealPage.tsx'));
const SetupPage = lazy(() => import('./pages/SetupPage.tsx'));
import Navigation from './components/Navigation.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function App() {
  return (
    <ProtectedRoute>
      <GameProvider>
        <div className="min-h-screen bg-clocktower-darker">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <Suspense fallback={<div className="card p-8">Loading...</div>}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/lobby/:gameId" element={<LobbyPage />} />
                <Route path="/join/:gameId" element={<JoinPage />} />
                <Route path="/setup/:gameId" element={<SetupPage />} />
                <Route path="/reveal/:gameId" element={<RoleRevealPage />} />
                <Route path="/game/:gameId" element={<GamePage />} />
                <Route path="/about" element={<div className="card p-8">About BotC Digital</div>} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </GameProvider>
    </ProtectedRoute>
  );
}

export default App;
