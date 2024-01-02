'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('disponibilties', 'providerId', {
      type: Sequelize.INTEGER,
      //allowNull: false,
      references: {
        model: 'providers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.removeColumn('disponibilties', 'providerId')
  }
};
