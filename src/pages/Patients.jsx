import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';

const Patients = () => {
    const { state, dispatch, userRole } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        age: '',
        phone: '',
        history: ''
    });

    const handleOpenModal = (patient = null) => {
        if (patient) {
            setEditingPatient(patient);
            setFormData({
                name: patient.name,
                age: patient.age,
                phone: patient.phone,
                history: patient.history || ''
            });
        } else {
            setEditingPatient(null);
            setFormData({ name: '', age: '', phone: '', history: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPatient) {
            dispatch({ type: 'UPDATE_PATIENT', payload: { ...editingPatient, ...formData } });
        } else {
            dispatch({ type: 'ADD_PATIENT', payload: formData });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this patient?')) {
            dispatch({ type: 'DELETE_PATIENT', payload: id });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Patients</h1>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Manage patient records</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    Add Patient
                </button>
            </div>

            <div className="grid-cols-2">
                {state.patients.map(patient => (
                    <div key={patient.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '12px',
                                    background: 'hsl(var(--secondary))',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.25rem'
                                }}>
                                    {patient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 600 }}>{patient.name}</h3>
                                    <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Age: {patient.age} • {patient.phone}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {userRole === 'admin' && (
                                    <>
                                        <button onClick={() => handleOpenModal(patient)} className="btn" style={{ padding: '0.25rem' }}><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(patient.id)} className="btn" style={{ padding: '0.25rem', color: 'hsl(var(--danger))' }}><Trash2 size={16} /></button>
                                    </>
                                )}
                            </div>
                        </div>

                        {patient.history && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'hsl(var(--background))', borderRadius: '8px', fontSize: '0.9rem' }}>
                                <strong>Medical History:</strong>
                                <p style={{ marginTop: '0.25rem', color: 'hsl(var(--text-muted))' }}>{patient.history}</p>
                            </div>
                        )}
                    </div>
                ))}
                {state.patients.length === 0 && (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '3rem', color: 'hsl(var(--text-muted))' }}>
                        No patients found. Add one to get started.
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingPatient ? 'Edit Patient' : 'Add New Patient'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Full Name</label>
                        <input
                            required
                            type="text"
                            placeholder="Alice Smith"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Age</label>
                            <input
                                required
                                type="number"
                                placeholder="30"
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Phone</label>
                            <input
                                required
                                type="tel"
                                placeholder="(555) 123-4567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Medical History (Optional)</label>
                        <textarea
                            rows="3"
                            placeholder="Allergies, chronic conditions..."
                            value={formData.history}
                            onChange={(e) => setFormData({ ...formData, history: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, border: '1px solid #ddd' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingPatient ? 'Update' : 'Add'} Patient</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Patients;
