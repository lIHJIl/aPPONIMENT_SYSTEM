import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

const AppContext = createContext();

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const initialState = {
    doctors: [],
    patients: [],
    appointments: [],
    clinicSettings: {
        name: 'MediCare Clinic',
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00',
        breakStart: '13:00',
        breakEnd: '14:00'
    }
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'SET_INITIAL_DATA':
            return { ...state, ...action.payload };

        case 'ADD_DOCTOR':
            return { ...state, doctors: [...state.doctors, action.payload] };
        case 'UPDATE_DOCTOR':
            return {
                ...state,
                doctors: state.doctors.map(doc => doc.id === action.payload.id ? action.payload : doc)
            };
        case 'DELETE_DOCTOR':
            return {
                ...state,
                doctors: state.doctors.filter(doc => doc.id !== action.payload)
            };

        case 'ADD_PATIENT':
            return { ...state, patients: [...state.patients, action.payload] };
        case 'UPDATE_PATIENT':
            return {
                ...state,
                patients: state.patients.map(p => p.id === action.payload.id ? action.payload : p)
            };
        case 'DELETE_PATIENT':
            return {
                ...state,
                patients: state.patients.filter(p => p.id !== action.payload)
            };

        case 'ADD_APPOINTMENT':
            return { ...state, appointments: [...state.appointments, action.payload] };
        case 'UPDATE_APPOINTMENT_STATUS':
            return {
                ...state,
                appointments: state.appointments.map(apt =>
                    apt.id === action.payload.id ? { ...apt, status: action.payload.status } : apt
                )
            };
        case 'DELETE_APPOINTMENT':
            return {
                ...state,
                appointments: state.appointments.filter(apt => apt.id !== action.payload)
            };

        case 'UPDATE_SETTINGS':
            return { ...state, clinicSettings: action.payload };

        default:
            return state;
    }
};

export const AppProvider = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [loading, setLoading] = useState(true);

    const [token, setToken] = useState(() => localStorage.getItem('token') || null);

    const authFetch = (url, options = {}) => {
        const headers = { ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(url, { ...options, headers });
    };

    const fetchData = async (signal) => {
        try {
            setLoading(true);
            const [doctorsRes, patientsRes, appointmentsRes, settingsRes] = await Promise.all([
                authFetch(`${API_BASE}/doctors`, { signal }),
                authFetch(`${API_BASE}/patients`, { signal }),
                authFetch(`${API_BASE}/appointments`, { signal }),
                authFetch(`${API_BASE}/settings`, { signal })
            ]);

            const doctors = await doctorsRes.json();
            const patients = await patientsRes.json();
            const appointments = await appointmentsRes.json();
            const settings = await settingsRes.json();

            // Check for errors in response (assuming server returns {error: ...} on failure, but Promise.all throws on network error)
            // If server returns array, it's good.

            dispatch({
                type: 'SET_INITIAL_DATA',
                payload: {
                    doctors: Array.isArray(doctors) ? doctors : [],
                    patients: Array.isArray(patients) ? patients : [],
                    appointments: Array.isArray(appointments) ? appointments : [],
                    clinicSettings: settings.error ? initialState.clinicSettings : settings
                }
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Failed to fetch data:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [token]); // Refetch if token changes

    // Async Dispatch Wrapper
    const asyncDispatch = async (action) => {
        try {
            let response;
            let data;

            switch (action.type) {
                // --- DOCTORS ---
                case 'ADD_DOCTOR':
                    response = await authFetch(`${API_BASE}/doctors`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'ADD_DOCTOR', payload: data }); // content from server with ID
                    return data;

                case 'UPDATE_DOCTOR':
                    response = await authFetch(`${API_BASE}/doctors/${action.payload.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'UPDATE_DOCTOR', payload: data });
                    return data;

                case 'DELETE_DOCTOR':
                    response = await authFetch(`${API_BASE}/doctors/${action.payload}`, { method: 'DELETE' });
                    if (response.ok) dispatch({ type: 'DELETE_DOCTOR', payload: action.payload });
                    break;

                // --- PATIENTS ---
                case 'ADD_PATIENT':
                    response = await authFetch(`${API_BASE}/patients`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'ADD_PATIENT', payload: data });
                    return data;

                case 'UPDATE_PATIENT':
                    response = await authFetch(`${API_BASE}/patients/${action.payload.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'UPDATE_PATIENT', payload: data });
                    return data;

                case 'DELETE_PATIENT':
                    response = await authFetch(`${API_BASE}/patients/${action.payload}`, { method: 'DELETE' });
                    if (response.ok) dispatch({ type: 'DELETE_PATIENT', payload: action.payload });
                    break;

                // --- APPOINTMENTS ---
                case 'ADD_APPOINTMENT':
                    response = await authFetch(`${API_BASE}/appointments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'ADD_APPOINTMENT', payload: data });
                    return data;

                // SPECIAL CASE: Only status update is supported by API for appointments via PUT usually, 
                // but let's check if we need full update.
                // Server code: app.put('/api/appointments/:id/status'
                case 'UPDATE_APPOINTMENT_STATUS':
                    response = await authFetch(`${API_BASE}/appointments/${action.payload.id}/status`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: action.payload.status })
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'UPDATE_APPOINTMENT_STATUS', payload: data });
                    return data;

                case 'DELETE_APPOINTMENT':
                    response = await authFetch(`${API_BASE}/appointments/${action.payload}`, { method: 'DELETE' });
                    if (response.ok) dispatch({ type: 'DELETE_APPOINTMENT', payload: action.payload });
                    break;

                // --- SETTINGS ---
                case 'UPDATE_SETTINGS':
                    response = await authFetch(`${API_BASE}/settings`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(action.payload)
                    });
                    data = await response.json();
                    if (response.ok) dispatch({ type: 'UPDATE_SETTINGS', payload: data });
                    return data;

                default:
                    // Fallback for sync actions or unhandled ones
                    dispatch(action);
            }
        } catch (error) {
            console.error("API Action Failed:", action.type, error);
            // Surface the error to the caller instead of blocking the UI with alert()
            throw error;
        }
    };

    const [darkMode, setDarkMode] = useState(() => {
        try {
            return localStorage.getItem('theme') === 'dark';
        } catch (e) {
            return false;
        }
    });

    const toggleTheme = () => {
        setDarkMode(prev => {
            const newMode = !prev;
            try {
                localStorage.setItem('theme', newMode ? 'dark' : 'light');
                if (newMode) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            } catch (e) { console.error(e); }
            return newMode;
        });
    };

    const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || null);

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const [currentUser, setCurrentUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch { return null; }
    });

    const login = (role, userData = null, jwtToken = null) => {
        setUserRole(role);
        setCurrentUser(userData);
        localStorage.setItem('userRole', role);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        if (jwtToken) {
            setToken(jwtToken);
            localStorage.setItem('token', jwtToken);
        }
    };

    const logout = () => {
        setUserRole(null);
        setCurrentUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
    };

    return (
        <AppContext.Provider value={{ state, dispatch: asyncDispatch, loading, darkMode, toggleTheme, userRole, login, logout, currentUser, token }}>
            {!loading ? children : <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
