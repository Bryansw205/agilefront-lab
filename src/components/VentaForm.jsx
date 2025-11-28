import React, { useState } from 'react';
import axios from 'axios';

const VentaForm = () => {
  const [clienteId, setClienteId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      id_cliente: clienteId,
      id_producto: productoId,
      cantidad,
    };
    
    axios.post('http://localhost:5000/venta', data)
      .then(response => {
        alert('Venta registrada');
      })
      .catch(error => {
        console.error('Hubo un error al registrar la venta:', error);
      });
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" placeholder="ID Cliente" onChange={(e) => setClienteId(e.target.value)} required />
      <input type="number" placeholder="ID Producto" onChange={(e) => setProductoId(e.target.value)} required />
      <input type="number" placeholder="Cantidad" onChange={(e) => setCantidad(e.target.value)} required />
      <button type="submit">Registrar Venta</button>
    </form>
  );
}

export default VentaForm;