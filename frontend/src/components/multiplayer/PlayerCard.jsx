import React from "react";
import "./PlayerCard.css";

const PlayerCard = ({ player, isMe, onKick, showKick }) => {
  const avatarLetter = player.username ? player.username[0].toUpperCase() : "?";

  return (
    <div className={`rt-player-card ${isMe ? "is-me" : ""}`} style={{ "--player-color": player.color }}>
      <div className="player-avatar" style={{ backgroundColor: player.color }}>
        {avatarLetter}
      </div>

      <div className="player-details">
        <span className="player-username">
          {player.username}
          {isMe && <span className="me-badge"> (YOU)</span>}
        </span>
        <div className="player-badges">
          {player.is_host && <span className="host-badge">👑 HOST</span>}
          {player.is_ready ? (
            <span className="ready-badge ready">✓ READY</span>
          ) : (
            <span className="ready-badge not-ready">⏱ WAITING</span>
          )}
        </div>
      </div>

      {showKick && !player.is_host && (
        <button className="kick-button" onClick={() => onKick(player.user_id)}>
          KICK
        </button>
      )}
    </div>
  );
};

export default PlayerCard;
