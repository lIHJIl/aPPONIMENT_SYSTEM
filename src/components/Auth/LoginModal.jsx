import React, { useState } from 'react';
import Modal from '../UI/Modal';

const LoginModal = ({ isOpen, onClose, onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Basic validation
        if (!username || !password) {
            setError('Please fill in all fields');
            return;
        }

        const success = await onLogin(username, password);
        if (success) {
            setUsername('');
            setPassword('');
            onClose();
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setUsername('');
                setPassword('');
                setError('');
            }}
            title="Admin Access Required"
        >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {error && (
                    <div style={{
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: 'hsl(var(--danger))',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        autoFocus
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            setUsername('');
                            setPassword('');
                            setError('');
                        }}
                        className="btn"
                        style={{ flex: 1, border: '1px solid #ddd' }}
                    >
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Login</button>
                </div>
            </form>
        </Modal>
    );
};

export default LoginModal;
