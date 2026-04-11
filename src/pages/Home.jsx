import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/UI/Toast';
import { Stethoscope, ArrowRight, Shield, Clock, Calendar, Activity, Users, Star } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/* ─── Mystify canvas — Screensaver-style bouncing polygon trails ─────── */
// Colours matched to the site's blue/purple/rose palette.
const PALETTE = [
    [99,  179, 237],   // --primary  (cornflower blue)
    [154, 117, 234],   // --secondary (vibid purple)
    [236, 100, 160],   // --accent   (rose)
    [72,  199, 142],   // --success  (emerald)
    [129, 161, 243],   // lighter primary tint
];

const POLYGON_SIDES = 5;          // vertices per polygon
const NUM_POLYGONS  = 3;          // count of independent polygons
const TRAIL_LEN     = 18;         // frames of history kept
const SPEED         = 1.4;        // pixel-per-frame max

/** Build one vertex with a random position & velocity */
const makeVertex = (w, h) => ({
    x:  Math.random() * w,
    y:  Math.random() * h,
    vx: (Math.random() - 0.5) * SPEED * 2,
    vy: (Math.random() - 0.5) * SPEED * 2,
});

/** Build one polygon — array of vertices */
const makePolygon = (w, h) =>
    Array.from({ length: POLYGON_SIDES }, () => makeVertex(w, h));

/** Step one vertex, bounce off walls */
const stepVertex = (v, w, h) => {
    let { x, y, vx, vy } = v;
    x += vx; y += vy;
    if (x < 0 || x > w) { vx *= -1; x = Math.max(0, Math.min(w, x)); }
    if (y < 0 || y > h) { vy *= -1; y = Math.max(0, Math.min(h, y)); }
    return { x, y, vx, vy };
};

/** Draw one historical frame's polygon outline */
const drawPolyFrame = (ctx, vertices, alpha, rgb) => {
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) ctx.lineTo(vertices[i].x, vertices[i].y);
    ctx.closePath();
    ctx.strokeStyle = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
};

const MystifyCanvas = () => {
    const canvasRef = useRef(null);
    const stateRef  = useRef(null);   // mutable animation state, no re-renders
    const rafRef    = useRef(null);

    const initState = useCallback((w, h) => ({
        polygons: Array.from({ length: NUM_POLYGONS }, () => ({
            vertices: makePolygon(w, h),
            trail:    [],
            colorIdx: Math.floor(Math.random() * PALETTE.length),
        })),
    }), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
            canvas.width  = w;
            canvas.height = h;
            stateRef.current = initState(w, h);
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas.parentElement);

        const tick = () => {
            if (document.hidden) { rafRef.current = requestAnimationFrame(tick); return; }
            const { width: w, height: h } = canvas;
            const { polygons } = stateRef.current;

            ctx.clearRect(0, 0, w, h);

            polygons.forEach(poly => {
                // Push current vertices into trail, cap length
                poly.trail.push(poly.vertices.map(v => ({ ...v })));
                if (poly.trail.length > TRAIL_LEN) poly.trail.shift();

                // Draw trail oldest → newest, fading in
                const rgb = PALETTE[poly.colorIdx];
                poly.trail.forEach((frame, i) => {
                    const alpha = ((i + 1) / TRAIL_LEN) * 0.55;
                    drawPolyFrame(ctx, frame, alpha, rgb);
                });

                // Advance vertices
                poly.vertices = poly.vertices.map(v => stepVertex(v, w, h));

                // Cycle color every ~300 frames
                if (Math.random() < 0.003) poly.colorIdx = (poly.colorIdx + 1) % PALETTE.length;
            });

            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [initState]);

    return (
        <canvas
            ref={canvasRef}
            aria-hidden="true"
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.55,
            }}
        />
    );
};

/* ─── Floating stat pill ─────────────────────────────────────────────── */
const StatPill = ({ value, label, delay = '0s' }) => (
    <div className="stat-pill" style={{ animationDelay: delay }}>
        <span className="stat-pill__value">{value}</span>
        <span className="stat-pill__label">{label}</span>
    </div>
);

/* ─── Feature card ───────────────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, title, text, delay = '0s' }) => (
    <div className="feature-card" style={{ animationDelay: delay }}>
        <div className="feature-card__icon">
            <Icon size={26} />
        </div>
        <h3 className="feature-card__title">{title}</h3>
        <p className="feature-card__text">{text}</p>
    </div>
);

/* ─── Main component ─────────────────────────────────────────────────── */
const Home = () => {
    const navigate = useNavigate();
    const { login, dispatch } = useApp();
    const { addToast } = useToast();
    const [userType, setUserType] = useState('patient');
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slight mount delay so the entrance animation starts after paint
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        if (userType === 'admin') {
            try {
                const res = await fetch(`${API_BASE}/admin/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: formData.password }),
                });
                if (res.ok) {
                    const data = await res.json();
                    login('admin', { name: 'Admin User', email: 'admin@medicare.com', id: 'admin1' }, data.token);
                    addToast('Welcome Admin', 'success');
                    navigate('/dashboard');
                } else {
                    addToast('Invalid Admin Password', 'error');
                }
            } catch {
                addToast('Login failed', 'error');
            }
            setSubmitting(false);
            return;
        }

        if (mode === 'signup') {
            const newPatient = {
                id: Date.now().toString(),
                name: formData.name,
                age: 30,
                gender: 'Other',
                email: formData.email,
                password: formData.password,
                history: [],
            };
            try {
                const created = await dispatch({ type: 'ADD_PATIENT', payload: newPatient });
                if (created?.id) {
                    addToast('Account created! Please log in.', 'success');
                    setMode('login');
                } else {
                    addToast('Failed to create account.', 'error');
                }
            } catch {
                addToast('Signup error occurred', 'error');
            }
        } else {
            try {
                const res = await fetch(`${API_BASE}/login/patient`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email, password: formData.password }),
                });
                const data = await res.json();
                if (res.ok) {
                    login('patient', data.user, data.token);
                    addToast(`Welcome back, ${data.user.name}!`, 'success');
                    navigate('/dashboard');
                } else {
                    addToast(data.error || 'Login failed', 'error');
                }
            } catch {
                addToast('Network error during login', 'error');
            }
        }
        setSubmitting(false);
    };

    return (
        <div className={`home-root${visible ? ' home-root--visible' : ''}`}>

            {/* ── Header ─────────────────────────────────────────── */}
            <header className="home-header">
                <div className="home-brand">
                    <Stethoscope size={30} />
                    <span>MediCare</span>
                </div>
                <nav className="home-nav">
                    <a href="#features" className="home-nav__link">Features</a>
                    <a href="#stats" className="home-nav__link">About</a>
                    <button
                        className="btn btn-outline home-nav__cta"
                        onClick={() => document.getElementById('login-card').scrollIntoView({ behavior: 'smooth' })}
                    >
                        Log In
                    </button>
                </nav>
            </header>

            {/* ── Hero (Mystify canvas lives here, clipped to upper half) ── */}
            <main className="home-hero">
                {/* Canvas fills the hero container only */}
                <MystifyCanvas />
                {/* Left column */}
                <div className="home-hero__left">
                    <div className="home-hero__badge">
                        <span className="home-hero__dot" />
                        Available 24 / 7
                    </div>

                    <h1 className="home-hero__heading">
                        Your Health,<br />
                        <span className="home-hero__heading-accent">Simplified.</span>
                    </h1>

                    <p className="home-hero__subtext">
                        Book appointments with top specialists in seconds.
                        Secure, fast, and built for your peace of mind.
                    </p>

                    <div className="home-hero__pills" id="stats">
                        <StatPill value="500+" label="Patients" delay="0.1s" />
                        <StatPill value="50+"  label="Doctors"  delay="0.2s" />
                        <StatPill value="4.9★" label="Rating"   delay="0.3s" />
                    </div>
                </div>

                {/* Right column — login card */}
                <div id="login-card" className="home-hero__right">
                    <div className="home-card">
                        {/* Decorative top bar */}
                        <div className="home-card__bar" />

                        <div className="home-card__header">
                            <h2 className="home-card__title">
                                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                            </h2>
                            <p className="home-card__subtitle">Select your role to continue</p>
                        </div>

                        {/* Role toggle */}
                        <div className="home-toggle">
                            <button
                                className={`home-toggle__btn${userType === 'patient' ? ' home-toggle__btn--active' : ''}`}
                                onClick={() => setUserType('patient')}
                            >
                                Patient
                            </button>
                            <button
                                className={`home-toggle__btn${userType === 'admin' ? ' home-toggle__btn--active' : ''}`}
                                onClick={() => { setUserType('admin'); setMode('login'); }}
                            >
                                Staff / Admin
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="home-form">
                            {mode === 'signup' && userType === 'patient' && (
                                <div className="home-form__field home-form__field--enter">
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="home-form__input"
                                    />
                                </div>
                            )}
                            <div className="home-form__field">
                                <input
                                    type="email"
                                    placeholder={userType === 'admin' ? 'Admin email (optional)' : 'Email Address'}
                                    required={userType !== 'admin'}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="home-form__input"
                                />
                            </div>
                            <div className="home-form__field">
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="home-form__input"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="btn btn-primary home-form__submit"
                            >
                                {submitting ? (
                                    <span className="home-form__spinner" />
                                ) : (
                                    <>
                                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </form>

                        {userType === 'patient' && (
                            <p className="home-card__switch">
                                {mode === 'login' ? (
                                    <>New to MediCare?{' '}
                                        <button onClick={() => setMode('signup')} className="home-card__switch-btn">
                                            Create an account
                                        </button>
                                    </>
                                ) : (
                                    <>Already have an account?{' '}
                                        <button onClick={() => setMode('login')} className="home-card__switch-btn">
                                            Log in
                                        </button>
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </main>

            {/* ── Features ───────────────────────────────────────── */}
            <section id="features" className="home-features">
                <div className="home-features__inner">
                    <h2 className="home-features__heading">Everything you need, nothing you don't</h2>
                    <p className="home-features__sub">Designed for patients and staff who value their time.</p>
                    <div className="home-features__grid">
                        <FeatureCard icon={Clock}     title="Fast Booking"     text="Book appointments in under 60 seconds with real-time slot availability." delay="0s"   />
                        <FeatureCard icon={Shield}    title="Secure Records"   text="Military-grade encryption keeps your medical history safe and private."  delay="0.08s" />
                        <FeatureCard icon={Calendar}  title="24 / 7 Access"    text="Manage your schedule from any device, any time, anywhere."              delay="0.16s" />
                        <FeatureCard icon={Activity}  title="Live Updates"     text="Real-time notifications keep you informed every step of the way."       delay="0.24s" />
                        <FeatureCard icon={Users}     title="Expert Doctors"   text="Browse verified specialists across multiple disciplines."                delay="0.32s" />
                        <FeatureCard icon={Star}      title="Rated 4.9 / 5"    text="Trusted by thousands of patients across the country."                   delay="0.40s" />
                    </div>
                </div>
            </section>

            {/* ── Footer ─────────────────────────────────────────── */}
            <footer className="home-footer">
                <span className="home-brand" style={{ fontSize: '1rem' }}>
                    <Stethoscope size={18} /> MediCare
                </span>
                <p>Body is just an arrangement of bones held together by flesh and blood, what makes it alive is the soul 🩺✨</p>
            </footer>
        </div>
    );
};

export default Home;
