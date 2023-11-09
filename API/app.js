//import dependecies
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

//import middlewares into express
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
})

// import routes
const registerRoutes = require('./routes/register');
const loginRoutes = require('./routes/login');
const friendshipsRoutes = require('./routes/friendships');
const avatarRoutes = require('./routes/avatar');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

//setup all the routes
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/avatar', avatarRoutes)
app.use('/profile', profileRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/admin', adminRoutes);


//export the app
module.exports = app;