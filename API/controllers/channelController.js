const express = require('express');
const sql = require('mssql');
const sqlConfig = require('../config');
const { stringify } = require('querystring');
const authenticateToken = require('../middleware/authenticateToken');
const router = express.Router();

//Create a channel
const createChannel = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Delete a channel
const deleteChannel = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Add member to channel
const addMember = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Remove member from a channel
const removeMember = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//List all channels within a grp
const channelList = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
//Get specific channel info
const channelInfo = async (req, res) =>{
    try{
        
    }catch(error){
        console.error(error);
        return res.status(500).json({message: 'Internal Server Error'});
    }
};
module.exports={channelInfo, channelList, deleteChannel, createChannel, addMember, removeMember}