const sql = require('mssql');
const bcrypt = require('bcrypt');
const sqlConfig = require('../config/sqlConfig');


//Update password
const updatePassword = async (req, res, next) => {
    //pw update implementation
};

//Edit displayname
const editDisplayname = async (req, res, next) =>{
    //edit displayname
};


module.exports ={
    updatePassword,
    editDisplayname,
};