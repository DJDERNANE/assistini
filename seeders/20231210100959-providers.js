
'use strict';


/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('providers', [{
      fullName: "Ahmed Mohamed",
      cabinName: "Ihcen",
      email: "djder19@gmail.com",
      password: "123456",
      address: "Eucalypus, Algiers",
      localisation: "https://hdsfjdsds.maps.com/ewedw/ferf/vr",
      phone: "12345678",
      isactive: true,
      desc: "description description descrription desc desc desc desc desc ",
      verified: true
    },
    {
      fullName: "AAA BBB",
      cabinName: "badr",
      email: "derndjilali38@gmail.com",
      password: "123456",
      address: "bordj, Tissemsilet",
      localisation: "https://hdsfjdsds.maps.com/ewedw/ferf/vr",
      phone: "83924328",
      isactive: true,
      desc: "description description descrription desc desc desc desc desc ",
      verified: true
    }

  ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('providers', null, {});
  }
};
