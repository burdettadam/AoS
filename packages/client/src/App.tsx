import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext.tsx';
import HomePage from './pages/HomePage.tsx';
import GamePage from './pages/GamePage.tsx';
import LobbyPage from './pages/LobbyPage.tsx';
import Navigation from './components/Navigation.tsx';

function App() {
  return (
    <GameProvider>
      <div className="min-h-screen bg-clocktower-darker">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/lobby/:gameId" element={<LobbyPage />} />
            <Route path="/game/:gameId" element={<GamePage />} />
          </Routes>
        </main>
      </div>
    </GameProvider>
  );
}

export default App;
