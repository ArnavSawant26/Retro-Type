import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Attach JWT to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("rt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────

export const registerUser = async (username, email, password) => {
  const { data } = await API.post("/auth/register", { username, email, password });
  return data;
};

export const loginUser = async (username, password) => {
  const { data } = await API.post("/auth/login", { username, password });
  return data;
};

export const getMe = async (token) => {
  const { data } = await API.get("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

// ── Results ───────────────────────────────────────

export const saveResult = async (result) => {
  const { data } = await API.post("/results/", result);
  return data;
};

export const getMyResults = async () => {
  const { data } = await API.get("/results/me");
  return data;
};

// ── Leaderboard ───────────────────────────────────

export const getLeaderboard = async () => {
  const { data } = await API.get("/leaderboard/");
  return data;
};

// ── Words ─────────────────────────────────────────

export const getWords = async (mode = "common200", count = 30) => {
  const { data } = await API.get("/words/", { params: { mode, count } });
  return data.words;
};

export default API;
