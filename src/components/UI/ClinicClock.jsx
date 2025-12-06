import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Clock, Calendar } from 'lucide-react';
import { format, isWithinInterval, parse, set } from 'date-fns';

const ClinicClock = () => {
    const { state } = useApp();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getStatus = () => {
        try {
            const { workingHoursStart, workingHoursEnd, breakStart, breakEnd } = state.clinicSettings;
            if (!workingHoursStart || !workingHoursEnd) return { status: 'CLOSED', color: 'danger' };

            const now = currentTime;
            const start = parse(workingHoursStart, 'HH:mm', now);
            const end = parse(workingHoursEnd, 'HH:mm', now);

            if (!isWithinInterval(now, { start, end })) {
                return { status: 'CLOSED', color: 'danger' };
            }

            if (breakStart && breakEnd) {
                const bStart = parse(breakStart, 'HH:mm', now);
                const bEnd = parse(breakEnd, 'HH:mm', now);
                if (isWithinInterval(now, { start: bStart, end: bEnd })) {
                    return { status: 'ON BREAK', color: 'warning' };
                }
            }

            return { status: 'OPEN', color: 'success' };
        } catch (error) {
            return { status: 'CLOSED', color: 'danger' };
        }
    };

    const { status, color } = getStatus();

    return (
        <div style={{
            background: 'hsl(var(--background))',
            padding: '1rem',
            borderRadius: '12px',
            marginTop: 'auto',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--glass-border)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={14} className="text-muted" />
                    <span>Clinic Status</span>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    background: `hsl(var(--${color}) / 0.1)`,
                    color: `hsl(var(--${color}))`,
                    border: `1px solid hsl(var(--${color}))`
                }}>
                    {status}
                </span>
            </div>

            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
                {format(currentTime, 'aa') === 'PM' || format(currentTime, 'aa') === 'AM' ? format(currentTime, 'hh:mm:ss') : format(currentTime, 'HH:mm:ss')}
                <span style={{ fontSize: '1rem', marginLeft: '4px', color: 'hsl(var(--text-muted))' }}>{format(currentTime, 'a')}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: 'hsl(var(--text-muted))', fontSize: '0.85rem' }}>
                <Calendar size={14} />
                {format(currentTime, 'EEE, MMM do')}
            </div>
        </div>
    );
};

export default ClinicClock;
