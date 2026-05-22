import { useState, useEffect } from "react";
import { getLeaderboard } from "../services/api";
import "./Leaderboard.css";

const LeaderboardPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="lb-page fade-in">
      <div className="lb-header">
        <h1 className="lb-title">Leaderboard</h1>
        <p className="lb-subtitle">Top typists ranked by best WPM</p>
      </div>

      <div className="lb-card card">
        {loading ? (
          <p className="lb-empty">Loading...</p>
        ) : entries.length === 0 ? (
          <p className="lb-empty">No entries yet. Be the first!</p>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User</th>
                <th>Best WPM</th>
                <th>Avg Accuracy</th>
                <th>Tests</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.username} className={i < 3 ? `top-${i + 1}` : ""}>
                  <td className="td-rank">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : e.rank}
                  </td>
                  <td className="td-user">
                    <span className="lb-avatar">{e.username[0].toUpperCase()}</span>
                    {e.username}
                  </td>
                  <td className="td-wpm">{e.best_wpm}</td>
                  <td>{e.accuracy}%</td>
                  <td>{e.tests_taken}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;
