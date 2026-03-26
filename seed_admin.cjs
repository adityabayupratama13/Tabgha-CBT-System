const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'root',
      database: 'tabgha'
    });

    const [rows] = await connection.execute(
      "INSERT IGNORE INTO User (id, username, password, role, name) VALUES (UUID(), 'admin', 'password123', 'ADMIN', 'Master System Administrator')"
    );
    
    console.log("Master Admin user 'admin' created successfully. Password: 'password123'");
    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  }
}

main();
