import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

export default api;

export const login = async (usuario, contraseña) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ usuario, contraseña })
    });
    return await response.json();
  } catch (error) {
    console.error('Error de login:', error);
    throw error;
  }
};

export const verificarSesion = async () => {
  try {
    const response = await fetch(`${API_URL}/verificar-sesion`, {
      credentials: 'include'
    });
    return await response.json();
  } catch (error) {
    console.error('Error verificar sesión:', error);
    throw error;
  }
};