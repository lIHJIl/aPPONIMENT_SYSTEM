import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

const AppContext = createContext();

const API_BASE = 'http://localhost:3000/api';

const initialState = {
    doctors: [],
    patients: [],
    appointments: [],
    clinicSettings: {
        name: 'MediCare Clinic',
        workingHoursStart: '09:00',
        workingHoursEnd: '17:00'
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

    const fetchData = async () => {
        try {
            setLoading(true);
            const [doctors, patients, appointments, settings] = await Promise.all([
                fetch(`${API_BASE}/doctors`).then(res => res.json()),
                fetch(`${API_BASE}/patients`).then(res => res.json()),
                fetch(`${API_BASE}/appointments`).then(res => res.json()),
                fetch(`${API_BASE}/settings`).then(res => res.json())
            ]);

            dispatch({
                type: 'SET_INITIAL_DATA', payload: {
                    doctors: doctors || [],
                    patients: patients || [],
                    appointments: appointments || [],
                    clinicSettings: settings || initialState.clinicSettings
                }
            });
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Wrap dispatch to call API then update state
    const asyncDispatch = async (action) => {
        try {
            switch (action.type) {
                case 'ADD_DOCTOR':
                    const newDoc = await fetch(`${API_BASE}/doctors`, {
                        method: 'POST', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json());
                    dispatch({ type: action.type, payload: newDoc });
                    break;
                case 'UPDATE_DOCTOR':
                    await fetch(`${API_BASE}/doctors/${action.payload.id}`, {
                        method: 'PUT', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    });
                    dispatch(action);
                    break;
                case 'DELETE_DOCTOR':
                    await fetch(`${API_BASE}/doctors/${action.payload}`, { method: 'DELETE' });
                    dispatch(action);
                    break;

                case 'ADD_PATIENT':
                    const newPat = await fetch(`${API_BASE}/patients`, {
                        method: 'POST', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json());
                    dispatch({ type: action.type, payload: newPat });
                    break;
                case 'UPDATE_PATIENT':
                    await fetch(`${API_BASE}/patients/${action.payload.id}`, {
                        method: 'PUT', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    });
                    dispatch(action);
                    break;
                case 'DELETE_PATIENT':
                    await fetch(`${API_BASE}/patients/${action.payload}`, { method: 'DELETE' });
                    dispatch(action);
                    break;

                case 'ADD_APPOINTMENT':
                    const newApt = await fetch(`${API_BASE}/appointments`, {
                        method: 'POST', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    }).then(res => res.json());
                    dispatch({ type: action.type, payload: newApt });
                    break;
                case 'UPDATE_APPOINTMENT_STATUS':
                    await fetch(`${API_BASE}/appointments/${action.payload.id}/status`, {
                        method: 'PUT', body: JSON.stringify({ status: action.payload.status }), headers: { 'Content-Type': 'application/json' }
                    });
                    dispatch(action);
                    break;
                case 'DELETE_APPOINTMENT':
                    await fetch(`${API_BASE}/appointments/${action.payload}`, { method: 'DELETE' });
                    dispatch(action);
                    break;

                case 'UPDATE_SETTINGS':
                    await fetch(`${API_BASE}/settings`, {
                        method: 'PUT', body: JSON.stringify(action.payload), headers: { 'Content-Type': 'application/json' }
                    });
                    dispatch(action);
                    break;

                default:
                    dispatch(action);
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("Action failed. Check server connection.");
        }
    };

    const [darkMode, setDarkMode] = useState(() => {
        try {
            return localStorage.getItem('theme') === 'dark';
        } catch (e) {
            console.error(e);
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

    const [userRole, setUserRole] = useState('admin'); // 'admin' or 'patient'

    const toggleRole = () => {
        setUserRole(prev => prev === 'admin' ? 'patient' : 'admin');
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    return (
        <AppContext.Provider value={{ state, dispatch: asyncDispatch, loading, darkMode, toggleTheme, userRole, toggleRole }}>
            {!loading ? children : <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
