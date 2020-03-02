module.exports = function(sequelize, DataTypes) {
  const User = sequelize.define('User', {
    firstname: {
      type: DataTypes.STRING,
      notEmpty: true
    },

    lastname: {
      type: DataTypes.STRING,
      notEmpty: true
    },

    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true
      }
    },

    password: {
      type: DataTypes.STRING,
      allowNull: false
    },

    isVerified: {
      type: DataTypes.BOOLEAN
    },

    isEmailAllowed: {
      type: DataTypes.BOOLEAN
    }
  });

  User.associate = function(models) {
    models.User.hasOne(models.VerificationToken);
  };

  return User;
};
