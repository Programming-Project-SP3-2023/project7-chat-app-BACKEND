//import dependecies
const express = require('express');
const app = express();
const bodyParser = require('body-parser')

//import middlewares into express
app.use(bodyParser.urlencoded({extended: true, limit: '10mb'}));
app.use(bodyParser.json({ limit: '10mb' }));
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
const groupsRoutes = require('./routes/groups');
const channelsRoutes = require('./routes/channels');
const verifyEmailRouter = require('./routes/verifyemail');

//setup all the routes
app.use('/register', registerRoutes);
app.use('/login', loginRoutes);
app.use('/avatar', avatarRoutes)
app.use('/profile', profileRoutes);
app.use('/friendships', friendshipsRoutes);
app.use('/admin', adminRoutes);
app.use('/groups', groupsRoutes);
app.use('/channels', channelsRoutes);
app.use('/verifyemail', verifyEmailRouter);

//export the app
module.exports = app;