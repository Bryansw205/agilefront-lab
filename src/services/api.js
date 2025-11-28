import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('API URL:', API_URL); // Para debug

const api = axios.create({
  baseURL: API_URL,
});

export default api;

export const login = async (usuario, contraseña) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ usuario, contraseña })
  });
  return response.json();
};

export const verificarSesion = async () => {
  const response = await fetch(`${API_URL}/verificar-sesion`, {
    credentials: 'include'
  });
  return response.json();
};

export const logout = async () => {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include'
  });
  return response.json();
};