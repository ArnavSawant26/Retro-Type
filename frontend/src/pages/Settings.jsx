import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAppearance } from "../context/appearanceState";
import { getMyResults } from "../services/api";
import "./Settings.css";

const THEMES = [
  { value: "retro-green", label: "Retro Green CRT", color: "#39ff14" },
  { value: "amber", label: "Amber CRT", color: "#ffb627" },
  { value: "blue", label: "Blue Terminal", color: "#00b7ff" },
  { value: "dark", label: "Dark", color: "#b8c0cc" },
  { value: "light", label: "Light", color: "#087f23" },
];

const FONTS = [
  { value: "jetbrains", label: "JetBrains Mono" },
  { value: "fira", label: "Fira Code" },
  { value: "cascadia", label: "Cascadia Code" },
  { value: "ibm", label: "IBM Plex Mono" },
];

const CURSORS = [
  { value: "block", label: "Block" },
  { value: "line", label: "Line" },
  { value: "underline", label: "Underline" },
];

const EFFECTS = [
  { value: "scanlines", label: "Scanlines" },
  { value: "flicker", label: "Screen Flicker" },
  { value: "glow", label: "Glow" },
  { value: "noise", label: "Noise" },
  { value: "vignette", label: "Vignette" },
];

const Settings = () => {
  const { user, logout } = useAuth();
  const { appearance, updateAppearance, updateEffect, resetAppearance } = useAppearance();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }
    getMyResults()
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, navigate]);

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
      <section className="appearance-card card">
        <div className="settings-heading-row">
          <div>
            <span className="settings-kicker">Appearance</span>
            <h1 className="settings-heading">Terminal display</h1>
            <p className="settings-description">Changes apply instantly and are saved on this device.</p>
          </div>
          <button className="settings-reset" type="button" onClick={resetAppearance}>Reset to defaults</button>
        </div>

        <div className="appearance-section">
          <div className="appearance-label">Theme</div>
          <div className="theme-grid">
            {THEMES.map((theme) => (
              <button
                type="button"
                key={theme.value}
                className={`theme-option ${appearance.theme === theme.value ? "active" : ""}`}
                onClick={() => updateAppearance("theme", theme.value)}
                aria-pressed={appearance.theme === theme.value}
              >
                <span className="theme-swatch" style={{ "--swatch": theme.color }} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        <div className="appearance-grid">
          <label className="appearance-field">
            <span className="appearance-label">Font</span>
            <select
              value={appearance.font}
              onChange={(event) => updateAppearance("font", event.target.value)}
            >
              {FONTS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
            </select>
          </label>

          <div className="appearance-field">
            <div className="range-heading">
              <span className="appearance-label">Font Size</span>
              <output>{appearance.fontSize}px</output>
            </div>
            <input
              type="range"
              min="12"
              max="28"
              value={appearance.fontSize}
              onChange={(event) => updateAppearance("fontSize", Number(event.target.value))}
              aria-label="Typing font size"
            />
            <div className="range-limits"><span>12px</span><span>28px</span></div>
          </div>
        </div>

        <div className="appearance-section">
          <div className="appearance-label">Cursor Style</div>
          <div className="segmented-control">
            {CURSORS.map((cursor) => (
              <button
                type="button"
                key={cursor.value}
                className={appearance.cursorStyle === cursor.value ? "active" : ""}
                onClick={() => updateAppearance("cursorStyle", cursor.value)}
                aria-pressed={appearance.cursorStyle === cursor.value}
              >
                {cursor.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toggle-row single-toggle">
          <div><span className="toggle-title">Cursor Blink</span><span className="toggle-copy">Animate the typing cursor</span></div>
          <button
            type="button"
            className={`switch ${appearance.cursorBlink ? "on" : ""}`}
            onClick={() => updateAppearance("cursorBlink", !appearance.cursorBlink)}
            role="switch"
            aria-checked={appearance.cursorBlink}
            aria-label="Cursor blink"
          ><span /></button>
        </div>

        <div className="appearance-section effects-section">
          <div className="appearance-label">CRT Effects</div>
          <div className="effects-grid">
            {EFFECTS.map((effect) => (
              <div className="toggle-row" key={effect.value}>
                <span className="toggle-title">{effect.label}</span>
                <button
                  type="button"
                  className={`switch ${appearance.effects[effect.value] ? "on" : ""}`}
                  onClick={() => updateEffect(effect.value, !appearance.effects[effect.value])}
                  role="switch"
                  aria-checked={appearance.effects[effect.value]}
                  aria-label={effect.label}
                ><span /></button>
              </div>
            ))}
          </div>
          <p className="performance-note">Disable CRT effects for better performance on lower-powered devices.</p>
        </div>
      </section>

      {user && <>
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
      </>}
    </div>
  );
};

export default Settings;
