const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'pos_data.db');

async function checkPin() {
    const SQL = await initSqlJs();
    if (!fs.existsSync(dbPath)) {
        console.log('Database not found at:', dbPath);
        return;
    }
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);
    const result = db.exec("SELECT value FROM settings WHERE key = 'pin'");
    if (result.length > 0 && result[0].values.length > 0) {
        console.log('CURRENT_PIN:', result[0].values[0][0]);
    } else {
        console.log('PIN not found in settings table');
    }
}

checkPin().catch(console.error);
