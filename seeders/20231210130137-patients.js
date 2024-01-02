'use strict';
const bcrypt = require('bcrypt');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users',[
      {
        fullName: "Djilali",
        birthday: new Date('2001-05-09'),
        email: "ddernane44@gmail.com",
        password: await bcrypt.hash("123456",10),
        isactive: true,
        phone: "123445434",
        codePostal: "38020",
        sexe: "male",
        SSNum: "DJ748ASW938",
      }
    ])
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
