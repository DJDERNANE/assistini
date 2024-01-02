'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Rdvs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      patientName: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.ENUM('pending', 'canceled', 'closed', 'confirmed'),
        defaultValue: 'pending'
      },
      mode: {
        type: Sequelize.ENUM('En video', 'Au Cabinet', 'A domicile'),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Rdvs');
  }
};