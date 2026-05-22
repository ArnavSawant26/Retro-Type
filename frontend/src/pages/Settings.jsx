import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyResults } from "../services/api";
import "./Settings.css";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    getMyResults()
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

  if (!user) return null;

  const bestWpm = results.length ? Math.max(...results.map((r) => r.wpm)) : 0;
  const avgWpm = results.length
    ? Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length)
    : 0;
  const avgAcc = results.length
    ? Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length)
    : 0;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="settings-page fade-in">
      {/* Profile Card */}
      <div className="profile-card card">
        <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h2 className="profile-name">{user.username}</h2>
          <p className="profile-email">{user.email}</p>
          <p className="profile-joined">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>
        <button className="btn btn-danger" onClick={handleLogout}>LOGOUT</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card card">
          <span className="stat-card-val">{results.length}</span>
          <span className="stat-card-label">Tests Taken</span>
        </div>
        <div className="stat-card card highlight">
          <span className="stat-card-val">{bestWpm}</span>
          <span className="stat-card-label">Best WPM</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card-val">{avgWpm}</span>
          <span className="stat-card-label">Avg WPM</span>
        </div>
        <div className="stat-card card">
          <span className="stat-card-val">{avgAcc}%</span>
          <span className="stat-card-label">Avg Accuracy</span>
        </div>
      </div>

      {/* History Table */}
      <div className="history-section card">
        <h3 className="history-title">Test History</h3>
        {loading ? (
          <p className="history-empty">Loading...</p>
        ) : results.length === 0 ? (
          <p className="history-empty">No tests yet. Go take one!</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>WPM</th>
                  <th>Accuracy</th>
                  <th>Mode</th>
                  <th>Word List</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="td-wpm">{r.wpm}</td>
                    <td>{r.accuracy}%</td>
                    <td>{r.mode === "time" ? `${r.mode_value}s` : `${r.mode_value} words`}</td>
                    <td>{r.word_list}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
