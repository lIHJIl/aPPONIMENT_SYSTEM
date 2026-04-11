import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, Calendar, ArrowRight } from 'lucide-react';

const BookingConfirmedPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // The payment page can pass the stats via state, or we could fetch them. In this simple version we'll just read from state if passed.
    const state = location.state || {};
    const { doctorName, date, amountPaid, balanceDue } = state;

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
            <div className="card" style={{ padding: '3rem 2rem' }}>
                <div style={{
                    width: '80px', height: '80px',
                    borderRadius: '50%',
                    background: 'hsl(var(--success) / 0.1)',
                    color: 'hsl(var(--success))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <CheckCircle size={40} />
                </div>

                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Appointment Confirmed</h1>
                <p style={{ color: 'hsl(var(--text-muted))', fontSize: '1.1rem', marginBottom: '2rem' }}>
                    A confirmation has been sent to your email.
                </p>

                <div style={{
                    background: 'hsl(var(--surface))',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    textAlign: 'left',
                    marginBottom: '2rem'
                }}>
                    {doctorName && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>Doctor:</span>
                            <span style={{ fontWeight: 600 }}>Dr. {doctorName}</span>
                        </div>
                    )}
                    {date && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>Date/Time:</span>
                            <span style={{ fontWeight: 600 }}>{new Date(date).toLocaleString()}</span>
                        </div>
                    )}
                    {amountPaid !== undefined && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ color: 'hsl(var(--text-muted))' }}>Amount Paid:</span>
                            <span style={{ fontWeight: 600 }}>₹{amountPaid.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {balanceDue > 0 && (
                    <div style={{
                        padding: '1rem',
                        background: 'hsl(var(--warning) / 0.1)',
                        borderLeft: '4px solid hsl(var(--warning))',
                        borderRadius: '0 8px 8px 0',
                        marginBottom: '2rem',
                        textAlign: 'left'
                    }}>
                        <div style={{ fontWeight: 600, color: 'hsl(var(--warning))' }}>Outstanding Balance: ₹{balanceDue.toFixed(2)}</div>
                        <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                            You can pay this any time from your appointments page before your visit.
                        </p>
                    </div>
                )}

                <button 
                    onClick={() => navigate('/appointments')} 
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
                >
                    View My Appointments
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default BookingConfirmedPage;
