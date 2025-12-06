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
            history TEXT
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
            breakEnd TEXT
        )`);

        // Migration for existing DBs (Try to add columns, ignore if exists)
        db.run("ALTER TABLE settings ADD COLUMN breakStart TEXT", (err) => { });
        db.run("ALTER TABLE settings ADD COLUMN breakEnd TEXT", (err) => { });

        // Initialize default settings if not exists
        db.get("SELECT * FROM settings WHERE id = 1", (err, row) => {
            if (!row) {
                db.run(`INSERT INTO settings (id, name, workingHoursStart, workingHoursEnd, breakStart, breakEnd) 
                        VALUES (1, 'MediCare Clinic', '09:00', '17:00', '13:00', '14:00')`);
            }
        });
    });
};

initDb();

module.exports = db;
