import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import LeaderboardPage from "./pages/Leaderboard";
import About from "./pages/About";
import MultiplayerLobby from "./pages/MultiplayerLobby";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import WaitingRoom from "./pages/WaitingRoom";
import MultiplayerGame from "./pages/MultiplayerGame";
import MatchResults from "./pages/MatchResults";
import { MultiplayerProvider } from "./context/MultiplayerContext";
import "./index.css";

function App() {
  return (
    <MultiplayerProvider>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/about" element={<About />} />
            <Route path="/multiplayer" element={<MultiplayerLobby />} />
            <Route path="/create-room" element={<CreateRoom />} />
            <Route path="/join-room" element={<JoinRoom />} />
            <Route path="/room/:roomId" element={<WaitingRoom />} />
            <Route path="/game/:roomId" element={<MultiplayerGame />} />
            <Route path="/results/:roomId" element={<MatchResults />} />
          </Routes>
        </main>
      </div>
    </MultiplayerProvider>
  );
}

export default App;