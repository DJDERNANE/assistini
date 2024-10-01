require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'assistini',
    dialect: "mysql"

})

db.getConnection(()=>{console.log('db connected succesfully')})
module.exports = db