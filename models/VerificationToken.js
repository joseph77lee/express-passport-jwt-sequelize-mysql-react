module.exports = function(sequelize, DataTypes) {
  const VerificationToken = sequelize.define('VerificationToken', {
    token: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  VerificationToken.associate = function(models) {
    models.VerificationToken.belongsTo(models.User);
  };

  return VerificationToken;
};
