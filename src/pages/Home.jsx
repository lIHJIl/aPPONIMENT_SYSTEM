import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/UI/Toast';
import { Stethoscope, ArrowRight, Shield, Clock, Calendar } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const { login, state, dispatch } = useApp();
    const { addToast } = useToast();
    const [userType, setUserType] = useState('patient'); // 'patient' | 'admin'
    const [mode, setMode] = useState('login'); // 'login' | 'signup'

    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();

        if (userType === 'admin') {
            // Admin Login - Verify via API
            try {
                const res = await fetch('http://localhost:3000/api/admin/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: formData.password }) // Use password field for admin pass
                });

                if (res.ok) {
                    login('admin', { name: 'Admin User', email: 'admin@medicare.com', id: 'admin1' });
                    addToast('Welcome Admin', 'success');
                    navigate('/dashboard');
                } else {
                    addToast('Invalid Admin Password', 'error');
                }
            } catch (err) {
                addToast('Login failed', 'error');
            }
            return;
        }

        // Patient Login/Signup
        if (mode === 'signup') {
            const newPatient = {
                id: Date.now().toString(), // Helper ID, server will assign real UUID
                name: formData.name,
                age: 30, // Default
                gender: 'Other',
                email: formData.email,
                password: formData.password,
                history: []
            };
            try {
                const createdPatient = await dispatch({ type: 'ADD_PATIENT', payload: newPatient });
                if (createdPatient && createdPatient.id) {
                    login('patient', createdPatient);
                    addToast('Account created successfully!', 'success');
                    navigate('/dashboard');
                } else {
                    addToast('Failed to create account. Please try again.', 'error');
                }
            } catch (err) {
                console.error(err);
                addToast('Signup error occurred', 'error');
            }
        } else {
            // Secure Login
            try {
                const res = await fetch('http://localhost:3000/api/login/patient', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, password: formData.password })
                });

                const data = await res.json();

                if (res.ok) {
                    login('patient', data.user);
                    addToast(`Welcome back, ${data.user.name}!`, 'success');
                    navigate('/dashboard');
                } else {
                    addToast(data.error || 'Login failed', 'error');
                }
            } catch (err) {
                addToast('Network error during login', 'error');
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'hsl(var(--background))', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header className="container" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'hsl(var(--primary))', fontWeight: 800, fontSize: '1.5rem' }}>
                    <Stethoscope size={32} />
                    <span>MediCare</span>
                </div>
                <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <a href="#features" style={{ fontWeight: 500, color: 'hsl(var(--text-muted))' }}>Features</a>
                    <a href="#about" style={{ fontWeight: 500, color: 'hsl(var(--text-muted))' }}>About</a>
                    <button
                        onClick={() => document.getElementById('login-card').scrollIntoView({ behavior: 'smooth' })}
                        className="btn btn-outline"
                    >
                        Log In
                    </button>
                </nav>
            </header>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '4rem 0' }}>
                <div className="container grid-cols-2" style={{ alignItems: 'center', gap: '4rem' }}>

                    {/* Left: Text Content */}
                    <div>
                        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem', background: 'linear-gradient(135deg, hsl(var(--primary-dark)), hsl(var(--primary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Your Health,<br />Simplified.
                        </h1>
                        <p style={{ fontSize: '1.25rem', color: 'hsl(var(--text-muted))', marginBottom: '2.5rem', lineHeight: 1.6 }}>
                            Book appointments with top specialists in seconds. Secure, fast, and built for your peace of mind.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'hsl(var(--surface))', padding: '0.5rem 1rem', borderRadius: '50px', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ width: '10px', height: '10px', background: 'hsl(var(--success))', borderRadius: '50%' }} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Available Now</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Login Card */}
                    <div id="login-card" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div className="card" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>Welcome Back</h2>
                                <p style={{ color: 'hsl(var(--text-muted))' }}>Select your role to continue</p>
                            </div>

                            {/* User Type Toggle */}
                            <div style={{ display: 'flex', background: 'hsl(var(--background))', padding: '0.25rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
                                <button
                                    onClick={() => setUserType('patient')}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 600, transition: 'all 0.2s', background: userType === 'patient' ? 'white' : 'transparent', boxShadow: userType === 'patient' ? 'var(--shadow-sm)' : 'none', color: userType === 'patient' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }}>
                                    Patient
                                </button>
                                <button
                                    onClick={() => {
                                        setUserType('admin');
                                        setMode('login');
                                    }}
                                    style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 600, transition: 'all 0.2s', background: userType === 'admin' ? 'white' : 'transparent', boxShadow: userType === 'admin' ? 'var(--shadow-sm)' : 'none', color: userType === 'admin' ? 'hsl(var(--primary))' : 'hsl(var(--text-muted))' }}>
                                    Staff / Admin
                                </button>
                            </div>

                            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {mode === 'signup' && userType === 'patient' && (
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                    />
                                )}
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                                />

                                <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', padding: '1rem' }}>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                                </button>
                            </form>

                            {userType === 'patient' && (
                                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
                                    {mode === 'login' ? (
                                        <>New to MediCare? <button onClick={() => setMode('signup')} style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Create an account</button></>
                                    ) : (
                                        <>Already have an account? <button onClick={() => setMode('login')} style={{ color: 'hsl(var(--primary))', fontWeight: 600 }}>Log in</button></>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Features (Bottom) */}
            <div id="features" style={{ background: 'hsl(var(--surface))', padding: '4rem 0' }}>
                <div className="container grid-cols-3" style={{ gap: '2rem' }}>
                    <FeatureCard icon={Clock} title="Fast Booking" text="Book appointments in less than 60 seconds." />
                    <FeatureCard icon={Shield} title="Secure Records" text="Your medical history is safe and private." />
                    <FeatureCard icon={Calendar} title="24/7 Access" text="Manage your schedule anytime, anywhere." />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, text }) => (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'hsl(var(--primary-light))', color: 'hsl(var(--primary))', borderRadius: '50%', marginBottom: '1rem' }}>
            <Icon size={32} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'hsl(var(--text-muted))' }}>{text}</p>
    </div>
);

export default Home;
