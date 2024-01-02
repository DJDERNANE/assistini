'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Categories', [{
      name: "Consultation Médicale"
    },
    {
      name: "Hospitalisation"
    },
    {
      name: "Maternité"
    },
    {
      name: "Dentaire"
    },
    {
      name: "Optique"
    }
    ,
    {
      name: "Pharmacie"
    }
    ,{
      name: "Analyse médicale"
    },
    {
      name: "Acte d'exploration"
    }]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Categories', null, {});
  }
};
