import React from "react";
import "./PodiumDisplay.css";

const PodiumDisplay = ({ leaderboard = [] }) => {
  // Grab top 3
  const first = leaderboard.find((p) => p.rank === 1);
  const second = leaderboard.find((p) => p.rank === 2);
  const third = leaderboard.find((p) => p.rank === 3);

  return (
    <div className="rt-podium-display fade-in">
      {/* 2nd Place */}
      <div className="podium-pillar-wrapper second-place">
        {second ? (
          <div className="podium-player-card">
            <div className="podium-avatar" style={{ borderColor: second.color }}>
              {second.username[0].toUpperCase()}
            </div>
            <span className="podium-username">{second.username}</span>
            <span className="podium-stat">{second.wpm} WPM</span>
          </div>
        ) : (
          <div className="podium-player-card empty">
            <span>-</span>
          </div>
        )}
        <div className="podium-pillar">
          <span className="pillar-number">2</span>
        </div>
      </div>

      {/* 1st Place */}
      <div className="podium-pillar-wrapper first-place">
        {first ? (
          <div className="podium-player-card winner">
            <span className="crown-emoji">👑</span>
            <div className="podium-avatar winner-avatar" style={{ borderColor: first.color, boxShadow: `0 0 15px ${first.color}` }}>
              {first.username[0].toUpperCase()}
            </div>
            <span className="podium-username">{first.username}</span>
            <span className="podium-stat">{first.wpm} WPM</span>
          </div>
        ) : (
          <div className="podium-player-card empty">
            <span>-</span>
          </div>
        )}
        <div className="podium-pillar">
          <span className="pillar-number">1</span>
        </div>
      </div>

      {/* 3rd Place */}
      <div className="podium-pillar-wrapper third-place">
        {third ? (
          <div className="podium-player-card">
            <div className="podium-avatar" style={{ borderColor: third.color }}>
              {third.username[0].toUpperCase()}
            </div>
            <span className="podium-username">{third.username}</span>
            <span className="podium-stat">{third.wpm} WPM</span>
          </div>
        ) : (
          <div className="podium-player-card empty">
            <span>-</span>
          </div>
        )}
        <div className="podium-pillar">
          <span className="pillar-number">3</span>
        </div>
      </div>
    </div>
  );
};

export default PodiumDisplay;
