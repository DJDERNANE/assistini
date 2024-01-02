'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.hasMany(models.Rdv, {foreignKey: "userId"})
      User.hasOne(models.PatientLocation, {
        foreignKey: 'User_Id'
      });
    }
  }
  User.init({
    fullName: DataTypes.STRING,
    birthday: DataTypes.DATE,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    isactive: DataTypes.BOOLEAN,
    phone: DataTypes.INTEGER,
    codePostal: DataTypes.INTEGER,
    sexe: DataTypes.STRING,
    SSNum: DataTypes.STRING,
    resetPass: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};