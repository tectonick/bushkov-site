const mysql = require("mysql2");
const config = require("config");
const dbconfig = config.get("db");

//db connection
const db = mysql.createPool({
  host: dbconfig.host,
  user: dbconfig.user,
  password: dbconfig.password,
  database: dbconfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports=db;

