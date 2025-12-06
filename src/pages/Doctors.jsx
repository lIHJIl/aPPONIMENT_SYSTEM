import React, { useState } from 'react';
import { Plus, Edit2, Trash2, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/UI/Modal';

const Doctors = () => {
    const { state, dispatch } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        specialty: '',
        experience: '',
        image: ''
    });

    const handleOpenModal = (doctor = null) => {
        if (doctor) {
            setEditingDoctor(doctor);
            setFormData({
                name: doctor.name,
                specialty: doctor.specialty,
                experience: doctor.experience,
                image: doctor.image || ''
            });
        } else {
            setEditingDoctor(null);
            setFormData({ name: '', specialty: '', experience: '', image: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingDoctor) {
            dispatch({ type: 'UPDATE_DOCTOR', payload: { ...editingDoctor, ...formData } });
        } else {
            dispatch({ type: 'ADD_DOCTOR', payload: formData });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this doctor?')) {
            dispatch({ type: 'DELETE_DOCTOR', payload: id });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Doctors</h1>
                    <p style={{ color: 'hsl(var(--text-muted))' }}>Manage your medical team</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    <Plus size={20} />
                    Add Doctor
                </button>
            </div>

            <div className="grid-cols-3">
                {state.doctors.map(doctor => (
                    <div key={doctor.id} className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'hsl(var(--primary-light))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                {doctor.image ?
                                    <img src={doctor.image} alt={doctor.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> :
                                    <User size={30} color="hsl(var(--primary))" />
                                }
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 600 }}>{doctor.name}</h3>
                                <span style={{
                                    display: 'inline-block',
                                    padding: '0.25rem 0.75rem',
                                    background: 'hsl(var(--primary-light))',
                                    color: 'hsl(var(--primary-dark))',
                                    borderRadius: '20px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500
                                }}>
                                    {doctor.specialty}
                                </span>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem', color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>
                            <p>Experience: {doctor.experience} years</p>
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                            <button
                                onClick={() => handleOpenModal(doctor)}
                                className="btn btn-outline"
                                style={{ flex: 1, padding: '0.5rem' }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => handleDelete(doctor.id)}
                                className="btn"
                                style={{ color: 'hsl(var(--danger))', background: '#fee2e2', padding: '0.5rem 0.75rem' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Name</label>
                        <input
                            required
                            type="text"
                            placeholder="Dr. John Doe"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Specialty</label>
                        <input
                            required
                            type="text"
                            placeholder="Cardiologist"
                            value={formData.specialty}
                            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Experience (Years)</label>
                        <input
                            required
                            type="number"
                            placeholder="10"
                            value={formData.experience}
                            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Image URL (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://example.com/doctor.jpg"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn" style={{ flex: 1, border: '1px solid #ddd' }}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{editingDoctor ? 'Update' : 'Add'} Doctor</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Doctors;
