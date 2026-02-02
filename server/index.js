const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(cors());
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

app.post('/api/doctors', (req, res) => {
    const { name, specialty, experience, image } = req.body;
    const id = uuidv4();
    db.run(`INSERT INTO doctors (id, name, specialty, experience, image) VALUES (?, ?, ?, ?, ?)`,
        [id, name, specialty, experience, image],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, specialty, experience, image });
        }
    );
});

app.put('/api/doctors/:id', (req, res) => {
    const { name, specialty, experience, image } = req.body;
    db.run(`UPDATE doctors SET name = ?, specialty = ?, experience = ?, image = ? WHERE id = ?`,
        [name, specialty, experience, image, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, name, specialty, experience, image });
        }
    );
});

app.delete('/api/doctors/:id', (req, res) => {
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

app.delete('/api/patients/:id', (req, res) => {
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
                res.json({ success: true, user: safeUser });
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

app.post('/api/appointments', (req, res) => {
    const { doctorId, patientId, date, reason } = req.body;

    // Check for conflict
    db.get("SELECT * FROM appointments WHERE doctorId = ? AND date = ?", [doctorId, date], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (row) {
            return res.status(409).json({ error: "This slot is already booked." });
        }

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const status = 'Pending';

        db.run(`INSERT INTO appointments (id, doctorId, patientId, date, reason, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, doctorId, patientId, date, reason, status, createdAt],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ id, doctorId, patientId, date, reason, status, createdAt });
            }
        );
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

app.delete('/api/appointments/:id', (req, res) => {
    db.run("DELETE FROM appointments WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// --- Settings API ---
app.get('/api/settings', (req, res) => {
    db.get("SELECT name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.put('/api/settings', (req, res) => {
    const { name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration } = req.body;
    db.run(`UPDATE settings SET name = ?, workingHoursStart = ?, workingHoursEnd = ?, breakStart = ?, breakEnd = ?, slotDuration = ? WHERE id = 1`,
        [name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration });
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
                    if (isValid) return res.json({ success: true });
                } else {
                    // Fallback for legacy plain text (before restart maybe?)
                    if (row.adminPassword === password) return res.json({ success: true });
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
