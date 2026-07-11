class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.roomCode = null;
  }

  connect(roomCode) {
    const token = localStorage.getItem("rt_token");
    if (!token) return;

    this.roomCode = roomCode;
    // Connect to backend WS endpoint, passing JWT token as query parameter
    this.ws = new WebSocket(`ws://localhost:8000/ws/room/${roomCode}?token=${token}`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._emit("connected", {});
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._emit(msg.event, msg.data);
      } catch (e) {
        console.error("WebSocket message parse error:", e);
      }
    };

    this.ws.onclose = (event) => {
      this._emit("disconnected", { code: event.code, reason: event.reason });
      // Reconnect automatically unless connection was closed cleanly (code 1000)
      if (event.code !== 1000 && event.code < 4000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(this.roomCode), 1000 * this.reconnectAttempts);
      }
    };

    this.ws.onerror = (error) => {
      this._emit("error", error);
    };
  }

  disconnect() {
    this.maxReconnectAttempts = 0; // prevent reconnect loop
    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }
    this.listeners = {};
    this.roomCode = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  send(event, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data }));
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    // Return off-subscription function
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  off(event) {
    delete this.listeners[event];
  }

  _emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }
}

export const wsService = new WebSocketService();
