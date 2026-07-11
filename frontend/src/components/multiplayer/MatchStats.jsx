import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "./MatchStats.css";

const MatchStats = ({ leaderboard = [] }) => {
  // Sort players by WPM (descending) for the charts
  const chartData = [...leaderboard]
    .sort((a, b) => b.wpm - a.wpm)
    .map((p) => ({
      name: p.username,
      WPM: p.wpm,
      Accuracy: Math.round(p.accuracy),
      color: p.color,
    }));

  return (
    <div className="rt-match-stats fade-in">
      <div className="card stats-table-card">
        <span className="stats-card-title">📝 DETAILED STANDINGS</span>
        <table className="stats-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>PLAYER</th>
              <th>WPM</th>
              <th>ACCURACY</th>
              <th>ERRORS</th>
              <th>WORDS (OK/ERR)</th>
              <th>TIME TAKEN</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry) => (
              <tr key={entry.user_id} className={entry.finished ? "row-finished" : "row-dns"}>
                <td className="cell-rank">#{entry.rank}</td>
                <td className="cell-username">
                  <span className="player-indicator-dot" style={{ backgroundColor: entry.color }} />
                  {entry.username}
                </td>
                <td className="cell-stat wpm-val">{entry.wpm}</td>
                <td className="cell-stat">{Math.round(entry.accuracy)}%</td>
                <td className="cell-stat mistakes-val">{entry.mistakes}</td>
                <td className="cell-stat">
                  {entry.correct_words} / {entry.incorrect_words}
                </td>
                <td className="cell-stat">{entry.time_taken.toFixed(1)}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {chartData.length > 0 && (
        <div className="charts-grid">
          {/* WPM Bar Chart */}
          <div className="card chart-card">
            <span className="chart-card-title">📊 WORDS PER MINUTE (WPM)</span>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border)",
                      borderRadius: "5px",
                    }}
                  />
                  <Bar dataKey="WPM" fill="var(--green)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy Bar Chart */}
          <div className="card chart-card">
            <span className="chart-card-title">🎯 ACCURACY (%)</span>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={11} />
                  <YAxis stroke="var(--text-dim)" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-deep)",
                      border: "1px solid var(--border)",
                      borderRadius: "5px",
                    }}
                  />
                  <Bar dataKey="Accuracy" fill="var(--cyan)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchStats;
