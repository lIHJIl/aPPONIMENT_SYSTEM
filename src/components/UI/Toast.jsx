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
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className="toast-item" style={{
                        borderLeft: `5px solid ${toast.type === 'success' ? 'hsl(var(--success))' : toast.type === 'error' ? 'hsl(var(--danger))' : 'hsl(var(--primary))'}`
                    }}>
                        {toast.type === 'success' && <CheckCircle size={20} color="hsl(var(--success))" />}
                        {toast.type === 'error' && <AlertCircle size={20} color="hsl(var(--danger))" />}
                        {toast.type === 'info' && <Info size={20} color="hsl(var(--primary))" />}

                        <span style={{ flex: 1, fontWeight: 500 }}>{toast.message}</span>

                        <button onClick={() => removeToast(toast.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
