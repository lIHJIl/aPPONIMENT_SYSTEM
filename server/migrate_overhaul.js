const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, 'clinic.db');
const db = new sqlite3.Database(dbPath);

const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ":" + derivedKey.toString('hex'));
        });
    });
};

db.serialize(async () => {
    console.log("Adding password column to patients...");
    db.run("ALTER TABLE patients ADD COLUMN password TEXT", (err) => {
        if (!err) console.log("Added password column.");
    });

    try {
        const defaultPass = await hashPassword('password123');
        const adminPass = await hashPassword('admin123');

        console.log("Setting default password for existing patients...");
        db.run("UPDATE patients SET password = ? WHERE password IS NULL", [defaultPass], (err) => {
            if (!err) console.log("Patients updated.");
        });

        console.log("Resetting and hashing admin password...");
        db.run("UPDATE settings SET adminPassword = ? WHERE id = 1", [adminPass], (err) => {
            if (!err) console.log("Admin password hashed and reset to 'admin123'.");
        });

    } catch (e) {
        console.error("Error hashing:", e);
    }
});

// Wait briefly for updates
setTimeout(() => db.close(), 2000);
