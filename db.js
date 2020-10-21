const mysql = require("mysql2");


//db connection
const db = mysql.createPool({
  host: "localhost",
  user: "belscone_root",
  password: "M51cT4n5qb",
  database: "belscone_bushkov",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


module.exports=db;

