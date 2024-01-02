'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Rdvs', 'providerId', {
      type: Sequelize.INTEGER,
      //allowNull: false,
      references: {
        model: 'Providers',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addColumn('Rdvs', 'UserId', {
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
    await queryInterface.removeColumn('Rdvs', 'providerId');
    await queryInterface.removeColumn('Rdvs', 'UserId');
   
  }
};
