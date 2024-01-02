'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('ProviderSpecialties', 'providerId', {
        type: Sequelize.INTEGER,
        //allowNull: false,
        references: {
          model: 'Providers',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      await queryInterface.addColumn('ProviderSpecialties', 'SpecialtyId', {
        type: Sequelize.INTEGER,
        //allowNull: false,
        references: {
          model: 'Specialties',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('ProviderSpecialties', 'SpecialtyId');
    await queryInterface.removeColumn('ProviderSpecialties', 'providerId')
  }
};
