const bcrypt = require('bcrypt');
const crypto = require('crypto-random-string');
const nodemailer = require('nodemailer');
const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

module.exports = function(passport, models) {
  const User = models.User;
  const VerificationToken = models.VerificationToken;

  passport.use(
    'local-signup',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      function(req, email, password, done) {
        User.findOne({
          where: {
            email: email
          }
        }).then(async function(user) {
          if (user) {
            return done(null, false, {
              message: 'Your email is already registered.'
            });
          } else {
            try {
              const userPassword = await promiseWrapper((resolve, reject) => {
                bcrypt.hash(password, 8, (err, hash) => {
                  if (err) {
                    reject(err);
                  }
                  resolve(hash);
                });
              });

              const data = {
                email: email,
                password: userPassword,
                firstname: req.body.firstname,
                lastname: req.body.lastname
              };

              User.create(data).then(function(newUser, created) {
                if (!newUser) {
                  return done(null, false, {
                    message: 'Error when creating an account.'
                  });
                }

                if (newUser) {
                  VerificationToken.create({
                    UserId: newUser.id,
                    token: crypto({ length: 30 })
                  })
                    .then(result => {
                      try {
                        sendVerificationEmail(newUser.email, result.token);
                        return done(null, newUser);
                      } catch (err) {
                        return done(null, false, {
                          message: 'Error when seding an verifaction email.'
                        });
                      }
                    })
                    .catch(error => {
                      return done(null, false, {
                        message: 'Error when creating an verification token.'
                      });
                    });
                }
              });
            } catch (err) {
              return done(null, false, {
                message: 'Error when signing up'
              });
            }
          }
        });
      }
    )
  );

  passport.use(
    'local-signin',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      function(req, email, password, done) {
        const isValidPassword = async function(userpass, enteredPassword) {
          return await promiseWrapper((resolve, reject) => {
            bcrypt.compare(enteredPassword, userpass, (err, isMatch) => {
              if (err) {
                return reject(err);
              }

              if (!isMatch) {
                return reject(false);
              }

              resolve(true);
            });
          });
        };

        User.findOne({
          where: {
            email: email
          }
        })
          .then(async function(user) {
            if (!user) {
              return done(null, false, {
                message: "Can't find your account."
              });
            }

            if (!user.isVerified) {
              return done(null, false, {
                message: 'Email verfication is required.'
              });
            }

            try {
              await isValidPassword(user.password, password);
              const userInfo = user.get();
              return done(null, userInfo);
            } catch (err) {
              return done(null, false, { message: 'Wrong password.' });
            }
          })
          .catch(function(err) {
            return done(null, false, {
              message: 'Error when signing in.'
            });
          });
      }
    )
  );

  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: process.env.JWT_SECRET
      },
      function(jwtPayload, done) {
        User.findOne({
          where: {
            email: jwtPayload.email
          }
        })
          .then(function(user) {
            const userInfo = user.get();
            return done(null, userInfo);
          })
          .catch(function(err) {
            return done(null, false);
          });
      }
    )
  );

  //serialize
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // deserialize user
  passport.deserializeUser(function(id, done) {
    User.findByPk(id).then(function(user) {
      if (user) {
        done(null, user.get());
      } else {
        done(user.errors, null);
      }
    });
  });
};

const promiseWrapper = callback =>
  new Promise((resolve, reject) => {
    callback(resolve, reject);
  });

const sendVerificationEmail = (to, token) => {
  const hostUrl = process.env.HOST_URL;
  let transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  return new Promise((resolve, reject) => {
    transporter.sendMail(
      {
        from: process.env.EMAIL_USER,
        to: to,
        subject: 'Email verfication',
        html: `<p>Verify your account</p>
          <p><a href="${hostUrl}/api/verification?token=${token}&email=${to}">Verify</a></p>
          `
      },
      (err, info, response) => {
        if (err) {
          return reject(err);
        }

        return resolve(response);
      }
    );
  });
};
