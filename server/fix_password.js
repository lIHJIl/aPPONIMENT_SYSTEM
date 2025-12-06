const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

console.log("Setting default password...");
db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", ['andhenemoviedekhiaurgungenegaana gaya'], (err) => {
    if (err) {
        console.error("Error setting password:", err);
    } else {
        console.log("Success: Default password set.");
    }
    db.close();
});
