import "./About.css";

const About = () => {
  return (
    <div className="about-page fade-in">
      <div className="about-hero">
        <h1 className="about-title">
          RETRO<span className="accent">TYPE</span>
        </h1>
        <p className="about-tagline">
          A retro-themed typing speed test inspired by the golden age of terminals
        </p>
      </div>

      <div className="about-grid">
        {/* How it works */}
        <div className="about-card card">
          <h2 className="about-card-title">⌨️ How It Works</h2>
          <ul className="about-list">
            <li>Choose a word list, word count, or time mode</li>
            <li>Start typing — the timer begins on your first keystroke</li>
            <li>Complete all words (word mode) or type until time runs out</li>
            <li>View your WPM, accuracy, and WPM-over-time graph</li>
            <li>Log in to save results and compete on the leaderboard</li>
          </ul>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="about-card card">
          <h2 className="about-card-title">⚡ Keyboard Shortcuts</h2>
          <div className="shortcut-grid">
            <div className="shortcut">
              <kbd>TAB</kbd>
              <span>Restart test</span>
            </div>
            <div className="shortcut">
              <kbd>SPACE</kbd>
              <span>Next word</span>
            </div>
            <div className="shortcut">
              <kbd>BACKSPACE</kbd>
              <span>Delete character</span>
            </div>
          </div>
        </div>

        {/* Test Modes */}
        <div className="about-card card">
          <h2 className="about-card-title">🎯 Test Modes</h2>
          <div className="modes-info">
            <div className="mode-info-item">
              <strong>Word Mode</strong>
              <span>Type 10, 25, or 50 words as fast as you can</span>
            </div>
            <div className="mode-info-item">
              <strong>Time Mode</strong>
              <span>Type for 15, 30, 60, or 120 seconds</span>
            </div>
            <div className="mode-info-item">
              <strong>Word Lists</strong>
              <span>Common 100, Common 200, Code keywords, Quotes</span>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="about-card card">
          <h2 className="about-card-title">🛠️ Tech Stack</h2>
          <div className="tech-stack">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Vite</span>
            <span className="tech-badge">FastAPI</span>
            <span className="tech-badge">MySQL</span>
            <span className="tech-badge">JWT Auth</span>
            <span className="tech-badge">Recharts</span>
            <span className="tech-badge">Axios</span>
            <span className="tech-badge">SQLAlchemy</span>
          </div>
        </div>
      </div>

      <footer className="about-footer">
        <p>
          Built with 💚 by <strong>Arnav</strong> — {" "}
          <a href="https://github.com/ArnavSawant26" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>
    </div>
  );
};

export default About;
