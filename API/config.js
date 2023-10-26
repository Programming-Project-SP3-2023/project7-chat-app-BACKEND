const env = require('dotenv').config({ path: require('find-config')('.env') });

function returnServerConfig(){
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
        options: {
            encrypt: true,
            trustServerCertificate: true
        }
    };
    return sqlConfig;
}

module.exports = { returnServerConfig };