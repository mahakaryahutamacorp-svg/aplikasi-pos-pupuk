const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'pos_data.db');

async function checkPin() {
    const SQL = await initSqlJs();
    if (!fs.existsSync(dbPath)) {
        console.log('Database not found');
        return;
    }
    const buffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(buffer);
    const result = db.exec("SELECT value FROM settings WHERE key = 'pin'");
    if (result.length > 0 && result[0].values.length > 0) {
        const pin = result[0].values[0][0];
        console.log(`PIN: [${pin}]`);
        console.log(`Length: ${pin.length}`);
        console.log(`Hex: ${Buffer.from(pin).toString('hex')}`);

        if (pin !== '2103') {
            console.log('PIN is NOT 2103. Resetting to 2103...');
            db.run("UPDATE settings SET value = '2103' WHERE key = 'pin'");
            const data = db.export();
            fs.writeFileSync(dbPath, Buffer.from(data));
            console.log('PIN reset to 2103');
        } else {
            console.log('PIN is correctly set to 2103');
        }
    } else {
        console.log('PIN not found, inserting 2103...');
        db.run("INSERT INTO settings (key, value) VALUES ('pin', '2103')");
        const data = db.export();
        fs.writeFileSync(dbPath, Buffer.from(data));
        console.log('PIN 2103 inserted');
    }
}

checkPin().catch(console.error);
