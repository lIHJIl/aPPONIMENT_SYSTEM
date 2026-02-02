const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Adding email column to patients table...");
    db.run("ALTER TABLE patients ADD COLUMN email TEXT", (err) => {
        if (err) {
            console.log("Result: " + err.message); // Likely "duplicate column name" if already run
        } else {
            console.log("Result: Success - Column added.");
        }
    });
});

db.close();
