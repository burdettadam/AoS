import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext.tsx';
import { Suspense, lazy, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import { logger } from './utils/logger.ts';

const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const GamePage = lazy(() => import('./pages/GamePage.tsx'));
const LobbyPage = lazy(() => import('./pages/LobbyPage.tsx'));
const JoinPage = lazy(() => import('./pages/JoinPage.tsx'));
const RoleRevealPage = lazy(() => import('./pages/RoleRevealPage.tsx'));
const SetupPage = lazy(() => import('./pages/SetupPage.tsx'));
import Navigation from './components/Navigation.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function App() {
  useEffect(() => {
    logger.info('Application started', { 
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href 
    });
  }, []);

  return (
    <ErrorBoundary onError={(error, errorInfo) => {
      logger.error('React Error Boundary caught error', { errorInfo }, error);
    }}>
      <GameProvider>
        <div className="min-h-screen bg-gray-900 text-white">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            <ErrorBoundary fallback={
              <div className="text-center py-12">
                <p className="text-red-400">Failed to load page content</p>
              </div>
            }>
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/join" element={<JoinPage />} />
                  <Route 
                    path="/lobby/:gameId" 
                    element={
                      <ProtectedRoute>
                        <LobbyPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/setup/:gameId" 
                    element={
                      <ProtectedRoute>
                        <SetupPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/game/:gameId" 
                    element={
                      <ProtectedRoute>
                        <GamePage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reveal/:gameId" 
                    element={
                      <ProtectedRoute>
                        <RoleRevealPage />
                      </ProtectedRoute>
                    } 
                  />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;
