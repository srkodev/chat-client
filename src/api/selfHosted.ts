import axios from 'axios';

const API_URL = 'http://localhost:4000/api'; // à adapter selon votre config

// Instance Axios pour ajouter automatiquement le token JWT
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // ou une autre méthode de stockage
  if (token) {
    if (config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export interface SelfHostedServer {
  id: number;
  domain: string;
  ip?: string;
  config?: any;
  ownerId: number;
}

export default {
  getServers() {
    return apiClient.get<SelfHostedServer[]>('/selfhosted');
  },
  addServer(payload: { domain: string; ip?: string; config?: any }) {
    return apiClient.post('/selfhosted', payload);
  },
  updateServer(serverId: number, payload: { domain?: string; ip?: string; config?: any }) {
    return apiClient.put(`/selfhosted/${serverId}`, payload);
  },
  deleteServer(serverId: number) {
    return apiClient.delete(`/selfhosted/${serverId}`);
  }
};
