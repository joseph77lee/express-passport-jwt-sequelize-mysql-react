const jwt = require('jsonwebtoken');
const passport = require('passport');
const createError = require('http-errors');

function signup(req, res, next) {
  passport.authenticate('local-signup', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(createError(404, info.message));
    }

    req.login(user, { session: false }, err => {
      if (err) {
        return next(err);
      }
      return res.send();
    });
  })(req, res, next);
}

function signin(req, res, next) {
  passport.authenticate('local-signin', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return next(createError(404, info.message));
    }

    req.login(user, { session: false }, err => {
      if (err) {
        return next(err);
      }
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
      return res.send({ token });
    });
  })(req, res, next);
}

function logout(req, res) {
  req.session.destroy(function(err) {
    res.status(200).json('OK');
  });
}

function verification(req, res) {
  const models = require('../models');
  const User = models.User;
  const VerificationToken = models.VerificationToken;
  const { email, token } = req.query;

  User.findOne({
    where: { email: email }
  })
    .then(user => {
      if (user.isVerified) {
        res.status(202).json('You already verifide your account.');
      } else {
        VerificationToken.findOne({
          where: { token: token }
        })
          .then(foundToken => {
            if (foundToken.token === token) {
              User.update(
                {
                  isVerified: true
                },
                {
                  where: {
                    id: foundToken.UserId
                  }
                }
              )
                .then(updatedUser => {
                  res.status(200).json(`Your email is verified.`);
                })
                .catch(reason => {
                  res.status(403).json(`Fail to verify your email.`);
                });
            } else if (foundToken.token !== token) {
              res.status(404).json('Your verification token is not matched.');
            } else {
              res.status(404).json('Your verification token is not valid.');
            }
          })
          .catch(reason => {
            res.status(404).json('Your verification token is expired.');
          });
      }
    })
    .catch(reason => {
      res.status(404).json('No email is found.');
    });
}

module.exports = {
  signin,
  signup,
  logout,
  verification
};
