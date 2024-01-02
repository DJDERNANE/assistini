'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class disponibilty extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      disponibilty.belongsTo(models.provider)
    }
  }
  disponibilty.init({
    day: DataTypes.STRING,
    startTime: DataTypes.STRING,
    endTime: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'disponibilty',
  });
  return disponibilty;
};