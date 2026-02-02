import React from 'react';
import { Users, Stethoscope, Calendar, Clock, Plus, History, Activity, ChevronRight, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format, isToday, parseISO, isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { userRole } = useApp();

    return (
        <div className="container" style={{ padding: 'var(--spacing-lg) 0' }}>
            {userRole === 'admin' ? <StaffDashboard /> : <PatientDashboard />}
        </div>
    );
};

const PatientDashboard = () => {
    const { state, currentUser } = useApp();
    const navigate = useNavigate();

    // Secure fallback: If no user is logged in (e.g., refresh), redirect or show empty state
    // For now, we assume ProtectedRoute handles this, but we fallback safely
    const currentPatientId = currentUser?.id;
    const patientName = currentUser?.name || 'Patient';

    const myAppointments = state.appointments
        .filter(apt => apt.patientId === currentPatientId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const upcomingAppointment = myAppointments.find(apt => isFuture(parseISO(apt.date)) && apt.status !== 'Cancelled');

    const getDoctorName = (id) => state.doctors.find(d => d.id === id)?.name || 'Unknown Doctor';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-dark)))',
                borderRadius: '24px',
                padding: '3rem',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        Welcome back, {patientName}
                    </h1>
                    <p style={{ opacity: 0.9, fontSize: '1.1rem', maxWidth: '600px', marginBottom: '2rem' }}>
                        Manage your health journey with ease. Book appointments, view your history, and stay connected with your doctors.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/appointments')}
                            className="btn"
                            style={{
                                background: 'white',
                                color: 'hsl(var(--primary))',
                                padding: '1rem 2rem',
                                fontSize: '1.1rem'
                            }}>
                            <Plus size={20} />
                            Book New Appointment
                        </button>
                        <button
                            onClick={() => navigate('/appointments')}
                            className="btn"
                            style={{
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.4)',
                                backdropFilter: 'blur(10px)'
                            }}>
                            <History size={20} />
                            View History
                        </button>
                    </div>
                </div>
                {/* Abstract decorative circle */}
                <div style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-10%',
                    width: '500px',
                    height: '500px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%',
                    pointerEvents: 'none'
                }} />
            </div>

            {/* Main Content Grid */}
            <div className="grid-cols-2" style={{ gap: 'var(--spacing-lg)' }}>
                {/* Left Column: Upcoming & Actions */}
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>

                    {/* Next Appointment Card */}
                    <div className="card" style={{ borderLeft: '6px solid hsl(var(--accent))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Clock className="text-accent" style={{ color: 'hsl(var(--accent))' }} />
                                Next Appointment
                            </h2>
                            {upcomingAppointment && (
                                <span style={{
                                    background: 'hsl(var(--primary-light))',
                                    color: 'hsl(var(--primary))',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '20px',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}>
                                    Confirmed
                                </span>
                            )}
                        </div>

                        {upcomingAppointment ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{
                                        background: 'hsl(var(--background))',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        textAlign: 'center',
                                        minWidth: '80px'
                                    }}>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                                            {format(parseISO(upcomingAppointment.date), 'd')}
                                        </div>
                                        <div style={{ textTransform: 'uppercase', fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                                            {format(parseISO(upcomingAppointment.date), 'MMM')}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                            Consultation with {getDoctorName(upcomingAppointment.doctorId)}
                                        </h3>
                                        <p style={{ color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={16} />
                                            {format(parseISO(upcomingAppointment.date), 'h:mm a')}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-outline" style={{ width: '100%' }}>Reschedule</button>
                                    <button className="btn btn-outline" style={{ width: '100%', borderColor: 'hsl(var(--danger))', color: 'hsl(var(--danger))' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'hsl(var(--text-muted))' }}>
                                <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No upcoming appointments.</p>
                                <button
                                    onClick={() => navigate('/appointments')}
                                    style={{ marginTop: '1rem', color: 'hsl(var(--primary))', fontWeight: 600 }}>
                                    Schedule one now &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Quick Stats / Info */}
                <div style={{ display: 'grid', gap: 'var(--spacing-lg)', alignContent: 'start' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <QuickActionCard icon={User} label="My Profile" onClick={() => { }} />
                            <QuickActionCard icon={Activity} label="Lab Results" onClick={() => { }} />
                            <QuickActionCard icon={History} label="Past Visits" onClick={() => navigate('/appointments')} />
                            <QuickActionCard icon={Stethoscope} label="Find Doctor" onClick={() => navigate('/doctors')} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StaffDashboard = () => {
    const { state } = useApp();

    const stats = [
        { label: 'Total Doctors', value: state.doctors.length, icon: Stethoscope, color: '217 91% 60%' },
        { label: 'Total Patients', value: state.patients.length, icon: Users, color: '262 83% 58%' },
        { label: 'Appointments Today', value: state.appointments.filter(apt => isToday(parseISO(apt.date))).length, icon: Calendar, color: '35 90% 60%' },
    ];

    const todaysAppointments = state.appointments
        .filter(apt => isToday(parseISO(apt.date)))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    const getDoctorName = (id) => state.doctors.find(d => d.id === id)?.name || 'Unknown';
    const getPatientName = (id) => state.patients.find(p => p.id === id)?.name || 'Unknown';

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                        Staff Dashboard
                    </h1>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Overview of {state.clinicSettings.name}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{format(new Date(), 'EEEE, MMMM do')}</div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid-cols-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                {stats.map((stat) => (
                    <div key={stat.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            padding: '1rem',
                            borderRadius: '12px',
                            background: `hsla(${stat.color}, 0.1)`,
                            color: `hsl(${stat.color})`
                        }}>
                            <stat.icon size={32} />
                        </div>
                        <div>
                            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.value}</div>
                            <div style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', fontWeight: 500 }}>{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid-cols-2" style={{ gridTemplateColumns: '2fr 1fr' }}>

                {/* Today's Schedule */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Today's Schedule</h2>
                        <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>View All</button>
                    </div>

                    {todaysAppointments.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {todaysAppointments.map(apt => (
                                <div key={apt.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'hsl(var(--background))',
                                    borderRadius: '12px',
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.01)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{
                                            fontWeight: 700,
                                            padding: '0.5rem',
                                            background: 'hsl(var(--surface))',
                                            borderRadius: '8px',
                                            minWidth: '80px',
                                            textAlign: 'center',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            {format(parseISO(apt.date), 'h:mm a')}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{getPatientName(apt.patientId)}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))' }}>Dr. {getDoctorName(apt.doctorId)}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <StatusBadge status={apt.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                            No appointments scheduled for today.
                        </div>
                    )}
                </div>

                {/* Quick Actions Panel */}
                <div className="card" style={{ height: 'fit-content' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <StaffActionRow icon={Plus} label="New Appointment" />
                        <StaffActionRow icon={User} label="Register Patient" />
                        <StaffActionRow icon={Stethoscope} label="Manage Doctors" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components

const QuickActionCard = ({ icon: Icon, label, onClick }) => (
    <div
        onClick={onClick}
        style={{
            padding: '1.5rem',
            background: 'hsl(var(--background))',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            border: '1px solid transparent'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
            e.currentTarget.style.background = 'hsl(var(--primary-light))';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.background = 'hsl(var(--background))';
        }}
    >
        <div style={{
            display: 'inline-flex',
            padding: '0.75rem',
            borderRadius: '50%',
            background: 'hsl(var(--surface))',
            color: 'hsl(var(--primary))',
            marginBottom: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
        }}>
            <Icon size={24} />
        </div>
        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</div>
    </div>
);

const StaffActionRow = ({ icon: Icon, label }) => (
    <button style={{
        width: '100%',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'hsl(var(--background))',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        color: 'hsl(var(--text-main))',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--primary-light))'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'hsl(var(--background))'}
    >
        <Icon size={18} />
        {label}
        <ChevronRight size={16} style={{ marginLeft: 'auto', opacity: 0.5 }} />
    </button>
);

const StatusBadge = ({ status }) => {
    const styles = {
        Pending: { bg: '#fef3c7', text: '#d97706' },
        Completed: { bg: '#dcfce7', text: '#16a34a' },
        Cancelled: { bg: '#fee2e2', text: '#dc2626' }
    };
    const style = styles[status] || styles.Pending;

    return (
        <span style={{
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            backgroundColor: style.bg,
            color: style.text
        }}>
            {status}
        </span>
    );
};

export default Dashboard;
