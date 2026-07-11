import React, { useEffect, useState } from "react";
import "./CountdownOverlay.css";

const CountdownOverlay = ({ countdown }) => {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Retrigger the keyframe animation on tick changes
    setPulse(false);
    const timeout = setTimeout(() => setPulse(true), 10);
    return () => clearTimeout(timeout);
  }, [countdown]);

  let displayVal = countdown;
  if (countdown === 0) displayVal = "GET READY...";
  else if (countdown === -1) displayVal = "GO!";

  return (
    <div className="rt-countdown-overlay">
      <div className="rt-scanlines" />
      <div className={`countdown-box ${pulse ? "pulse" : ""}`}>
        <span className="countdown-label">MATCH STARTING IN</span>
        <span className="countdown-number">{displayVal}</span>
      </div>
    </div>
  );
};

export default CountdownOverlay;
