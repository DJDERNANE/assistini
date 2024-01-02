'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rdv extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Rdv.belongsTo(models.provider);
      Rdv.belongsTo(models.User);
      Rdv.belongsTo(models.Rdv_motif);
    }
  }
  Rdv.init({
    patientName: DataTypes.STRING,
    status: DataTypes.ENUM('pending', 'canceled', 'closed', 'confirmed'),
    mode: DataTypes.ENUM('En video', 'Au Cabinet', 'A domicile')
  }, {
    sequelize,
    modelName: 'Rdv',
  });
  return Rdv;
};