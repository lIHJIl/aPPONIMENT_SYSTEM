import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/UI/Toast';
import SlotHoldTimer from '../components/UI/SlotHoldTimer';
import { Calendar, User, DollarSign } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const PaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser, state, dispatch } = useApp();
    const { addToast } = useToast();
    
    const stripe = useStripe();
    const elements = useElements();

    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [paymentOption, setPaymentOption] = useState('full');
    const [depositAmount, setDepositAmount] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [expired, setExpired] = useState(false);
    const [doctorName, setDoctorName] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        const fetchDetails = async () => {
            try {
                const res = await fetch(`${API_BASE}/appointments/${id}/payment`, {
                    signal: controller.signal
                });
                if (!res.ok) throw new Error('Failed to fetch appointment data');
                const data = await res.json();
                
                if (data.booking_status !== 'pending_payment') {
                    addToast('This appointment is already confirmed or cancelled.', 'warning');
                    navigate('/appointments');
                    return;
                }
                
                setAppointment(data);
                setDepositAmount((data.total_fee * 0.2).toFixed(2));
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

    useEffect(() => {
        if (state.appointments.length > 0 && appointment) {
            const apt = state.appointments.find(a => a.id === id);
            if (apt) {
                const doc = state.doctors.find(d => d.id === apt.doctorId);
                if (doc) setDoctorName(doc.name);
            }
        }
    }, [state.appointments, state.doctors, appointment, id]);

    const handleExpire = () => {
        setExpired(true);
        setErrorMsg('Your slot reservation has expired. Please start a new booking.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || expired) return;

        setErrorMsg('');
        
        let amountToPay = 0;
        const totalFee = appointment.total_fee;

        if (paymentOption === 'full') {
            amountToPay = totalFee * 100;
        } else {
            const deposit = parseFloat(depositAmount);
            if (isNaN(deposit) || deposit < totalFee * 0.2 || deposit >= totalFee) {
                setErrorMsg(`Deposit must be between ₹${(totalFee * 0.2).toFixed(2)} and ₹${(totalFee - 0.01).toFixed(2)}`);
                return;
            }
            amountToPay = Math.round(deposit * 100);
        }

        setProcessing(true);

        try {
            const res = await fetch(`${API_BASE}/payments/create-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointment_id: id,
                    user_id: currentUser?.id,
                    payment_type: paymentOption,
                    amount: amountToPay
                })
            });

            const data = await res.json();
            if (!res.ok) {
                if (res.status === 410) {
                    handleExpire();
                    return;
                }
                throw new Error(data.error || 'Failed to create payment intent');
            }

            const cardElement = elements.getElement(CardElement);
            const { error, paymentIntent } = await stripe.confirmCardPayment(data.client_secret, {
                payment_method: { card: cardElement }
            });

            if (error) {
                setErrorMsg(error.message);
                setProcessing(false);
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                addToast('Payment successful! Your appointment is confirmed.', 'success');
                dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: { id, status: 'Confirmed' } });
                
                navigate(`/booking-confirmed/${id}`, {
                   state: { 
                       doctorName, 
                       date: state.appointments.find(a => a.id === id)?.date, 
                       amountPaid: amountToPay / 100, 
                       balanceDue: totalFee - (amountToPay / 100) 
                   } 
                });
            }
        } catch (err) {
            setErrorMsg(err.message);
            setProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm("Are you sure you want to cancel? Your reserved slot will be released.")) return;
        
        try {
            const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to cancel');
            dispatch({ type: 'DELETE_APPOINTMENT', payload: id });
            addToast('Slot released successfully.', 'info');
            navigate('/appointments');
        } catch (err) {
            addToast(err.message, 'error');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading payment details...</div>;
    if (!appointment) return null;

    const aptDetails = state.appointments.find(a => a.id === id);

    return (
        <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="card">
                <div className="page-header">
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Secure Checkout</h1>
                </div>

                {!expired && aptDetails && aptDetails.createdAt && (
                    <SlotHoldTimer expiresAt={new Date(new Date(aptDetails.createdAt).getTime() + 10 * 60000).toISOString()} onExpire={handleExpire} />
                )}

                <div style={{ background: 'hsl(var(--surface))', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Booking Summary</h3>
                    {doctorName && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}><User size={18}/> Doctor: Dr. {doctorName}</div>}
                    {aptDetails && <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}><Calendar size={18}/> Date: {new Date(aptDetails.date).toLocaleString()}</div>}
                    <div style={{ display: 'flex', gap: '0.5rem', fontWeight: 600 }}><DollarSign size={18}/> Consultation Fee: ₹{appointment.total_fee.toFixed(2)}</div>
                </div>

                {expired ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ color: 'hsl(var(--danger))', fontWeight: 600, marginBottom: '1rem' }}>{errorMsg}</div>
                        <button onClick={() => navigate('/appointments')} className="btn btn-primary">Start New Booking</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" name="paymentOption" value="full" checked={paymentOption === 'full'} onChange={() => setPaymentOption('full')} />
                                <span style={{ fontWeight: 500 }}>Pay in Full (₹{appointment.total_fee.toFixed(2)})</span>
                            </label>
                            
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input type="radio" name="paymentOption" value="partial" checked={paymentOption === 'partial'} onChange={() => setPaymentOption('partial')} />
                                <span style={{ fontWeight: 500 }}>Pay a Deposit (min 20%)</span>
                            </label>

                            {paymentOption === 'partial' && (
                                <div style={{ marginLeft: '1.5rem', background: 'hsl(var(--surface))', padding: '1rem', borderRadius: '8px' }}>
                                    <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Deposit Amount (₹)</label>
                                    <input 
                                        type="number" 
                                        min={(appointment.total_fee * 0.2).toFixed(2)} 
                                        max={(appointment.total_fee - 0.01).toFixed(2)} 
                                        step="0.01"
                                        value={depositAmount} 
                                        onChange={(e) => setDepositAmount(e.target.value)} 
                                        style={{ width: '100px', padding: '0.5rem', borderRadius: '6px', border: '1px solid hsl(var(--border))' }}
                                        required
                                    />
                                    <p style={{ fontSize: '0.875rem', color: 'hsl(var(--text-muted))', marginTop: '0.75rem' }}>
                                        Remaining balance (₹{(appointment.total_fee - (parseFloat(depositAmount) || 0)).toFixed(2)}) can be paid any time before your appointment.
                                    </p>
                                </div>
                            )}
                        </div>

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
                            <button type="button" onClick={handleCancel} disabled={processing} className="btn" style={{ flex: 1, border: '1px solid currentColor' }}>
                                Cancel
                            </button>
                            <button type="submit" disabled={!stripe || processing} className="btn btn-primary" style={{ flex: 1 }}>
                                {processing ? 'Processing...' : 'Pay & Confirm Booking'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PaymentPage;
