import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export default api;

// --- LOGIN ---
export const login = async (usuario, contraseña) => {
  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ usuario, contraseña })
  });
  return response.json();
};

// --- VERIFICAR SESION ---
export const verificarSesion = async () => {
  const response = await fetch(`${API_URL}/api/verificar-sesion`, {
    credentials: 'include'
  });
  return response.json();
};

// --- LOGOUT ---
export const logout = async () => {
  const response = await fetch(`${API_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return response.json();
};
