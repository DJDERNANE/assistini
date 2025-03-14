require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    // host: 'database',
    // user: 'user',
    // password: 'password',
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assistini',
    dialect: "mysql",
    timezone: "local" 

})

db.getConnection(()=>{console.log('db connected succesfully')})
module.exports = db