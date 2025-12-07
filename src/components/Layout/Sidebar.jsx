import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Stethoscope, Settings, Moon, Sun } from 'lucide-react';
import ClinicClock from '../UI/ClinicClock';
import LoginModal from '../Auth/LoginModal';

const Sidebar = () => {
    const { darkMode, toggleTheme, userRole, toggleRole } = useApp();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    const allNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'patient'] },
        { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'patient'] },
        { to: '/doctors', icon: Stethoscope, label: 'Doctors', roles: ['admin', 'patient'] },
        { to: '/patients', icon: Users, label: 'Patients', roles: ['admin', 'patient'] },
        { to: '/admin', icon: Settings, label: 'Admin Panel', roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(userRole));

    return (
        <aside style={{
            width: '250px',
            height: '100vh',
            background: 'hsl(var(--surface))',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            position: 'fixed',
            left: 0,
            top: 0,
            padding: 'var(--spacing-md)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ marginBottom: 'var(--spacing-xl)', color: 'hsl(var(--primary))', fontWeight: 'bold', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={32} />
                <span>MediCare</span>
                <span style={{ fontSize: '0.75rem', background: 'hsl(var(--secondary))', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{userRole.toUpperCase()}</span>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        style={({ isActive }) => ({
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            color: isActive ? 'hsl(var(--text-light))' : 'hsl(var(--text-muted))',
                            background: isActive ? 'hsl(var(--primary))' : 'transparent',
                            transition: 'all 0.2s ease',
                            fontWeight: 500
                        })}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <ClinicClock />
                <button
                    onClick={() => {
                        if (userRole === 'admin') {
                            toggleRole(); // Switch to patient immediately
                        } else {
                            setIsLoginOpen(true); // Open login modal
                        }
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'hsl(var(--secondary))',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500
                    }}
                >
                    <Users size={18} />
                    Switch to {userRole === 'admin' ? 'Patient' : 'Admin'}
                </button>

                <LoginModal
                    isOpen={isLoginOpen}
                    onClose={() => setIsLoginOpen(false)}
                    onLogin={async (username, password) => {
                        if (username !== 'admin') return false;

                        try {
                            console.log('Verifying with server...');
                            const res = await fetch('http://localhost:3000/api/admin/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password })
                            });
                            const data = await res.json();
                            console.log('Server response:', data);

                            if (data.success) {
                                toggleRole();
                                return true;
                            }
                        } catch (e) {
                            console.error("Login verification failed:", e);
                        }
                        return false;
                    }}
                />

                <button
                    onClick={toggleTheme}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        color: 'hsl(var(--text-muted))',
                        cursor: 'pointer',
                        border: '1px solid var(--glass-border)',
                        background: 'transparent'
                    }}
                >
                    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
