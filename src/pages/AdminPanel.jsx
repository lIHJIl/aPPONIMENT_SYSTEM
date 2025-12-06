import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

const AdminPanel = () => {
    const { state, dispatch } = useApp();
    const [settings, setSettings] = useState(state.clinicSettings);

    useEffect(() => {
        setSettings(state.clinicSettings);
    }, [state.clinicSettings]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
        alert('Settings saved successfully!');
    };

    return (
        <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>Admin Settings</h1>

            <div className="card">
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Clinic Name</label>
                        <input
                            type="text"
                            value={settings.name}
                            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Working Hours Start</label>
                            <input
                                type="time"
                                value={settings.workingHoursStart}
                                onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Working Hours End</label>
                            <input
                                type="time"
                                value={settings.workingHoursEnd}
                                onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Break Start</label>
                            <input
                                type="time"
                                value={settings.breakStart || ''}
                                onChange={(e) => setSettings({ ...settings, breakStart: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Break End</label>
                            <input
                                type="time"
                                value={settings.breakEnd || ''}
                                onChange={(e) => setSettings({ ...settings, breakEnd: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                        <button type="submit" className="btn btn-primary">
                            <Save size={20} />
                            Save Settings
                        </button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Change Admin Password</h3>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const newPassword = e.target.password.value;
                    if (!newPassword) return;

                    try {
                        const res = await fetch('http://localhost:3000/api/admin/password', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ newPassword })
                        });
                        if (res.ok) {
                            alert('Password updated successfully');
                            e.target.reset();
                        } else {
                            alert('Failed to update password');
                        }
                    } catch (err) {
                        alert('Error updating password');
                    }
                }} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>New Password</label>
                        <input
                            name="password"
                            type="password"
                            placeholder="Enter new password"
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Update Password</button>
                </form>
            </div>
        </div>
    );
};

export default AdminPanel;
