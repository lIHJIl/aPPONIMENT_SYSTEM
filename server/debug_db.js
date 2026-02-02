const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'clinic.db');
console.log('Opening DB at:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error('Error opening DB:', err.message);
        return;
    }
    console.log('Connected.');
    
    const tables = ['doctors', 'patients', 'appointments', 'settings'];
    
    tables.forEach(table => {
        db.get(`SELECT count(*) as count FROM ${table}`, (err, row) => {
            if (err) {
                console.log(`Error reading ${table}:`, err.message);
            } else {
                console.log(`${table} count:`, row ? row.count : 0);
            }
        });
    });
});
