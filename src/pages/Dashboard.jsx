import React from 'react';
import { Users, Stethoscope, Calendar, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isToday, parseISO } from 'date-fns';

const Dashboard = () => {
    const { state } = useApp();

    const stats = [
        { label: 'Total Doctors', value: state.doctors.length, icon: Stethoscope, color: 'blue' },
        { label: 'Total Patients', value: state.patients.length, icon: Users, color: 'purple' },
        { label: 'Appointments', value: state.appointments.length, icon: Calendar, color: 'orange' },
    ];

    const todaysAppointments = state.appointments
        .filter(apt => isToday(parseISO(apt.date)))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const getDoctorName = (id) => state.doctors.find(d => d.id === id)?.name || 'Unknown';
    const getPatientName = (id) => state.patients.find(p => p.id === id)?.name || 'Unknown';

    return (
        <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>
                Welcome to {state.clinicSettings.name}
            </h1>

            <div className="grid-cols-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: `var(--primary-light)`,
                            color: `var(--primary)`
                        }}>
                            <stat.icon size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
                            <div style={{ color: 'hsl(var(--text-muted))' }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Today's Schedule</h2>

                {todaysAppointments.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {todaysAppointments.map(apt => (
                            <div key={apt.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '1rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${apt.status === 'Completed' ? 'hsl(var(--success))' : 'hsl(var(--primary))'}`
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ fontWeight: 600, minWidth: '80px' }}>
                                        {format(parseISO(apt.date), 'h:mm a')}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 500 }}>{getPatientName(apt.patientId)}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>with {getDoctorName(apt.doctorId)}</div>
                                    </div>
                                </div>
                                <div>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        backgroundColor: apt.status === 'Pending' ? '#fef3c7' : apt.status === 'Completed' ? '#dcfce7' : '#fee2e2',
                                        color: apt.status === 'Pending' ? '#d97706' : apt.status === 'Completed' ? '#16a34a' : '#dc2626'
                                    }}>
                                        {apt.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                        No appointments scheduled for today.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
