import { useEffect, useRef } from "react";
import { useTyping } from "../hooks/useTyping";
import { useAuth } from "../context/AuthContext";
import { saveResult } from "../services/api";
import WPMGraph from "./WPMGraph";
import "./TypingBox.css";

const WORD_OPTIONS = [10, 25, 50];
const TIME_OPTIONS = [15, 30, 60, 120];
const LIST_OPTIONS = [
  { value: "common100", label: "Common 100" },
  { value: "common200", label: "Common 200" },
  { value: "code", label: "Code" },
  { value: "quotes", label: "Quotes" },
];

const TypingBox = () => {
  const {
    words,
    currentWord,
    currentLetter,
    letterState,
    extraLetters,
    extraLetterState,
    handleKey,
    wpm,
    acc,
    done,
    reset,
    wpmHistory,
    timeLeft,
    testMode,
    setTestMode,
    modeValue,
    setModeValue,
    wordList,
    setWordList,
  } = useTyping();

  const { user } = useAuth();
  const containerRef = useRef(null);
  const wordRefs = useRef([]);
  const resultSaved = useRef(false);

  // Keyboard listener
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // Smooth auto-scroll
  useEffect(() => {
    const currentEl = wordRefs.current[currentWord];
    const container = containerRef.current;
    if (currentEl && container) {
      const top = currentEl.offsetTop;
      container.scrollTo({
        top: top - container.clientHeight * 0.4,
        behavior: "smooth",
      });
    }
  }, [currentWord]);

  // Auto-save result when done
  useEffect(() => {
    if (done && user && !resultSaved.current && wpm > 0) {
      resultSaved.current = true;
      saveResult({
        wpm,
        accuracy: acc,
        word_count: currentWord,
        mode: testMode,
        mode_value: modeValue,
        word_list: wordList,
      }).catch(() => {});
    }
    if (!done) {
      resultSaved.current = false;
    }
  }, [done, user, wpm, acc, currentWord, testMode, modeValue, wordList]);

  const handleReset = () => {
    reset();
  };

  const switchMode = (mode, value) => {
    setTestMode(mode);
    setModeValue(value);
  };

  return (
    <div className="rt-root fade-in">
      {/* ── MODE SELECTOR ── */}
      <div className="rt-modes">
        <div className="mode-group">
          <span className="mode-label">word list</span>
          <div className="mode-pills">
            {LIST_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`mode-pill ${wordList === opt.value ? "active" : ""}`}
                onClick={() => setWordList(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mode-divider" />

        <div className="mode-group">
          <span className="mode-label">words</span>
          <div className="mode-pills">
            {WORD_OPTIONS.map((n) => (
              <button
                key={n}
                className={`mode-pill ${testMode === "words" && modeValue === n ? "active" : ""}`}
                onClick={() => switchMode("words", n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="mode-divider" />

        <div className="mode-group">
          <span className="mode-label">time</span>
          <div className="mode-pills">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                className={`mode-pill ${testMode === "time" && modeValue === t ? "active" : ""}`}
                onClick={() => switchMode("time", t)}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CRT CONTAINER ── */}
      <div className="rt-crt">
        <div className="rt-scanlines" />

        {/* Header Stats */}
        <div className="rt-header">
          <div className="rt-stats">
            <div className="rt-stat">
              <span className="rt-stat-label">WPM</span>
              <span className="rt-stat-val">{wpm}</span>
            </div>
            <div className="rt-stat">
              <span className="rt-stat-label">ACC</span>
              <span className="rt-stat-val">{acc}%</span>
            </div>
            {testMode === "time" && timeLeft !== null && (
              <div className="rt-stat">
                <span className="rt-stat-label">TIME</span>
                <span className={`rt-stat-val ${timeLeft <= 5 ? "danger" : ""}`}>{timeLeft}s</span>
              </div>
            )}
            {testMode === "words" && (
              <div className="rt-stat">
                <span className="rt-stat-label">WORDS</span>
                <span className="rt-stat-val">
                  {currentWord}/{modeValue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Terminal */}
        <div className="rt-terminal" ref={containerRef}>
          <div className="rt-words">
            {words.map((word, wIndex) => (
              <span
                key={wIndex}
                ref={(el) => (wordRefs.current[wIndex] = el)}
                className={`rt-word ${wIndex === currentWord ? "active" : ""} ${
                  wIndex < currentWord ? "typed" : ""
                }`}
              >
                {word.split("").map((char, cIndex) => {
                  let className = "rt-letter";
                  if (letterState[wIndex]?.[cIndex] === "correct") className += " correct";
                  else if (letterState[wIndex]?.[cIndex] === "wrong") className += " wrong";

                  const isCursor = wIndex === currentWord && cIndex === currentLetter && !done;
                  if (isCursor) className += " cursor";

                  return (
                    <span key={cIndex} className={className}>
                      {char}
                    </span>
                  );
                })}

                {/* Extra letters */}
                {(wIndex === currentWord ? extraLetters : extraLetterState[wIndex] || []).map(
                  (el, i) => (
                    <span key={`extra-${i}`} className="rt-letter extra">
                      {el}
                    </span>
                  )
                )}

              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="rt-footer">
          <span className="rt-hint">{done ? "test complete" : "[ TAB ] restart"}</span>
          <button className="btn" onClick={handleReset}>
            RESTART
          </button>
        </div>

        {/* ── RESULT OVERLAY ── */}
        {done && (
          <div className="rt-overlay">
            <div className="rt-overlay-inner fade-in">
              <div className="rt-overlay-title">TEST COMPLETE</div>

              <div className="rt-overlay-stats">
                <div className="rt-overlay-stat highlight">
                  <span className="stat-number">{wpm}</span>
                  <span className="stat-label">WPM</span>
                </div>
                <div className="rt-overlay-stat">
                  <span className="stat-number">{acc}%</span>
                  <span className="stat-label">ACCURACY</span>
                </div>
                <div className="rt-overlay-stat">
                  <span className="stat-number">{currentWord}</span>
                  <span className="stat-label">WORDS</span>
                </div>
              </div>

              <WPMGraph data={wpmHistory} />

              {!user && (
                <p className="rt-login-nudge">
                  ⚡ <a href="/login">Login</a> to save your results & appear on the leaderboard
                </p>
              )}
              {user && <p className="rt-saved-msg">✓ Result saved</p>}

              <button className="btn btn-primary" onClick={handleReset}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingBox;
