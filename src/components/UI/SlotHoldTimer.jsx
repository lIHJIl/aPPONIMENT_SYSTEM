import React, { useState, useEffect } from 'react';

const SlotHoldTimer = ({ expiresAt, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date().getTime();
            // Parse UTC naive properly
            const distance = new Date(expiresAt.replace(' ', 'T') + 'Z').getTime() - now; 
            // the server returns ISO, so new Date(expiresAt).getTime() usually works safely
            const safeDistance = new Date(expiresAt).getTime() - now;
            return safeDistance;
        };

        const initialDist = calculateTime();
        if (initialDist < 0) {
            setTimeLeft(0);
            if (onExpire) onExpire();
            return;
        }

        const interval = setInterval(() => {
            const distance = calculateTime();

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft(0);
                if (onExpire) onExpire();
            } else {
                setTimeLeft(Math.floor(distance / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt, onExpire]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isWarning = timeLeft < 120; // under 2 mins

    if (timeLeft <= 0) return null;

    return (
        <div style={{
            padding: '0.5rem 1rem',
            background: isWarning ? 'hsl(var(--danger) / 0.1)' : 'hsl(var(--accent) / 0.1)',
            color: isWarning ? 'hsl(var(--danger))' : 'hsl(var(--accent))',
            borderRadius: '8px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            marginBottom: '1rem',
            fontSize: '0.875rem'
        }}>
            Slot reserved for {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </div>
    );
};

export default SlotHoldTimer;
