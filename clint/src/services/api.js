import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions
});

// Auth services
export const register = async (userData) => {
  const response = await api.post('/users', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const login = async (userData) => {
  const response = await api.post('/users/login', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = async () => {
  await api.post('/users/logout');
  localStorage.removeItem('user');
};

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

// Election services
export const getElections = async () => {
  const response = await api.get('/elections');
  return response.data;
};

export const getElectionById = async (id) => {
  const response = await api.get(`/elections/${id}`);
  return response.data;
};

export const createElection = async (electionData) => {
  const response = await api.post('/elections', electionData);
  return response.data;
};

export const updateElectionStatus = async (id, status) => {
  const response = await api.put(`/elections/${id}/status`, { status });
  return response.data;
};

export const getElectionResults = async (id) => {
  const response = await api.get(`/elections/${id}/results`);
  return response.data;
};

export const deleteElection = async (id) => {
  const response = await api.delete(`/elections/${id}`);
  return response.data;
};

// Leader services
export const getLeaders = async () => {
  const response = await api.get('/users/leaders');
  return response.data;
};

export const getLeadersByConstituency = async (constituency) => {
  const response = await api.get(`/users/leaders/${constituency}`);
  return response.data;
};

// Vote services
export const castVote = async (voteData) => {
  const response = await api.post('/votes', voteData);
  return response.data;
};

export const getVoteStatistics = async (electionId) => {
  const response = await api.get(`/votes/stats/${electionId}`);
  return response.data;
};

export const registerVoterForElection = async (electionId, data) => {
  const response = await api.post(`/elections/${electionId}/register`, data);
  return response.data;
};

export const addCandidateToElection = async (electionId, candidateId, constituencyName) => {
  const response = await api.put(`/elections/${electionId}/candidates`, {
    candidateId,
    constituencyName
  });
  return response.data;
};

export const removeCandidateFromElection = async (electionId, candidateId, constituencyName) => {
  const response = await api.delete(`/elections/${electionId}/candidates`, {
    data: {
      candidateId,
      constituencyName
    }
  });
  return response.data;
};

export default api; 