const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.get("SELECT adminPassword FROM settings WHERE id = 1", (err, row) => {
    if (err) {
        console.error("Error:", err);
    } else {
        console.log("Current Password in DB:", row.adminPassword);
    }
    db.close();
});
