require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('morgan');
const passport = require('passport');
const flash = require('connect-flash');

const models = require('./models');
require('./config/passport/passport.js')(passport, models);

// Sync Database
models.sequelize
  .sync()
  .then(function() {
    console.log('Nice! Database looks fine');
  })
  .catch(function(err) {
    console.log(err, 'Something went wrong with the Database Update!');
  });

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(passport.initialize());

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'build')));

app.use('/api', require('./routes/auth')(passport));

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json(err);
});

// react frontend
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

module.exports = app;
