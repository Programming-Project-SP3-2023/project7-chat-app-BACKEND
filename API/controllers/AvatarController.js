const sql = require('mssql');
const fs = require('fs');
const path = require('path');

//Upload an avatar
const uploadAvatar = async (req, res)=>{
    try{
//upload code
    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
}

const changeAvatar = async (req, res)=>{
    //change avatar
};

const getAvatar = async (req, res)=>{
    try{

    }catch(error){
        console.error(error);
        res.status(500).json({message: 'Server error'});
    }
};

module.exports={
    uploadAvatar,
    changeAvatar,
    getAvatar
};