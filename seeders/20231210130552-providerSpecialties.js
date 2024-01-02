
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ProviderSpecialties',[
      {
        name:'aaa',
        providerId:  1,
        SpecialtyId: 10
      },
      {
        name:'bbbbbbbb',
        providerId:  2,
        SpecialtyId: 4
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProviderSpecialties', null, {})
  }
};
