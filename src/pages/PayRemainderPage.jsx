import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/UI/Toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const PayRemainderPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, dispatch } = useApp();
    const { addToast } = useToast();
    
    const stripe = useStripe();
    const elements = useElements();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${API_BASE}/appointments/${id}/payment`, {
                    signal: controller.signal
                });
                if (!res.ok) throw new Error('Failed to fetch appointment data');
                const data = await res.json();
                
                if (data.payment_status !== 'partial') {
                    addToast('This appointment is not partially paid.', 'warning');
                    navigate('/appointments');
                    return;
                }
                
                setAppointment(data);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    addToast(err.message, 'error');
                    navigate('/appointments');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
        return () => controller.abort();
    }, [id, navigate, addToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setErrorMsg('');
        setProcessing(true);

        try {
            const res = await fetch(`${API_BASE}/payments/pay-remainder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointment_id: id, user_id: currentUser?.id })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create payment intent');

            const cardElement = elements.getElement(CardElement);
            const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
                payment_method: { card: cardElement }
            });

            if (error) {
                setErrorMsg(error.message);
                setProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                addToast('Payment successful! Your balance is now zero.', 'success');
                dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: { id, status: 'Confirmed' } });
                navigate('/appointments'); 
            }
        } catch (err) {
            setErrorMsg(err.message);
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading details...</div>;
    if (!appointment) return null;

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="card">
                <div className="page-header">
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Pay Outstanding Balance</h1>
                </div>

                <div style={{ background: 'hsl(var(--surface))', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Balance Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Total Fee:</span>
                        <span>₹{appointment.total_fee.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'hsl(var(--text-muted))' }}>Amount Paid:</span>
                        <span>₹{appointment.amount_paid.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid hsl(var(--border))' }}>
                        <span style={{ color: 'hsl(var(--warning))' }}>Balance Due:</span>
                        <span style={{ color: 'hsl(var(--warning))' }}>₹{appointment.balance_due.toFixed(2)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ border: '1px solid hsl(var(--border))', padding: '1rem', borderRadius: '8px', background: 'hsl(var(--surface))' }}>
                        <CardElement options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: document.documentElement.classList.contains('dark') ? '#fff' : '#1a1f2c',
                                    '::placeholder': { color: '#aab7c4' },
                                },
                                invalid: { color: '#ef4444' }
                            }
                        }} />
                    </div>

                    {errorMsg && <div style={{ color: 'hsl(var(--danger))', fontSize: '0.875rem' }}>{errorMsg}</div>}

                    <div className="form-row" style={{ marginTop: '1rem' }}>
                        <button type="button" onClick={() => navigate('/appointments')} disabled={processing} className="btn" style={{ flex: 1, border: '1px solid currentColor' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={!stripe || processing} className="btn btn-primary" style={{ flex: 1 }}>
                            {processing ? 'Processing...' : `Pay ₹${appointment.balance_due.toFixed(2)}`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PayRemainderPage;
