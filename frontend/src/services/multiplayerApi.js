import API from "./api";

export const createRoom = async (settings) => {
  const { data } = await API.post("/multiplayer/rooms", settings);
  return data;
};

export const listRooms = async () => {
  const { data } = await API.get("/multiplayer/rooms");
  return data;
};

export const getRoom = async (roomCode) => {
  const { data } = await API.get(`/multiplayer/rooms/${roomCode}`);
  return data;
};

export const joinRoom = async (roomCode) => {
  const { data } = await API.post(`/multiplayer/rooms/${roomCode}/join`);
  return data;
};

export const leaveRoom = async (roomCode) => {
  const { data } = await API.post(`/multiplayer/rooms/${roomCode}/leave`);
  return data;
};

export const updateRoomSettings = async (roomCode, settings) => {
  const { data } = await API.patch(`/multiplayer/rooms/${roomCode}/settings`, settings);
  return data;
};

export const kickPlayer = async (roomCode, userId) => {
  const { data } = await API.post(`/multiplayer/rooms/${roomCode}/kick/${userId}`);
  return data;
};

export const getMatchResults = async (roomCode) => {
  const { data } = await API.get(`/multiplayer/rooms/${roomCode}/results`);
  return data;
};
