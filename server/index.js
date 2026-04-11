require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const morgan = require('morgan');

const JWT_SECRET = process.env.JWT_SECRET || 'aPPONIMENT_SYSTEM_SUPER_SECRET';

const app = express();
const PORT = process.env.PORT || 3000;

const paymentLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
};

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
// --- Stripe Webhook API (Must be before express.json) ---
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const { appointment_id, user_id, payment_type } = paymentIntent.metadata;
        const amount = paymentIntent.amount_received;

        db.serialize(() => {
            db.run(`UPDATE payments SET status = 'succeeded', stripe_charge_id = ? WHERE stripe_payment_intent_id = ?`,
                [paymentIntent.latest_charge, paymentIntent.id]);

            db.get(`SELECT total_fee, amount_paid FROM appointments WHERE id = ?`, [appointment_id], (err, row) => {
                if (row) {
                    const newAmountPaid = row.amount_paid + (amount / 100);
                    let newPaymentStatus = row.payment_status;
                    let newBookingStatus = 'confirmed';

                    if (payment_type === 'full' || newAmountPaid >= row.total_fee) {
                        newPaymentStatus = 'paid';
                    } else if (payment_type === 'partial') {
                        newPaymentStatus = 'partial';
                    }

                    db.run(`UPDATE appointments SET amount_paid = ?, payment_status = ?, booking_status = ? WHERE id = ?`,
                        [newAmountPaid, newPaymentStatus, newBookingStatus, appointment_id]);
                }
            });

            db.run(`DELETE FROM slot_holds WHERE appointment_id = ?`, [appointment_id]);
        });
    } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object;
        db.run(`UPDATE payments SET status = 'failed' WHERE stripe_payment_intent_id = ?`, [paymentIntent.id]);
        console.error("Payment failed:", paymentIntent.last_payment_error?.message);
    }

    res.json({ received: true });
});

app.use(express.json());

// --- Security Helpers ---
const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'));
        });
    });
};

const verifyPassword = (password, hash) => {
    return new Promise((resolve, reject) => {
        const [salt, key] = hash.split(':');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString('hex'));
        });
    });
};

// --- Doctors API ---
app.get('/api/doctors', (req, res) => {
    db.all("SELECT * FROM doctors", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/doctors', requireAuth, requireAdmin, (req, res) => {
    const { name, specialty, experience, image, consultation_fee } = req.body;
    const id = uuidv4();
    const fee = consultation_fee != null ? consultation_fee : 50.0;
    db.run(`INSERT INTO doctors (id, name, specialty, experience, image, consultation_fee) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, name, specialty, experience, image, fee],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, specialty, experience, image, consultation_fee: fee });
        }
    );
});

app.put('/api/doctors/:id', requireAuth, requireAdmin, (req, res) => {
    const { name, specialty, experience, image, consultation_fee } = req.body;
    const fee = consultation_fee != null ? consultation_fee : 50.0;
    db.run(`UPDATE doctors SET name = ?, specialty = ?, experience = ?, image = ?, consultation_fee = ? WHERE id = ?`,
        [name, specialty, experience, image, fee, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, name, specialty, experience, image, consultation_fee: fee });
        }
    );
});

app.delete('/api/doctors/:id', requireAuth, requireAdmin, (req, res) => {
    // Cascade delete appointments first
    db.run("DELETE FROM appointments WHERE doctorId = ?", [req.params.id], (err) => {
        if (err) console.error("Error cascading delete:", err);

        db.run("DELETE FROM doctors WHERE id = ?", req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Deleted" });
        });
    });
});

// --- Patients API ---
app.get('/api/patients', (req, res) => {
    db.all("SELECT * FROM patients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Don't send passwords
        const safeRows = rows.map(({ password, ...rest }) => rest);
        res.json(safeRows);
    });
});

app.post('/api/patients', async (req, res) => {
    const { name, age, phone, history, email, password } = req.body;
    const id = uuidv4();

    try {
        const hashedPassword = await hashPassword(password || 'password123'); // Fallback if missing

        db.run(`INSERT INTO patients (id, name, age, phone, history, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, name, age, phone, history, email, hashedPassword],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id, name, age, phone, history, email });
            }
        );
    } catch (e) {
        res.status(500).json({ error: "Password hashing failed" });
    }
});

app.put('/api/patients/:id', (req, res) => {
    const { name, age, phone, history, email } = req.body;
    db.run(`UPDATE patients SET name = ?, age = ?, phone = ?, history = ?, email = ? WHERE id = ?`,
        [name, age, phone, history, email, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, name, age, phone, history, email });
        }
    );
});

app.delete('/api/patients/:id', requireAuth, requireAdmin, (req, res) => {
    // Cascade delete appointments
    db.run("DELETE FROM appointments WHERE patientId = ?", [req.params.id], (err) => {
        db.run("DELETE FROM patients WHERE id = ?", req.params.id, function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Deleted" });
        });
    });
});

// --- Auth API ---
app.post('/api/login/patient', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM patients WHERE email = ? OR phone = ?", [email, email], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: "Patient not found" });

        if (!row.password) {
            // Unmigrated legacy account - this shouldn't happen after migration script but good safety
            return res.status(401).json({ error: "Account needs migration. Contact admin." });
        }

        try {
            const isValid = await verifyPassword(password, row.password);
            if (isValid) {
                const { password, ...safeUser } = row;
                const token = jwt.sign({ id: row.id, role: 'patient' }, JWT_SECRET, { expiresIn: '7d' });
                res.json({ success: true, user: safeUser, token });
            } else {
                res.status(401).json({ error: "Invalid credentials" });
            }
        } catch (e) {
            res.status(500).json({ error: "Verification error" });
        }
    });
});

// --- Appointments API ---
app.get('/api/appointments', (req, res) => {
    db.all("SELECT * FROM appointments", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/appointments', requireAuth, (req, res) => {
    const { doctorId, patientId, date, reason } = req.body;

    if (!doctorId || !patientId || !date) {
        return res.status(400).json({ error: 'doctorId, patientId, and date are required.' });
    }

    if (isNaN(new Date(date).getTime())) {
        return res.status(400).json({ error: 'Invalid date format.' });
    }

    db.serialize(() => {
        db.run("BEGIN IMMEDIATE", (err) => {
            if (err) return res.status(500).json({ error: 'System busy, please try again.' });
            
            db.get("SELECT * FROM appointments WHERE doctorId = ? AND date = ? AND status != 'Cancelled'", [doctorId, date], (err, row) => {
                if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                if (row) { db.run("ROLLBACK"); return res.status(409).json({ error: "This slot is already booked." }); }

                db.get("SELECT defaultConsultationFee FROM settings WHERE id = 1", (err, settingsRow) => {
                    const fallbackFee = settingsRow && settingsRow.defaultConsultationFee != null ? settingsRow.defaultConsultationFee : 50.0;
                    
                    db.get("SELECT consultation_fee FROM doctors WHERE id = ?", [doctorId], (err, doctor) => {
                        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                        const totalFee = doctor && doctor.consultation_fee != null ? doctor.consultation_fee : fallbackFee;

                        const id = uuidv4();
                        const createdAt = new Date().toISOString();
                        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
                        const status = 'Pending';

                        db.run(`INSERT INTO appointments (id, doctorId, patientId, date, reason, status, createdAt, booking_status, payment_status, total_fee, amount_paid) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_payment', 'unpaid', ?, 0.0)`,
                            [id, doctorId, patientId, date, reason, status, createdAt, totalFee],
                            function (err) {
                                if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                                
                                const holdId = uuidv4();
                                db.run(`INSERT INTO slot_holds (id, appointment_id, user_id, expires_at) VALUES (?, ?, ?, ?)`,
                                    [holdId, id, patientId, expiresAt],
                                    (err) => {
                                        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                                        db.run("COMMIT", (err) => {
                                            if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
                                            res.json({ id, doctorId, patientId, date, reason, status, createdAt, total_fee: totalFee });
                                        });
                                    }
                                );
                            }
                        );
                    });
                });
            });
        });
    });
});

app.use('/api/payments', paymentLimiter);

app.post('/api/payments/create-intent', (req, res) => {
    const { appointment_id, payment_type, amount, user_id } = req.body;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    db.get("SELECT * FROM appointments WHERE id = ? AND patientId = ?", [appointment_id, user_id], async (err, appointment) => {
        if (err || !appointment) return res.status(404).json({ error: "Appointment not found." });

        if (appointment.booking_status !== 'pending_payment') {
            return res.status(400).json({ error: `Cannot pay for appointment in status: ${appointment.booking_status}` });
        }

        db.get("SELECT * FROM slot_holds WHERE appointment_id = ?", [appointment_id], async (err, hold) => {
            if (err) return res.status(500).json({ error: err.message });
            
            if (!hold || new Date() > new Date(hold.expires_at)) {
                return res.status(410).json({ error: "Payment window expired. Please rebook." });
            }

            const totalCents = Math.round(appointment.total_fee * 100);
            if (payment_type === 'full' && amount !== totalCents) {
                return res.status(400).json({ error: "Amount must be in full." });
            } else if (payment_type === 'partial') {
                const minCents = Math.round(appointment.total_fee * 20); // 20%
                if (amount < minCents || amount >= totalCents) {
                    return res.status(400).json({ error: "Invalid partial payment amount." });
                }
            }

            try {
                const paymentIntent = await stripe.paymentIntents.create({
                    amount: amount,
                    currency: 'inr',
                    metadata: { appointment_id, user_id, payment_type }
                });

                const paymentId = uuidv4();
                db.run(`INSERT INTO payments (id, appointment_id, user_id, stripe_payment_intent_id, amount, payment_type) VALUES (?, ?, ?, ?, ?, ?)`,
                    [paymentId, appointment_id, user_id, paymentIntent.id, amount / 100, payment_type],
                    (err) => {
                        if (err) return res.status(500).json({ error: err.message });
                        res.json({ client_secret: paymentIntent.client_secret, payment_id: paymentId });
                    }
                );
            } catch (e) {
                res.status(500).json({ error: e.message });
            }
        });
    });
});

app.post('/api/payments/pay-remainder', (req, res) => {
    const { appointment_id, user_id } = req.body;

    if (!user_id) return res.status(401).json({ error: "Unauthorized" });

    db.get("SELECT * FROM appointments WHERE id = ? AND patientId = ?", [appointment_id, user_id], async (err, appointment) => {
        if (err || !appointment) return res.status(404).json({ error: "Appointment not found." });

        if (appointment.payment_status !== 'partial') {
            return res.status(400).json({ error: "Appointment is not partially paid." });
        }

        const balanceDueCents = Math.round((appointment.total_fee - appointment.amount_paid) * 100);
        if (balanceDueCents <= 0) {
            return res.status(400).json({ error: "No balance due." });
        }

        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: balanceDueCents,
                currency: 'inr',
                metadata: { appointment_id, user_id, payment_type: 'remainder' }
            });

            const paymentId = uuidv4();
            db.run(`INSERT INTO payments (id, appointment_id, user_id, stripe_payment_intent_id, amount, payment_type) VALUES (?, ?, ?, ?, ?, ?)`,
                [paymentId, appointment_id, user_id, paymentIntent.id, balanceDueCents / 100, 'remainder'],
                (err) => {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ client_secret: paymentIntent.client_secret, payment_id: paymentId });
                }
            );
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

app.get('/api/appointments/:id/payment', (req, res) => {
    db.get("SELECT * FROM appointments WHERE id = ?", [req.params.id], (err, appointment) => {
        if (err || !appointment) return res.status(404).json({ error: "Not found" });
        
        db.all("SELECT * FROM payments WHERE appointment_id = ?", [req.params.id], (err, payments) => {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                appointment_id: appointment.id,
                booking_status: appointment.booking_status,
                payment_status: appointment.payment_status,
                total_fee: appointment.total_fee,
                amount_paid: appointment.amount_paid,
                balance_due: appointment.total_fee - appointment.amount_paid,
                payments
            });
        });
    });
});

app.put('/api/appointments/:id/status', (req, res) => {
    const { status } = req.body;
    db.run(`UPDATE appointments SET status = ? WHERE id = ?`,
        [status, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, status });
        }
    );
});

// Admin Refund Endpoint
app.post('/api/admin/payments/:id/refund', async (req, res) => {
    const paymentId = req.params.id;
    
    db.get(`SELECT * FROM payments WHERE id = ?`, [paymentId], async (err, payment) => {
        if (err || !payment) return res.status(404).json({ error: "Payment not found" });
        if (payment.status === 'refunded') return res.status(400).json({ error: "Already refunded" });

        try {
            const refund = await stripe.refunds.create({
                payment_intent: payment.stripe_payment_intent_id
            });

            db.serialize(() => {
                db.run(`UPDATE payments SET status = 'refunded' WHERE id = ?`, [paymentId]);

                db.get(`SELECT * FROM appointments WHERE id = ?`, [payment.appointment_id], (err, row) => {
                    if (row) {
                        const newAmountPaid = Math.max(0, row.amount_paid - payment.amount);
                        let newPaymentStatus = newAmountPaid >= row.total_fee ? 'paid' : (newAmountPaid > 0 ? 'partial' : 'unpaid');
                        
                        db.run(`UPDATE appointments SET amount_paid = ?, payment_status = ? WHERE id = ?`, 
                            [newAmountPaid, newPaymentStatus, payment.appointment_id]);
                    }
                });
            });

            res.json({ success: true, refund });
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    });
});

app.delete('/api/appointments/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query; // Secure verification from frontend
    
    db.serialize(() => {
        if (user_id) {
            db.run(`DELETE FROM appointments WHERE id = ? AND patientId = ?`, [id, user_id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`DELETE FROM slot_holds WHERE appointment_id = ?`, [id]);
                res.json({ message: "Deleted" });
            });
        } else {
             // Admin delete fallback
             db.run(`DELETE FROM appointments WHERE id = ?`, [id], function(err) {
                if (err) return res.status(500).json({ error: err.message });
                db.run(`DELETE FROM slot_holds WHERE appointment_id = ?`, [id]);
                res.json({ message: "Deleted" });
            });
        }
    });
});

// Slot Hold Expiry Cleanup Job - runs every 5 minutes
setInterval(() => {
    const now = new Date().toISOString();
    db.all(`SELECT appointment_id FROM slot_holds WHERE expires_at < ?`, [now], (err, rows) => {
        if (err || !rows) return;
        rows.forEach(hold => {
            db.serialize(() => {
                db.run(`DELETE FROM slot_holds WHERE appointment_id = ?`, [hold.appointment_id]);
                db.run(`UPDATE appointments SET booking_status = 'cancelled' WHERE id = ? AND booking_status = 'pending_payment'`, [hold.appointment_id]);
            });
        });
    });
}, 5 * 60 * 1000);

// --- Settings API ---
app.get('/api/settings', (req, res) => {
    db.get("SELECT name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration, defaultConsultationFee FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.put('/api/settings', requireAuth, requireAdmin, (req, res) => {
    const { name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration, defaultConsultationFee } = req.body;
    db.run(`UPDATE settings SET name = ?, workingHoursStart = ?, workingHoursEnd = ?, breakStart = ?, breakEnd = ?, slotDuration = ?, defaultConsultationFee = ? WHERE id = 1`,
        [name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration, defaultConsultationFee],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration, defaultConsultationFee });
        }
    );
});

app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    db.get("SELECT adminPassword FROM settings WHERE id = 1", async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row && row.adminPassword) {
            try {
                // Check if it's hashed (contains :)
                if (row.adminPassword.includes(':')) {
                    const isValid = await verifyPassword(password, row.adminPassword);
                    if (isValid) {
                        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
                        return res.json({ success: true, token });
                    }
                } else {
                    // Fallback for legacy plain text (before restart maybe?)
                    if (row.adminPassword === password) {
                        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
                        return res.json({ success: true, token });
                    }
                }
            } catch (e) { console.error(e); }
        }

        res.status(401).json({ success: false, error: 'Invalid password' });
    });
});

app.put('/api/admin/password', async (req, res) => {
    const { newPassword } = req.body;
    try {
        const hashed = await hashPassword(newPassword);
        db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", [hashed], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    } catch (e) {
        res.status(500).json({ error: "Hashing failed" });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found.` });
});

app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.url}`, err.message);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred.' : err.message
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
