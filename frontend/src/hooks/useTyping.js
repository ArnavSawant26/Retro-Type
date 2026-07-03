import { useState, useEffect, useCallback, useRef } from "react";
import { getWords } from "../services/api";
import { getRandomWords } from "../utils/words";

const DEFAULT_WORD_COUNT = 30;

export const useTyping = () => {
  // ── Mode state ─────────────────────────────────
  const [testMode, setTestMode] = useState("words");         // "words" | "time"
  const [modeValue, setModeValue] = useState(30);             // word count OR seconds
  const [wordList, setWordList] = useState("common200");      // "common100" | "common200" | "code" | "quotes"

  // ── Game state ─────────────────────────────────
  const [words, setWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(0);
  const [letterState, setLetterState] = useState([]);
  const [extraLetters, setExtraLetters] = useState([]);
  const [extraLetterState, setExtraLetterState] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [done, setDone] = useState(false);
  const [wpmHistory, setWpmHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [stats, setStats] = useState({
    correctWords: 0,
    totalTyped: 0,
    correctTyped: 0,
  });

  const timerRef = useRef(null);
  const wpmIntervalRef = useRef(null);

  // ── Fetch words ────────────────────────────────
  const loadWords = useCallback(async () => {
    const count = testMode === "time" ? 200 : modeValue;
    try {
      const fetched = await getWords(wordList, count);
      return fetched;
    } catch {
      // Fallback to local words if backend is down
      return getRandomWords(count);
    }
  }, [testMode, modeValue, wordList]);

  // ── Reset ──────────────────────────────────────
  const reset = useCallback(async () => {
    // Clear timers
    if (timerRef.current) clearInterval(timerRef.current);
    if (wpmIntervalRef.current) clearInterval(wpmIntervalRef.current);

    const newWords = await loadWords();
    setWords(newWords);
    setCurrentWord(0);
    setCurrentLetter(0);
    setExtraLetters([]);
    setExtraLetterState(Array.from({ length: newWords.length }, () => []));
    setStartTime(null);
    setDone(false);
    setStats({ correctWords: 0, totalTyped: 0, correctTyped: 0 });
    setLetterState(Array.from({ length: newWords.length }, () => []));
    setWpmHistory([]);
    setTimeLeft(testMode === "time" ? modeValue : null);
  }, [loadWords, testMode, modeValue]);

  // Init on mount & when mode changes
  useEffect(() => {
    reset();
  }, [reset]);

  // ── Countdown timer (time mode) ────────────────
  useEffect(() => {
    if (testMode !== "time" || !startTime || done) return;

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, modeValue - Math.floor(elapsed));
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setDone(true);
        clearInterval(timerRef.current);
      }
    }, 200);

    return () => clearInterval(timerRef.current);
  }, [startTime, done, testMode, modeValue]);

  // ── WPM history tracker ────────────────────────
  useEffect(() => {
    if (!startTime || done) return;

    wpmIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const currentWpm = stats.correctWords / ((Date.now() - startTime) / 60000 || 1);
      setWpmHistory((prev) => [
        ...prev,
        { time: Math.floor(elapsed), wpm: Math.round(currentWpm) },
      ]);
    }, 1000);

    return () => clearInterval(wpmIntervalRef.current);
  }, [startTime, done, stats.correctWords]);

  // ── Key handler ────────────────────────────────
  const handleKey = useCallback(
    (e) => {
      if (done) return;
      if (e.key === "Tab") {
        e.preventDefault();
        reset();
        return;
      }

      const key = e.key;
      if (!startTime) setStartTime(Date.now());

      if (key === " ") {
        e.preventDefault();
        if (currentLetter === 0 && extraLetters.length === 0) return;

        const word = words[currentWord];
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

        if (wordCorrect) {
          setStats((s) => ({ ...s, correctWords: s.correctWords + 1 }));
        }

        // End test if we've done all words (words mode)
        if (testMode === "words" && currentWord + 1 >= modeValue) {
          setDone(true);
        }

        // In time mode, if we run out of pre-loaded words, the test just continues
        if (currentWord + 1 >= words.length) {
          setDone(true);
        }

        setExtraLetterState((prev) => {
          const copy = [...prev];
          copy[currentWord] = [...extraLetters];
          return copy;
        });
        setCurrentWord((w) => w + 1);
        setCurrentLetter(0);
        setExtraLetters([]);
        return;
      }

      if (key === "Backspace") {
        if (extraLetters.length > 0) {
          setExtraLetters((prev) => prev.slice(0, -1));
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
            return newL;
          });
        }
        return;
      }

      if (key.length !== 1) return;

      const word = words[currentWord];
      if (!word) return;

      if (currentLetter < word.length) {
        const expected = word[currentLetter];
        setLetterState((prev) => {
          const copy = [...prev];
          const inner = [...(copy[currentWord] || [])];
          const isCorrect = key === expected;
          inner[currentLetter] = isCorrect ? "correct" : "wrong";

          setStats((s) => ({
            ...s,
            totalTyped: s.totalTyped + 1,
            correctTyped: isCorrect ? s.correctTyped + 1 : s.correctTyped,
          }));

          copy[currentWord] = inner;
          return copy;
        });
        setCurrentLetter((l) => l + 1);
      } else {
        setExtraLetters((prev) => [...prev, key]);
      }
    },
    [done, startTime, currentWord, currentLetter, extraLetters, words, letterState, testMode, modeValue, reset]
  );

  // ── Computed values ────────────────────────────
  const wpm = startTime
    ? Math.round(stats.correctWords / ((Date.now() - startTime) / 60000))
    : 0;

  const acc =
    stats.totalTyped === 0
      ? 100
      : Math.round((stats.correctTyped / stats.totalTyped) * 100);

  return {
    // Game state
    words,
    currentWord,
    currentLetter,
    letterState,
    extraLetters,
    extraLetterState,
    handleKey,
    reset,
    wpm,
    acc,
    done,
    stats,
    wpmHistory,
    timeLeft,
    isTyping: Boolean(startTime) && !done,

    // Mode controls
    testMode,
    setTestMode,
    modeValue,
    setModeValue,
    wordList,
    setWordList,
  };
};
