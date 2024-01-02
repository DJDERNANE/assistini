'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rdv_motif extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Rdv_motif.hasMany(models.Rdv, {foreignKey: "RdvMotifId"})
    }
  }
  Rdv_motif.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Rdv_motif',
  });
  return Rdv_motif;
};