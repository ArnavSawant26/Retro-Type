import { useNavigate } from "react-router-dom";

const Result = () => {
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ textAlign: "center", paddingTop: 60 }}>
      <h2 style={{ color: "var(--text-bright)", fontFamily: "var(--font-sans)", marginBottom: 12 }}>
        Results are shown after each test
      </h2>
      <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
        Complete a typing test on the home page to see your detailed results.
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>
        START TYPING
      </button>
    </div>
  );
};

export default Result;
