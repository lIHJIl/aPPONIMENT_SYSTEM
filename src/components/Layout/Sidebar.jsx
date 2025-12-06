import { useApp } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, Stethoscope, Settings, Moon, Sun } from 'lucide-react';

const Sidebar = () => {
    const { darkMode, toggleTheme } = useApp();
    const navItems = [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/appointments', icon: Calendar, label: 'Appointments' },
        { to: '/doctors', icon: Stethoscope, label: 'Doctors' },
        { to: '/patients', icon: Users, label: 'Patients' },
        { to: '/admin', icon: Settings, label: 'Admin Panel' },
    ];

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
                    marginTop: 'auto',
                    border: '1px solid var(--glass-border)',
                    background: 'transparent'
                }}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
        </aside>
    );
};

export default Sidebar;
