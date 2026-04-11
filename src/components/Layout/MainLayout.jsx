import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Stethoscope } from 'lucide-react';

const MainLayout = () => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setMobileMenuOpen(prev => !prev);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="layout-wrapper">
            {/* Mobile Top Header (only visible on mobile via css) */}
            <header className="mobile-header">
                <div className="mobile-header-brand">
                    <Stethoscope size={24} />
                    <span>MediCare</span>
                </div>
                <button onClick={toggleMobileMenu} aria-label="Toggle Menu" style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Menu size={28} color="hsl(var(--text-main))" />
                </button>
            </header>

            <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
            
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
