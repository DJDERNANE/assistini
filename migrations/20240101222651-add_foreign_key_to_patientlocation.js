'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('PatientLocations', 'User_Id', {
        type: Sequelize.INTEGER,
        //allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('PatientLocations', 'User_Id')
  }
};
