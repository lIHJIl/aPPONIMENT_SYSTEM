const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log("Updating admin password to 'clinicnic'...");
db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", ['clinicnic'], (err) => {
    if (err) {
        console.error("Error setting password:", err);
    } else {
        console.log("Success: Password updated to 'clinicnic'.");
    }
    db.close();
});
