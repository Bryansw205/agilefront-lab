import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [nombre, setNombre] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/api/login`, { nombre, contrasena }, { withCredentials: true });
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      onLogin();
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al iniciar sesión');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f7f8fa' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 8px 32px #0001', minWidth: 350 }}>
        <h2 style={{ textAlign: 'center', marginBottom: 8 }}>Sistema Bodega JA</h2>
        <div style={{ textAlign: 'center', color: '#888', marginBottom: 24 }}>Inicie sesión para continuar</div>
        <div style={{ marginBottom: 16 }}>
          <label>Usuario</label>
          <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} className="input" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label>Contraseña</label>
          <input type="password" value={contrasena} onChange={e => setContrasena(e.target.value)} className="input" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', background: '#16c784', color: '#fff', border: 'none', padding: 12, borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          <i className="fa fa-sign-in" style={{ marginRight: 8 }}></i>Ingresar
        </button>
      </form>
    </div>
  );
};

export default Login;
