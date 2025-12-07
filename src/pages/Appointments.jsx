import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';
import { format, parseISO, isSameMinute, addMinutes, parse, isWithinInterval } from 'date-fns';

const Appointments = () => {
    const { state, dispatch, userRole } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        doctorId: '',
        patientId: '',
        date: '',
        reason: ''
    });

    const getDoctorName = (id) => state.doctors.find(d => d.id === id)?.name || 'Unknown Doctor';
    const getPatientName = (id) => state.patients.find(p => p.id === id)?.name || 'Unknown Patient';

    const checkAvailability = (doctorId, date) => {
        // Simple 30 min slot check
        const newDate = new Date(date);
        return !state.appointments.some(apt => {
            if (apt.doctorId !== doctorId || apt.status === 'Cancelled') return false;
            const aptDate = new Date(apt.date);
            // Check if within slotDuration of an existing appointment
            const duration = state.clinicSettings.slotDuration || 30;
            const diff = Math.abs(newDate - aptDate) / (1000 * 60);
            return diff < duration;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const selectedDate = new Date(formData.date);
        const now = new Date();

        if (selectedDate < now) {
            alert('Cannot book appointments in the past.');
            return;
        }

        const { breakStart, breakEnd } = state.clinicSettings;
        if (breakStart && breakEnd) {
            const appointmentTime = parse(format(selectedDate, 'HH:mm'), 'HH:mm', new Date());
            const bStart = parse(breakStart, 'HH:mm', new Date());
            const bEnd = parse(breakEnd, 'HH:mm', new Date());

            if (isWithinInterval(appointmentTime, { start: bStart, end: bEnd })) {
                alert(`Cannot book during break hours (${breakStart} - ${breakEnd}).`);
                return;
            }
        }

        if (!checkAvailability(formData.doctorId, formData.date)) {
            const duration = state.clinicSettings.slotDuration || 30;
            alert(`Doctor is not available at this time (${duration} min slot conflict).`);
            return;
        }
        dispatch({ type: 'ADD_APPOINTMENT', payload: formData });
        setIsModalOpen(false);
        setFormData({ doctorId: '', patientId: '', date: '', reason: '' });
    };

    const handleStatusChange = (id, status) => {
        dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: { id, status } });
    };

    const handleDelete = (id) => {
        if (confirm('Delete this appointment record?')) {
            dispatch({ type: 'DELETE_APPOINTMENT', payload: id });
        }
    };

    const statusColors = {
        Pending: 'text-yellow-600 bg-yellow-100',
        Completed: 'text-green-600 bg-green-100',
        Cancelled: 'text-red-600 bg-red-100'
    };

    // Sort: Pending first, then by date
    const sortedAppointments = [...state.appointments].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(b.date) - new Date(a.date);
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Appointments</h1>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Schedule and manage visits</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} />
                    New Appointment
                </button>
            </div>

            <div style={{ background: 'hsl(var(--surface))', borderRadius: '12px', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Date & Time</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Patient</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Doctor</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAppointments.map(apt => (
                            <tr key={apt.id}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{format(parseISO(apt.date), 'MMM d, yyyy')}</div>
                                    <div style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={14} /> {format(parseISO(apt.date), 'p')}
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>{getPatientName(apt.patientId)}</td>
                                <td style={{ padding: '1rem' }}>{getDoctorName(apt.doctorId)}</td>
                                <td style={{ padding: '1rem' }}>
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
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {userRole === 'admin' && (
                                            <>
                                                {apt.status === 'Pending' && (
                                                    <>
                                                        <button title="Complete" onClick={() => handleStatusChange(apt.id, 'Completed')} className="btn" style={{ padding: '0.25rem', color: 'hsl(var(--success))' }}>
                                                            <CheckCircle size={18} />
                                                        </button>
                                                        <button title="Cancel" onClick={() => handleStatusChange(apt.id, 'Cancelled')} className="btn" style={{ padding: '0.25rem', color: 'hsl(var(--danger))' }}>
                                                            <XCircle size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button title="Delete" onClick={() => handleDelete(apt.id)} className="btn" style={{ padding: '0.25rem', color: '#9ca3af' }}>
                                                    <Trash2 size={18} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {sortedAppointments.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                                    No appointments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Book Appointment"
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Patient</label>
                        <select
                            required
                            value={formData.patientId}
                            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                        >
                            <option value="">Select Patient</option>
                            {state.patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Doctor</label>
                        <select
                            required
                            value={formData.doctorId}
                            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                        >
                            <option value="">Select Doctor</option>
                            {state.doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialty})</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Date</label>
                        <input
                            required
                            type="date"
                            min={new Date().toISOString().slice(0, 10)}
                            value={formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : ''}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value ? new Date(`${e.target.value}T00:00`).toISOString() : '' })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1rem' }}
                        />
                    </div>

                    {formData.date && formData.doctorId && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Select Time Slot ({state.clinicSettings.slotDuration || 30} mins)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
                                {(() => {
                                    const slots = [];
                                    const { workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration = 30 } = state.clinicSettings;
                                    const dateStr = format(new Date(formData.date), 'yyyy-MM-dd');

                                    let start = parse(workingHoursStart, 'HH:mm', new Date(formData.date));
                                    const end = parse(workingHoursEnd, 'HH:mm', new Date(formData.date));
                                    const bStart = breakStart ? parse(breakStart, 'HH:mm', new Date(formData.date)) : null;
                                    const bEnd = breakEnd ? parse(breakEnd, 'HH:mm', new Date(formData.date)) : null;

                                    while (start < end) {
                                        const timeStr = format(start, 'HH:mm');
                                        const slotTimeISO = `${dateStr}T${timeStr}`; // Construct ISO string manually to match format

                                        // Check Availability
                                        const isBreak = bStart && bEnd && isWithinInterval(addMinutes(start, 1), { start: bStart, end: bEnd });

                                        const isBooked = state.appointments.some(apt => {
                                            if (apt.doctorId !== formData.doctorId || apt.status === 'Cancelled') return false;
                                            const aptDate = new Date(apt.date);
                                            const slotDate = new Date(slotTimeISO);
                                            // Check for exact match or overlap
                                            return Math.abs(slotDate - aptDate) < (slotDuration * 60 * 1000);
                                        });

                                        const isPast = new Date(slotTimeISO) < new Date();
                                        const isDisabled = isBreak || isBooked || isPast;
                                        const isSelected = formData.date && format(new Date(formData.date), 'HH:mm') === timeStr;

                                        slots.push(
                                            <button
                                                key={timeStr}
                                                type="button"
                                                disabled={isDisabled}
                                                onClick={() => setFormData({ ...formData, date: slotTimeISO })}
                                                className={isDisabled ? '' : 'btn'}
                                                style={{
                                                    padding: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    borderRadius: '6px',
                                                    backgroundColor: isSelected ? 'hsl(var(--primary))' : isDisabled ? 'hsla(var(--text-muted), 0.1)' : 'hsl(var(--surface))',
                                                    color: isSelected ? 'white' : isDisabled ? 'hsl(var(--text-muted))' : 'hsl(var(--text-main))',
                                                    border: isSelected ? 'none' : '1px solid hsla(var(--text-muted), 0.2)',
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {timeStr}
                                            </button>
                                        );

                                        start = addMinutes(start, slotDuration);
                                    }
                                    return slots.length > 0 ? slots : <div style={{ gridColumn: 'span 4', textAlign: 'center', color: '#888' }}>No details available. Check clinic settings.</div>;
                                })()}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, border: '1px solid #ddd' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Book Appointment</button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Appointments;
