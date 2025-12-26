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
    // Initialize state from localStorage or default
    const init = () => {
        try {
            const stored = localStorage.getItem('medicare_data');
            return stored ? JSON.parse(stored) : initialState;
        } catch (e) {
            console.error("Failed to load local data", e);
            return initialState;
        }
    };

    const [state, dispatch] = useReducer(reducer, null, init);
    const [loading, setLoading] = useState(false);

    // Persist state changes
    useEffect(() => {
        try {
            localStorage.setItem('medicare_data', JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save local data", e);
        }
    }, [state]);

    // Simplified dispatch - pure local state management
    const localDispatch = (action) => {
        // We can add simple ID generation here since we don't have a backend doing it
        if (['ADD_PATIENT', 'ADD_DOCTOR', 'ADD_APPOINTMENT'].includes(action.type)) {
            if (!action.payload.id) {
                action.payload.id = Date.now(); // Simple mock ID
            }
        }
        dispatch(action);
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

    const [userRole, setUserRole] = useState(null); // 'admin' | 'patient' | 'staff' | null

    const toggleRole = () => {
        setUserRole(prev => prev === 'admin' ? 'patient' : 'admin');
    };

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        }
    }, []);

    const [currentUser, setCurrentUser] = useState(null);

    const login = (role, userData = null) => {
        setUserRole(role);
        setCurrentUser(userData);
    };

    const logout = () => {
        setUserRole(null);
        setCurrentUser(null);
    };

    return (
        <AppContext.Provider value={{ state, dispatch: localDispatch, loading, darkMode, toggleTheme, userRole, toggleRole, login, logout, currentUser }}>
            {!loading ? children : <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
