//import dependecies
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

//import middlewares into express
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
})

// import routes
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');

//setup all the routes
app.use('/register', registerRoutes);
app.use('/Login', loginRoutes);



app.get('/', function(req,res){
    sql.connect(sqlConfig);
    result = sql.query`select * from Accounts`
    console.dir(result);
})

//export the app
module.exports = app;