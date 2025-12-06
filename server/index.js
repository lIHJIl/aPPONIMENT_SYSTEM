const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

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
    db.run("DELETE FROM doctors WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
    });
});

// --- Patients API ---
app.get('/api/patients', (req, res) => {
    db.all("SELECT * FROM patients", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/patients', (req, res) => {
    const { name, age, phone, history } = req.body;
    const id = uuidv4();
    db.run(`INSERT INTO patients (id, name, age, phone, history) VALUES (?, ?, ?, ?, ?)`,
        [id, name, age, phone, history],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id, name, age, phone, history });
        }
    );
});

app.put('/api/patients/:id', (req, res) => {
    const { name, age, phone, history } = req.body;
    db.run(`UPDATE patients SET name = ?, age = ?, phone = ?, history = ? WHERE id = ?`,
        [name, age, phone, history, req.params.id],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: req.params.id, name, age, phone, history });
        }
    );
});

app.delete('/api/patients/:id', (req, res) => {
    db.run("DELETE FROM patients WHERE id = ?", req.params.id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Deleted" });
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
    db.get("SELECT name, workingHoursStart, workingHoursEnd, breakStart, breakEnd FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row);
    });
});

app.put('/api/settings', (req, res) => {
    const { name, workingHoursStart, workingHoursEnd, breakStart, breakEnd } = req.body;
    db.run(`UPDATE settings SET name = ?, workingHoursStart = ?, workingHoursEnd = ?, breakStart = ?, breakEnd = ? WHERE id = 1`,
        [name, workingHoursStart, workingHoursEnd, breakStart, breakEnd],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ name, workingHoursStart, workingHoursEnd, breakStart, breakEnd });
        }
    );
});

app.post('/api/admin/verify', (req, res) => {
    const { password } = req.body;
    db.get("SELECT adminPassword FROM settings WHERE id = 1", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        console.log("Verify Request - Received:", password);
        console.log("Verify Request - Stored:", row ? row.adminPassword : 'No Row');

        if (row && row.adminPassword === password) {
            console.log("Verify Request - MATCH!");
            res.json({ success: true });
        } else {
            console.log("Verify Request - MISMATCH");
            res.status(401).json({ success: false, error: 'Invalid password' });
        }
    });
});

app.put('/api/admin/password', (req, res) => {
    const { newPassword } = req.body;
    db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", [newPassword], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
