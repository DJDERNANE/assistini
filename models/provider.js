'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class provider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      provider.belongsToMany(models.Specialty, { through: models.ProviderSpecialty, as: "Specialties",foreignKey: "providerId" });
      provider.hasMany(models.Rdv, {foreignKey: "providerId"});
      provider.hasMany(models.disponibilty, { foreignKey: 'providerId' });
      provider.hasOne(models.ProviderLocation, {
        foreignKey: 'Provider_Id'
      });
    }
  }
  provider.init({
    fullName: DataTypes.STRING,
    cabinName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    address: DataTypes.STRING,
    localisation: DataTypes.STRING,
    phone: DataTypes.STRING,
    isactive: DataTypes.BOOLEAN,
    desc: DataTypes.STRING,
    verified: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'provider',
  });
  return provider;
};