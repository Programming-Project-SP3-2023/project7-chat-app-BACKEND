const express = require('express');
const router = express.Router();
const sql = require('mssql');

var jsonparser = bodyparser.json();

router.post('/', jsonparser, async (req, est, next) =>{
    const username = req.body.username;
    const password = req.body.password;

    
})
router.get('/', (req, res, next) =>{
    const sqlConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        server: process.env.DB_HOST,
        pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000
        },
        options:{
            Encrypt: true,
            trustServerCertificate: true
        }
    }

    //submit user to the database
    sql.connect(sqlConfig).then(async function(){
        
    });

    // config for your database
    res.status(200).json({
        Message: "Ok"
    })
});

module.exports = router;