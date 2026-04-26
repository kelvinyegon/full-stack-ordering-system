const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cola_commerce",
  password: "5432",
  port: 5432,
});

module.exports = pool;