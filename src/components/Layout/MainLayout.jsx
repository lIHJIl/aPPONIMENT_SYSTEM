import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const MainLayout = () => {
    return (
        <div style={{ display: 'flex' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: '250px',
                padding: 'var(--spacing-lg)',
                minHeight: '100vh',
                background: 'hsl(var(--background))'
            }}>
                <Outlet />
            </main>
        </div>
    );
};

export default MainLayout;
