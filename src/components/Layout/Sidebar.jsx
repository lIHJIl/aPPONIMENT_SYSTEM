import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Stethoscope, Settings, Moon, Sun, X, LogOut } from 'lucide-react';
import ClinicClock from '../UI/ClinicClock';

const Sidebar = ({ isOpen, onClose }) => {
    const { darkMode, toggleTheme, userRole, logout } = useApp();

    const allNavItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'patient'] },
        { to: '/appointments', icon: Calendar, label: 'Appointments', roles: ['admin', 'patient'] },
        { to: '/doctors', icon: Stethoscope, label: 'Doctors', roles: ['admin', 'patient'] },
        { to: '/patients', icon: Users, label: 'Patients', roles: ['admin'] },
        { to: '/admin', icon: Settings, label: 'Admin Panel', roles: ['admin'] },
    ];

    const navItems = allNavItems.filter(item => item.roles.includes(userRole));

    return (
        <>
            {/* Mobile Overlay */}
            <div className={`sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
            
            <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
                <div style={{ marginBottom: 'var(--spacing-xl)', color: 'hsl(var(--primary))', fontWeight: 'bold', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Stethoscope size={32} />
                        <span>MediCare</span>
                        <span style={{ fontSize: '0.75rem', background: 'hsl(var(--secondary))', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{userRole?.toUpperCase()}</span>
                    </div>
                    {isOpen && (
                        <button onClick={onClose} style={{ display: 'flex', color: 'hsl(var(--text-muted))' }} className="mobile-close-btn" aria-label="Close menu">
                            <X size={24} />
                        </button>
                    )}
                </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        onClick={onClose}
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
                        if (confirm('Are you sure you want to log out?')) logout();
                    }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: 'hsl(var(--danger))',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        border: 'none'
                    }}
                >
                    <LogOut size={18} />
                    Log Out
                </button>
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
        </>
    );
};

export default Sidebar;
