const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

db.serialize(() => {
    db.all("SELECT * FROM doctors", (err, rows) => {
        if (err) console.error(err);
        else console.log('Doctors:', JSON.stringify(rows, null, 2));
    });
    db.all("SELECT * FROM patients", (err, rows) => {
        if (err) console.error(err);
        else console.log('Patients:', JSON.stringify(rows, null, 2));
    });
});
