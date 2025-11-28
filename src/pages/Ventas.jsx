import React, { useState, useEffect } from 'react';
import api from '../services/api';

const normalizarTexto = (texto = '') => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const Ventas = () => {
  // Estado para el carrito y opciones de pago
  const [carrito, setCarrito] = useState([]);
  const [producto, setProducto] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [subtotal, setSubtotal] = useState(0);
  const [formaPago, setFormaPago] = useState('efectivo');
  const [medioCompra, setMedioCompra] = useState('presencial');
  const [tipoPago, setTipoPago] = useState('completo');
  const [fechaLimitePago, setFechaLimitePago] = useState('');
  const [cliente, setCliente] = useState('');
  const [montoPagado, setMontoPagado] = useState('');
  const [notificacion, setNotificacion] = useState({ mensaje: '', tipo: '' });
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ nombre: '', apellidos: '', direccion: '', telefono: '' });
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  useEffect(() => {
    if (notificacion.mensaje) {
      const timer = setTimeout(() => {
        setNotificacion({ mensaje: '', tipo: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notificacion]);

  // Estado para productos y clientes desde la base de datos
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);

  // Obtener productos y clientes desde la API al cargar el componente
  useEffect(() => {
    api.get('/productos')
      .then(res => setProductos(res.data))
      .catch(() => setProductos([]));
    api.get('/clientes')
      .then(res => setClientes(res.data))
      .catch(() => setClientes([]));
  }, []);

  const productosActivos = productos.filter(p => p.activo);
  const productosFiltrados = productosActivos.filter(p =>
    normalizarTexto(p.nombre).includes(normalizarTexto(busquedaProducto))
  );

  const handleBusquedaProducto = (valor) => {
    setBusquedaProducto(valor);
    setMostrarSugerencias(true);
    setProducto('');
  };

  const handleSeleccionProducto = (prod) => {
    setProducto(prod.id_producto);
    setBusquedaProducto(prod.nombre);
    setMostrarSugerencias(false);
  };

  // Añadir producto al carrito
  const handleAddToCart = () => {
    const prod = productos.find(p => String(p.id_producto) === String(producto));
    if (!prod) {
      setNotificacion({ mensaje: 'Selecciona un producto válido.', tipo: 'error' });
      return;
    }
    if (cantidad < 1) {
      setNotificacion({ mensaje: 'La cantidad debe ser mayor a 0.', tipo: 'error' });
      return;
    }
    if (cantidad > prod.stock) {
      setNotificacion({ mensaje: `Stock insuficiente. Solo hay ${prod.stock} unidades.`, tipo: 'error' });
      return;
    }
    const item = {
      producto: prod.nombre,
      cantidad: Number(cantidad),
      subtotal: prod.precio * cantidad,
      stock: prod.stock
    };
    setCarrito([...carrito, item]);
    setSubtotal(subtotal + item.subtotal);
    setNotificacion({ mensaje: 'Producto añadido al carrito.', tipo: 'success' });
  };

  // Eliminar producto del carrito
  const handleRemoveFromCart = (idx) => {
    const item = carrito[idx];
    setSubtotal(subtotal - item.subtotal);
    setCarrito(carrito.filter((_, i) => i !== idx));
  };

  // Registrar venta en la base de datos
  const handleRegistrarVenta = async () => {
    if (!cliente) {
      setNotificacion({ mensaje: 'Selecciona un cliente.', tipo: 'error' });
      return;
    }
    if (carrito.length === 0) {
      setNotificacion({ mensaje: 'Agrega productos al carrito.', tipo: 'error' });
      return;
    }
    if (tipoPago === 'fiado' && !fechaLimitePago) {
      setNotificacion({ mensaje: 'Selecciona la fecha límite de pago para fiado.', tipo: 'error' });
      return;
    }
    // Mapear valores exactos para ENUM
    const medioCompraMap = {
      presencial: 'presencial',
      WhatsApp: 'WhatsApp'
    };
    const formaPagoMap = {
      efectivo: 'efectivo',
      Yape: 'Yape',
      Plin: 'Plin'
    };
    const tipoPagoMap = {
      completo: 'completo',
      fiado: 'fiado'
    };
    try {
      const ventaPayload = {
        id_cliente: cliente,
        total: +subtotal.toFixed(2), // Enviar solo el subtotal, el backend calcula IGV
        medio_compra: medioCompraMap[medioCompra],
        tipo_pago: formaPagoMap[formaPago],
        forma_pago: tipoPagoMap[tipoPago],
        productos: carrito.map(item => ({
          id_producto: productos.find(p => p.nombre === item.producto).id_producto,
          cantidad: item.cantidad,
          precio: productos.find(p => p.nombre === item.producto).precio,
          subtotal: item.subtotal
        })),
        fiado: tipoPago === 'fiado' ? { fecha_limite_pago: fechaLimitePago } : null
      };
  const res = await api.post('/venta', ventaPayload, { withCredentials: true });
      if (res.data.success) {
        setNotificacion({ mensaje: 'Venta registrada con éxito.', tipo: 'success' });
        // Actualizar productos automáticamente
        api.get('/productos')
          .then(res => setProductos(res.data))
          .catch(() => setProductos([]));
        handleNuevaVenta();
      } else {
        setNotificacion({ mensaje: 'Error al registrar venta.', tipo: 'error' });
      }
    } catch (err) {
      setNotificacion({ mensaje: 'Error al registrar venta.', tipo: 'error' });
    }
  };

  // Nueva venta (resetear todo)
  const handleNuevaVenta = () => {
    setCarrito([]);
    setProducto('');
    setBusquedaProducto('');
    setMostrarSugerencias(false);
    setCantidad(1);
    setSubtotal(0);
    setFormaPago('efectivo');
    setMedioCompra('presencial');
    setTipoPago('completo');
    setCliente('');
    setMontoPagado('');
  };

  // Calcular IGV y total
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  // Función para abrir/cerrar el modal
  const handleOpenClienteModal = () => setShowClienteModal(true);
  const handleCloseClienteModal = () => {
    setShowClienteModal(false);
    setNuevoCliente({ nombre: '', apellidos: '', direccion: '', telefono: '' });
  };

  // Función para guardar el cliente
  const handleGuardarCliente = async () => {
    if (!nuevoCliente.nombre || !nuevoCliente.apellidos) {
      setNotificacion({ mensaje: 'Nombre y apellidos son obligatorios.', tipo: 'error' });
      return;
    }
    setLoadingCliente(true);
    try {
      const res = await api.post('/clientes', nuevoCliente);
      if (res.data && res.data.id_cliente) {
        setNotificacion({ mensaje: 'Cliente creado correctamente.', tipo: 'success' });
        // Actualizar lista de clientes
        api.get('/clientes').then(r => setClientes(r.data));
        setCliente(res.data.id_cliente);
        handleCloseClienteModal();
      } else {
        setNotificacion({ mensaje: 'Error al crear cliente.', tipo: 'error' });
      }
    } catch (err) {
      setNotificacion({ mensaje: 'Error al crear cliente.', tipo: 'error' });
    }
    setLoadingCliente(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', marginLeft: '240px', padding: '40px 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: '32px', marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontWeight: 'bold', fontSize: '2rem', color: '#222', margin: 0 }}>Ventas</h1>
            <button type='button' onClick={handleNuevaVenta} style={{ background: '#1abc5b', color: '#fff', fontWeight: 'bold', fontSize: '1rem', padding: '10px 24px', border: 'none', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(26,188,91,0.07)' }}>
              <span style={{ fontSize: '1.2em' }}>+</span> Nueva Venta
            </button>
          </div>
          {/* Toast de notificación superpuesto */}
          {notificacion.mensaje && (
            <div style={{
              position: 'fixed',
              left: '32px',
              bottom: '32px',
              zIndex: 9999,
              minWidth: '260px',
              padding: '16px 24px',
              borderRadius: '8px',
              background: notificacion.tipo === 'error' ? '#ffeaea' : '#eaffea',
              color: notificacion.tipo === 'error' ? '#e53935' : '#1abc5b',
              fontWeight: 'bold',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              fontSize: '1rem',
              animation: 'fadeIn 0.3s',
            }}>
              {notificacion.mensaje}
            </div>
          )}
          <div style={{ display: 'flex', gap: '30px', justifyContent: 'center' }}>
            {/* Detalle de Venta */}
            <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222' }}>Detalle de Venta</h2>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '18px', alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', minWidth: '300px', flex: '1' }}>
                  <input
                    type='text'
                    value={busquedaProducto}
                    onChange={e => handleBusquedaProducto(e.target.value)}
                    onFocus={() => setMostrarSugerencias(true)}
                    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 120)}
                    placeholder='Buscar producto por nombre'
                    style={{ width: '100%', padding: '8px', borderRadius: '7px', border: '1px solid #ccc' }}
                  />
                  {mostrarSugerencias && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%', maxHeight: '220px', overflowY: 'auto', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 10 }}>
                      {productosFiltrados.length === 0 ? (
                        <div style={{ padding: '10px', color: '#888', fontSize: '0.95rem' }}>No se encontraron productos</div>
                      ) : (
                        productosFiltrados.map(p => (
                          <div
                            key={p.id_producto}
                            onMouseDown={e => {
                              e.preventDefault();
                              handleSeleccionProducto(p);
                            }}
                            style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
                          >
                            <span style={{ fontWeight: '600', color: '#222' }}>{p.nombre}</span>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>{`Stock disponible: ${p.stock}`}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <input type='number' min='1' value={cantidad} onChange={e => setCantidad(e.target.value)} style={{ width: '60px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', marginLeft: '12px' }} />
                <input type='text' value={`S/. ${(() => {
                  const prod = productos.find(p => String(p.id_producto) === String(producto));
                  return prod ? (prod.precio * cantidad).toFixed(2) : '0.00';
                })()}`} readOnly style={{ width: '100px', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5', marginLeft: '12px' }} />
                <button
                  type='button'
                  onClick={handleAddToCart}
                  disabled={!producto || !cantidad || cantidad < 1}
                  style={{
                    background: producto && cantidad >= 1 ? '#2196f3' : '#b0b8c1',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    marginLeft: '12px',
                    cursor: producto && cantidad >= 1 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Añadir al carrito
                </button>
              </div>
              <table style={{ width: '100%', marginBottom: '18px', borderCollapse: 'collapse', fontSize: '1rem', tableLayout: 'fixed' }}>
                <thead style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>PRODUCTO</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>CANTIDAD</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>SUBTOTAL</th>
                    <th style={{ padding: '8px', textAlign: 'left', color: '#888' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody style={{ display: 'block', maxHeight: '220px', overflowY: 'auto', width: '100%' }}>
                  {carrito.length === 0 ? (
                    <tr style={{ display: 'table', width: '100%' }}><td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: '#888' }}>No hay productos en el carrito</td></tr>
                  ) : (
                    carrito.map((item, idx) => (
                      <tr key={idx} style={{ display: 'table', width: '100%', tableLayout: 'fixed' }}>
                        <td style={{ padding: '8px' }}>{item.producto}</td>
                        <td style={{ padding: '8px' }}>{item.cantidad}</td>
                        <td style={{ padding: '8px' }}>S/. {item.subtotal.toFixed(2)}</td>
                        <td style={{ padding: '8px' }}>
                          <button type='button' onClick={() => handleRemoveFromCart(idx)} style={{ background: 'none', border: 'none', color: '#e53935', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span role='img' aria-label='eliminar' style={{ fontSize: '1.1em' }}>🗑️</span> Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', marginTop: '10px', fontSize: '1.1rem' }}>
                <div>Subtotal: <span style={{ color: '#222' }}>S/. {subtotal.toFixed(2)}</span></div>
                <div>IGV (18%): <span style={{ color: '#222' }}>S/. {igv.toFixed(2)}</span></div>
                <div style={{ fontWeight: 'bold', color: 'green', fontSize: '1.2rem' }}>Total: S/. {total.toFixed(2)}</div>
              </div>
            </div>

            {/* Opciones de Pago */}
            <div style={{ flex: 1, background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222' }}>Opciones de Pago</h2>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Forma de Pago</div>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='formaPago' value='efectivo' checked={formaPago === 'efectivo'} onChange={e => setFormaPago(e.target.value)} disabled={tipoPago === 'fiado'} /> efectivo
                </label>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='formaPago' value='Yape' checked={formaPago === 'Yape'} onChange={e => setFormaPago(e.target.value)} disabled={tipoPago === 'fiado'} /> Yape
                </label>
                <label>
                  <input type='radio' name='formaPago' value='Plin' checked={formaPago === 'Plin'} onChange={e => setFormaPago(e.target.value)} disabled={tipoPago === 'fiado'} /> Plin
                </label>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Medio de Compra</div>
                <label style={{ marginRight: '12px' }}><input type='radio' name='medioCompra' value='presencial' checked={medioCompra === 'presencial'} onChange={e => setMedioCompra(e.target.value)} /> presencial</label>
                <label><input type='radio' name='medioCompra' value='WhatsApp' checked={medioCompra === 'WhatsApp'} onChange={e => setMedioCompra(e.target.value)} /> WhatsApp</label>
              </div>
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Tipo de Pago</div>
                <label style={{ marginRight: '12px' }}>
                  <input type='radio' name='tipoPago' value='completo' checked={tipoPago === 'completo'} onChange={e => setTipoPago(e.target.value)} /> completo
                </label>
                <label>
                  <input type='radio' name='tipoPago' value='fiado' checked={tipoPago === 'fiado'} onChange={e => setTipoPago(e.target.value)} /> fiado
                </label>
              </div>
              {tipoPago === 'fiado' && (
                <div style={{ marginBottom: '18px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Fecha límite de pago</div>
                  <input
                    type='date'
                    value={fechaLimitePago}
                    onChange={e => setFechaLimitePago(e.target.value)}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}
                  />
                </div>
              )}
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Cliente</div>
                <select value={cliente} onChange={e => setCliente(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '140px' }}>
                  <option value=''>Seleccionar cliente</option>
                  {clientes.map(c => (
                    <option key={c.id_cliente} value={c.id_cliente}>{`${c.nombre} ${c.apellidos}`}</option>
                  ))}
                </select>
                <button type='button' onClick={handleOpenClienteModal} style={{ marginLeft: '10px', color: '#2196f3', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Agregar cliente</button>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '18px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Monto Pagado</div>
                  <input type='number' value={montoPagado} onChange={e => setMontoPagado(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '120px' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>Vuelto</div>
                  <input type='text' value={`S/. ${(montoPagado - total > 0 ? (montoPagado - total).toFixed(2) : '0.00')}`} readOnly style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', width: '120px', background: '#f5f5f5' }} />
                </div>
              </div>
              <button type='button' onClick={handleRegistrarVenta} style={{ width: '100%', background: '#1abc5b', color: '#fff', padding: '14px', border: 'none', borderRadius: '6px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer' }}>Registrar Venta</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para agregar cliente */}
      {showClienteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '32px', minWidth: '400px', maxWidth: '90vw', position: 'relative' }}>
            <button onClick={handleCloseClienteModal} style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', border: 'none', fontSize: '1.3rem', color: '#888', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: '20px', color: '#222', textAlign: 'center' }}>Agregar Cliente</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input type='text' placeholder='Nombre' value={nuevoCliente.nombre} onChange={e => setNuevoCliente({ ...nuevoCliente, nombre: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Apellidos' value={nuevoCliente.apellidos} onChange={e => setNuevoCliente({ ...nuevoCliente, apellidos: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Dirección (opcional)' value={nuevoCliente.direccion} onChange={e => setNuevoCliente({ ...nuevoCliente, direccion: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
              <input type='text' placeholder='Teléfono (opcional)' value={nuevoCliente.telefono} onChange={e => setNuevoCliente({ ...nuevoCliente, telefono: e.target.value })} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px' }}>
              <button type='button' onClick={handleCloseClienteModal} style={{ background: '#f5f5f5', color: '#222', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}>Cancelar</button>
              <button type='button' onClick={handleGuardarCliente} disabled={loadingCliente} style={{ background: '#1abc5b', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 24px', fontWeight: 'bold', fontSize: '1rem', cursor: loadingCliente ? 'not-allowed' : 'pointer' }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventas;
