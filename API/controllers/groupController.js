const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');


//create a new group
Router.post('', async (req, res)=>{
    try{
        //get group details from body
        const{groupName} = req.body;
        if(!groupName){
            return res.status(400).json({message: 'Group name is required'})
        }
        //db connect
        const pool = await sql.connect(sqlConfig);
        //insert new group into table
        const result = await pool.request()
        .input('groupName', sql.NVarChar(50), groupName)
        .query('INSERT INTO Groups (GroupName) VALUES (@groupName)');

        //check for success
        if(result.rowsAffected[0] === 1) {
            return res.status(201).json({message: 'Group created successfully'});
        }else{
            return res.status(500).json({message: 'Failed to create Group'})
        }
        }catch(error){
            console.error(error);
            res.status(500).json({message: 'Server error'});
        }
    });


    module.exports = router;