import React from 'react';
import { ClientErrorItem} from '@/app/type/client';

interface ModalErrorCreateClientProps {
  errors: ClientErrorItem[];
  open: boolean;
  onClose: () => void;
}

const ModalErrorCreateClient: React.FC<ModalErrorCreateClientProps> = ({ errors, open, onClose }) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 'min(95vw, 720px)',
          maxHeight: '85vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Error al crear cliente</h2>
            <p style={{ margin: '4px 0 0', color: '#555' }}>Revisa las filas con problemas y corrige los datos.</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              lineHeight: 1,
              cursor: 'pointer',
            }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {errors.length === 0 ? (
          <p>No hay errores para mostrar.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Fila</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Nombre</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Título</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #ddd' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((item) => (
                <tr key={`${item.fila}-${item.name}`}>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>{item.fila}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>{item.name}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top' }}>{item.titulo}</td>
                  <td style={{ padding: '10px 8px', borderBottom: '1px solid #f0f0f0', verticalAlign: 'top', color: '#cc0000' }}>{item.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalErrorCreateClient;
