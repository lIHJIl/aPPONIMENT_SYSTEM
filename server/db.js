const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const initDb = () => {
    db.serialize(() => {
        // Doctors Table
        db.run(`CREATE TABLE IF NOT EXISTS doctors (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            specialty TEXT,
            experience INTEGER,
            image TEXT
        )`);

        // Patients Table
        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            age INTEGER,
            phone TEXT,
            history TEXT,
            email TEXT,
            password TEXT
        )`);

        // Appointments Table
        db.run(`CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            doctorId TEXT,
            patientId TEXT,
            date TEXT,
            reason TEXT,
            status TEXT DEFAULT 'Pending',
            createdAt TEXT,
            FOREIGN KEY (doctorId) REFERENCES doctors(id),
            FOREIGN KEY (patientId) REFERENCES patients(id)
        )`);

        // Settings Table (Single row)
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT,
            workingHoursStart TEXT,
            workingHoursEnd TEXT,
            breakStart TEXT,
            breakEnd TEXT,
            slotDuration INTEGER DEFAULT 30,
            defaultConsultationFee REAL DEFAULT 50.0,
            adminPassword TEXT
        )`);

        // Migration for existing DBs (Try to add columns, ignore if exists)
        db.run("ALTER TABLE settings ADD COLUMN breakStart TEXT", (err) => { });
        db.run("ALTER TABLE settings ADD COLUMN breakEnd TEXT", (err) => { });
        db.run("ALTER TABLE settings ADD COLUMN slotDuration INTEGER DEFAULT 30", (err) => { });
        db.run("ALTER TABLE settings ADD COLUMN defaultConsultationFee REAL DEFAULT 50.0", (err) => { });
        db.run("ALTER TABLE settings ADD COLUMN adminPassword TEXT DEFAULT 'admin'", (err) => { });

        // Patients table migrations (email & password added later)
        db.run("ALTER TABLE patients ADD COLUMN email TEXT", (err) => { });
        db.run("ALTER TABLE patients ADD COLUMN password TEXT", (err) => { });

        // Stripe Payments & Pricing Migrations
        db.run("ALTER TABLE appointments ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'unpaid'", () => { });
        db.run("ALTER TABLE appointments ADD COLUMN booking_status TEXT NOT NULL DEFAULT 'pending_payment'", () => { });
        db.run("ALTER TABLE appointments ADD COLUMN total_fee REAL NOT NULL DEFAULT 0.0", () => { });
        db.run("ALTER TABLE appointments ADD COLUMN amount_paid REAL NOT NULL DEFAULT 0.0", () => { });
        db.run("ALTER TABLE appointments ADD COLUMN balance_due REAL GENERATED ALWAYS AS (total_fee - amount_paid) VIRTUAL", () => { });
        db.run("ALTER TABLE doctors ADD COLUMN consultation_fee REAL NOT NULL DEFAULT 50.0", () => { });

        db.run(`CREATE TABLE IF NOT EXISTS payments (
            id TEXT PRIMARY KEY,
            appointment_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            stripe_payment_intent_id TEXT NOT NULL,
            stripe_charge_id TEXT,
            amount REAL NOT NULL,
            currency TEXT NOT NULL DEFAULT 'inr',
            payment_type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS slot_holds (
            id TEXT PRIMARY KEY,
            appointment_id TEXT NOT NULL UNIQUE,
            user_id TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
        )`);

        // Indexes for performance
        db.run('CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctorId, date)');
        db.run('CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(patientId)');
        db.run('CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)');

        // Initialize default settings if not exists
        db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
            if (!row) {
                db.run(`INSERT INTO settings (id, name, workingHoursStart, workingHoursEnd, breakStart, breakEnd, slotDuration, defaultConsultationFee, adminPassword) 
                        VALUES (1, 'MediCare Clinic', '09:00', '17:00', '13:00', '14:00', 30, 50.0, 'admin')`);
            }
        });
    });
};

initDb();

module.exports = db;
