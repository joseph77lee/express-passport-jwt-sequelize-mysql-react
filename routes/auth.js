const express = require('express');
const passport = require('passport');
const { signin, signup, logout, verification } = require('../controllers/authController.js');

module.exports = function() {
  const router = express.Router();

  router.post('/signup', signup);

  router.post('/signin', signin);

  router.get('/logout', logout);

  router.get('/verification', verification);

  router.get('/dashboard', passport.authenticate('jwt', { session: false }), (req, res) => {
    res.status(200).json('ok');
  });

  return router;
};
