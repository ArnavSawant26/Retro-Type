import { useState, useEffect, useCallback, useRef } from "react";

export const useMultiplayerTyping = ({
  words: initialWords = [],
  startTime: serverStartTime = null,
  testMode = "words",
  modeValue = 30,
  onProgress,
  onFinished,
}) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(0);
  const [letterState, setLetterState] = useState([]);
  const [extraLetters, setExtraLetters] = useState([]);
  const [extraLetterState, setExtraLetterState] = useState([]);
  const [done, setDone] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [stats, setStats] = useState({
    correctWords: 0,
    totalTyped: 0,
    correctTyped: 0,
  });

  const timerRef = useRef(null);
  const lastProgressSentRef = useRef(0);
  const statsRef = useRef(stats);
  const currentWordRef = useRef(currentWord);

  // Keep refs up-to-date to avoid stale closure variables in key handlers
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    currentWordRef.current = currentWord;
  }, [currentWord]);

  // Reset/Initialize state when words or mode changes
  useEffect(() => {
    setCurrentWord(0);
    setCurrentLetter(0);
    setExtraLetters([]);
    setExtraLetterState(Array.from({ length: initialWords.length }, () => []));
    setDone(false);
    setStats({ correctWords: 0, totalTyped: 0, correctTyped: 0 });
    setLetterState(Array.from({ length: initialWords.length }, () => []));
    setTimeLeft(testMode === "time" ? modeValue : null);

    if (timerRef.current) clearInterval(timerRef.current);
  }, [initialWords, testMode, modeValue]);

  // Countdown timer for time mode
  useEffect(() => {
    if (testMode !== "time" || !serverStartTime || done) return;

    // Timer update function
    const tick = () => {
      const elapsed = (Date.now() - serverStartTime) / 1000;
      const remaining = Math.max(0, modeValue - Math.floor(elapsed));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setDone(true);
        clearInterval(timerRef.current);

        // Force complete/save results
        const finalWpm = calculateWpm();
        const finalAcc = calculateAccuracy();
        const duration = modeValue;

        onFinished({
          wpm: finalWpm,
          accuracy: finalAcc,
          mistakes: statsRef.current.totalTyped - statsRef.current.correctTyped,
          correct_words: statsRef.current.correctWords,
          incorrect_words: currentWordRef.current - statsRef.current.correctWords,
          time_taken: duration,
        });
      }
    };

    timerRef.current = setInterval(tick, 200);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [serverStartTime, done, testMode, modeValue, onFinished]);

  // Helper selectors
  const calculateWpm = () => {
    if (!serverStartTime) return 0;
    const elapsedMinutes = (Date.now() - serverStartTime) / 60000;
    if (elapsedMinutes <= 0) return 0;
    return Math.round(statsRef.current.correctWords / elapsedMinutes);
  };

  const calculateAccuracy = () => {
    const s = statsRef.current;
    if (s.totalTyped === 0) return 100;
    return Math.round((s.correctTyped / s.totalTyped) * 100);
  };

  const calculateProgress = useCallback((wordIdx, charIdx) => {
    if (initialWords.length === 0) return 0;
    if (testMode === "time") {
      // For time mode, progress is measured relative to duration elapsed
      if (!serverStartTime) return 0;
      const elapsed = (Date.now() - serverStartTime) / 1000;
      return Math.min(100, Math.round((elapsed / modeValue) * 100));
    }
    // For word mode, progress is measured relative to words completed
    const totalChars = initialWords.join(" ").length;
    let typedChars = 0;
    for (let i = 0; i < wordIdx; i++) {
      typedChars += initialWords[i].length + 1; // plus space
    }
    typedChars += charIdx;
    return Math.min(100, Math.round((typedChars / totalChars) * 100));
  }, [initialWords, testMode, modeValue, serverStartTime]);

  // Network progress sender
  const sendProgressUpdate = useCallback((wordIdx, charIdx, force = false) => {
    if (!serverStartTime || done) return;

    const now = Date.now();
    // Throttle progress updates to at most once per 200ms, unless forced (e.g. on word finish)
    if (!force && now - lastProgressSentRef.current < 200) {
      return;
    }

    lastProgressSentRef.current = now;
    const currentWpm = calculateWpm();
    const currentAcc = calculateAccuracy();
    const currentProgress = calculateProgress(wordIdx, charIdx);

    onProgress({
      word_index: wordIdx,
      char_index: charIdx,
      wpm: currentWpm,
      accuracy: currentAcc,
      progress: currentProgress,
    });
  }, [serverStartTime, done, calculateProgress, onProgress]);

  // Main Key handler
  const handleKey = useCallback(
    (e) => {
      if (done || !serverStartTime) return;
      if (e.key === "Tab") {
        e.preventDefault();
        // Ignore restarts during multiplayer matches to keep sync
        return;
      }

      const key = e.key;

      if (key === " ") {
        e.preventDefault();
        if (currentLetter === 0 && extraLetters.length === 0) return;

        const word = initialWords[currentWord];
        const ls = letterState[currentWord] || [];
        let wordCorrect = true;

        for (let i = 0; i < word.length; i++) {
          if (ls[i] !== "correct") {
            wordCorrect = false;
            break;
          }
        }
        if (currentLetter < word.length || extraLetters.length > 0) {
          wordCorrect = false;
        }

        // Increment stats
        setStats((s) => ({
          ...s,
          correctWords: wordCorrect ? s.correctWords + 1 : s.correctWords,
        }));

        const isLastWord = currentWord + 1 >= initialWords.length;
        const reachedWordLimit = testMode === "words" && currentWord + 1 >= modeValue;

        if (isLastWord || reachedWordLimit) {
          setDone(true);
          if (timerRef.current) clearInterval(timerRef.current);

          const finalWpm = Math.round((stats.correctWords + (wordCorrect ? 1 : 0)) / ((Date.now() - serverStartTime) / 60000 || 1));
          const finalAcc = calculateAccuracy();
          const duration = (Date.now() - serverStartTime) / 1000;

          // Send final stats
          onFinished({
            wpm: finalWpm,
            accuracy: finalAcc,
            mistakes: stats.totalTyped - stats.correctTyped,
            correct_words: stats.correctWords + (wordCorrect ? 1 : 0),
            incorrect_words: (currentWord + 1) - (stats.correctWords + (wordCorrect ? 1 : 0)),
            time_taken: duration,
          });
        } else {
          // Move to next word
          setExtraLetterState((prev) => {
            const copy = [...prev];
            copy[currentWord] = [...extraLetters];
            return copy;
          });
          setCurrentWord((w) => w + 1);
          setCurrentLetter(0);
          setExtraLetters([]);

          // Force progress update immediately on space press
          sendProgressUpdate(currentWord + 1, 0, true);
        }
        return;
      }

      if (key === "Backspace") {
        if (extraLetters.length > 0) {
          setExtraLetters((prev) => {
            const nextVal = prev.slice(0, -1);
            sendProgressUpdate(currentWord, currentLetter + nextVal.length, true);
            return nextVal;
          });
        } else if (currentLetter > 0) {
          setCurrentLetter((l) => {
            const newL = l - 1;
            setLetterState((prev) => {
              const copy = [...prev];
              const inner = [...(copy[currentWord] || [])];
              inner[newL] = undefined;
              copy[currentWord] = inner;
              return copy;
            });
            sendProgressUpdate(currentWord, newL, true);
            return newL;
          });
        }
        return;
      }

      // Single character typed
      if (key.length !== 1) return;

      const word = initialWords[currentWord];
      if (!word) return;

      if (currentLetter < word.length) {
        const expected = word[currentLetter];
        const isCorrect = key === expected;

        setLetterState((prev) => {
          const copy = [...prev];
          const inner = [...(copy[currentWord] || [])];
          inner[currentLetter] = isCorrect ? "correct" : "wrong";
          copy[currentWord] = inner;
          return copy;
        });

        setStats((s) => ({
          ...s,
          totalTyped: s.totalTyped + 1,
          correctTyped: isCorrect ? s.correctTyped + 1 : s.correctTyped,
        }));

        setCurrentLetter((l) => {
          const newL = l + 1;
          sendProgressUpdate(currentWord, newL);
          return newL;
        });
      } else {
        setExtraLetters((prev) => {
          const nextVal = [...prev, key];
          sendProgressUpdate(currentWord, currentLetter + nextVal.length);
          return nextVal;
        });
      }
    },
    [
      done,
      serverStartTime,
      currentWord,
      currentLetter,
      extraLetters,
      initialWords,
      letterState,
      testMode,
      modeValue,
      stats,
      sendProgressUpdate,
      onFinished,
    ]
  );

  const wpm = calculateWpm();
  const acc = calculateAccuracy();

  return {
    words: initialWords,
    currentWord,
    currentLetter,
    letterState,
    extraLetters,
    extraLetterState,
    handleKey,
    wpm,
    acc,
    done,
    stats,
    timeLeft,
    isTyping: Boolean(serverStartTime) && !done,
  };
};
