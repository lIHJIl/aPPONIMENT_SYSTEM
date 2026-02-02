const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log("Attempting to add adminPassword column...");
    db.run("ALTER TABLE settings ADD COLUMN adminPassword TEXT", (err) => {
        if (err) {
            console.log("Result: " + err.message); // Likely "duplicate column name" if it exists, which is fine.
        } else {
            console.log("Result: Success - Column added.");
            // Set default password
            db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", ['admin'], (err) => {
                if (err) console.error("Error setting default password:", err);
                else console.log("Default password set.");
            });
        }
    });
});

db.close();
