import React, { useState, useEffect, useRef } from "react";
import "./RoomChat.css";

const RoomChat = ({ chatMessages = [], onSendMessage, myUserId }) => {
  const [msgInput, setMsgInput] = useState("");
  const listEndRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!msgInput.trim()) return;
    onSendMessage(msgInput);
    setMsgInput("");
  };

  // Keep list scrolled to bottom on new message
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return (
    <div className="rt-room-chat card">
      <div className="chat-header">
        <span className="chat-title">💬 ROOM CHAT</span>
      </div>

      <div className="chat-messages-list">
        {chatMessages.map((msg, idx) => {
          const isMe = msg.user_id === myUserId;
          const timeStr = msg.timestamp
            ? new Date(msg.timestamp * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          return (
            <div key={idx} className={`chat-message-row ${isMe ? "msg-me" : ""}`}>
              <div className="msg-meta">
                <span className="msg-username" style={{ color: isMe ? "var(--green)" : "var(--cyan)" }}>
                  {msg.username}
                </span>
                <span className="msg-time">{timeStr}</span>
              </div>
              <p className="msg-content">{msg.message}</p>
            </div>
          );
        })}
        {chatMessages.length === 0 && (
          <div className="chat-empty">Send a message to start chatting!</div>
        )}
        <div ref={listEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          className="chat-input-field"
          placeholder="Type a message..."
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          maxLength={150}
        />
        <button type="submit" className="btn btn-primary chat-send-btn">
          SEND
        </button>
      </form>
    </div>
  );
};

export default RoomChat;
