import React from "react";
import "./LiveLeaderboard.css";

const LiveLeaderboard = ({ leaderboard = [], myUserId }) => {
  return (
    <div className="rt-live-leaderboard card fade-in">
      <div className="leaderboard-header">
        <span className="leaderboard-title">🏆 LIVE LEADERBOARD</span>
      </div>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="col-rank">RANK</th>
            <th className="col-player">PLAYER</th>
            <th className="col-wpm">WPM</th>
            <th className="col-acc">ACC</th>
            <th className="col-progress">PROGRESS</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((player) => {
            const isMe = player.user_id === myUserId;
            let rankSymbol = `#${player.rank}`;
            if (player.rank === 1) rankSymbol = "🥇";
            else if (player.rank === 2) rankSymbol = "🥈";
            else if (player.rank === 3) rankSymbol = "🥉";

            return (
              <tr
                key={player.user_id}
                className={`${isMe ? "row-me" : ""} ${player.finished ? "row-finished" : ""}`}
                style={{ "--player-color": player.color }}
              >
                <td className="cell-rank">{rankSymbol}</td>
                <td className="cell-player">
                  <span className="player-indicator-dot" style={{ backgroundColor: player.color }} />
                  <span className="player-name">
                    {player.username}
                    {isMe && <span className="you-text"> (YOU)</span>}
                  </span>
                </td>
                <td className="cell-wpm">{player.wpm}</td>
                <td className="cell-acc">{Math.round(player.accuracy)}%</td>
                <td className="cell-progress">
                  <div className="progress-cell-container">
                    <span className="progress-value">{Math.round(player.progress)}%</span>
                    {player.finished && <span className="done-check">✓</span>}
                  </div>
                </td>
              </tr>
            );
          })}
          {leaderboard.length === 0 && (
            <tr>
              <td colSpan="5" className="leaderboard-empty">
                No active player data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LiveLeaderboard;
