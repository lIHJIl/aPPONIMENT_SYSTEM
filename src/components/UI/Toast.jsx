import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3000);
    }, []);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 1000 }}>
                {toasts.map(toast => (
                    <div key={toast.id} style={{
                        minWidth: '300px',
                        background: 'hsl(var(--surface))',
                        color: 'hsl(var(--text-main))',
                        padding: '1rem',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        borderLeft: `5px solid ${toast.type === 'success' ? 'hsl(var(--success))' : toast.type === 'error' ? 'hsl(var(--danger))' : 'hsl(var(--primary))'}`,
                        animation: 'slideIn 0.3s ease-out'
                    }}>
                        {toast.type === 'success' && <CheckCircle size={20} color="hsl(var(--success))" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="hsl(var(--danger))" />}
                        {toast.type === 'info' && <Info size={20} color="hsl(var(--primary))" />}

                        <span style={{ flex: 1, fontWeight: 500 }}>{toast.message}</span>

                        <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
