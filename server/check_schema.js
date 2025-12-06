const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(settings)", (err, rows) => {
    if (err) {
        console.error("Error getting table info:", err);
    } else {
        console.log("Settings Table Columns:");
        console.table(rows);
    }
    db.close();
});
