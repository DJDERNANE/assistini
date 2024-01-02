'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Specialties', [{
      CategoryId: 1,
      name: "Allergologie"
    },
    {
      CategoryId: 1,
      name: "Anatomie et cytologie pathologiques"
    },
    {
      CategoryId: 1,
      name: "Andrologie"
    },
    {
      CategoryId: 1,
      name: "Anatomie et cytologie pathologiques"
    },
    {
      CategoryId: 1,
      name: "Anesthésiologie"
    },
    {
      CategoryId: 1,
      name: "Cardiologie"
    },
    {
      CategoryId: 1,
      name: "Chirurgie"
    },
    {
      CategoryId: 1,
      name: "Dermatologie"
    },
    {
      CategoryId: 1,
      name: "Endocrinologie"
    },
    {
      CategoryId: 1,
      name: "Gastro-entérologie"
    },
    {
      CategoryId: 1,
      name: "Gériatrie"
    },
    {
      CategoryId: 1,
      name: "Gynécologie"
    },
    {
      CategoryId: 1,
      name: "Hématologie"
    },
    {
      CategoryId: 1,
      name: "Immunologie"
    },
    {
      CategoryId: 1,
      name: "Infectiologie"
    },

    {
      CategoryId: 1,
      name: "Médecine aiguë"
    },
    {
      CategoryId: 1,
      name: "Médecine du travail"
    },
    {
      CategoryId: 1,
      name: "Médecine d’urgence"
    },
    {
      CategoryId: 1,
      name: "Médecine générale"
    },
    {
      CategoryId: 1,
      name: "Immunologie"
    },
    {
      CategoryId: 1,
      name: "Médecine interne"
    },
    {
      CategoryId: 1,
      name: "Médecine nucléaire"
    },
    {
      CategoryId: 1,
      name: "Médecine palliative"
    },
    {
      CategoryId: 1,
      name: "Médecine physique et de réadaptation"
    },
    {
      CategoryId: 1,
      name: "Médecine préventive"
    },
    {
      CategoryId: 1,
      name: "Néonatologie"
    },
    {
      CategoryId: 1,
      name: "Neurologie"
    },
    {
      CategoryId: 1,
      name: "Obstétrique"
    },
    {
      CategoryId: 1,
      name: "Odontologie"
    },
    {
      CategoryId: 1,
      name: "Oncologie"
    },
    {
      CategoryId: 1,
      name: "Ophtalmologie"
    },
    {
      CategoryId: 1,
      name: "Orthopédie"
    },
    {
      CategoryId: 1,
      name: "Oto-rhino-laryngologie"
    },
    {
      CategoryId: 1,
      name: "Pédiatrie"
    },
    {
      CategoryId: 1,
      name: "Pneumologie"
    },

    {
      CategoryId: 1,
      name: "Psychiatrie"
    },
    {
      CategoryId: 1,
      name: "Radiologie"
    },
    {
      CategoryId: 1,
      name: "Radiothérapie"
    },
    {
      CategoryId: 1,
      name: "Réanimation"
    },
    {
      CategoryId: 1,
      name: "Rhumatologie"
    },
    {
      CategoryId: 1,
      name: "Urologie"
    },
    {
      CategoryId: 2,
      name: "Médicale"
    },
    {
      CategoryId: 2,
      name: "Chirurgicale"
    },
    {
      CategoryId: 3,
      name: " Accouchement par voie basse"
    },
    {
      CategoryId: 3,
      name: "Césarienne"
    },
    {
      CategoryId: 3,
      name: "Accouchement sans douleur"
    },
    {
      CategoryId: 3,
      name: "Accouchement à domicile"
    },
    {
      CategoryId: 3,
      name: "Accouchement dans l'eau"
    },
    {
      CategoryId: 4,
      name: "Sois dentaires"
    },
    {
      CategoryId: 4,
      name: "Prothèses dentaires"
    },
    {
      CategoryId: 5,
      name: "Opticiens"
    },
    {
      CategoryId: 6,
      name: "Pharmacies"
    },
    {
      CategoryId: 6,
      name: "Phamacies de garde"
    },
    {
      CategoryId: 7,
      name: "Laboratoires d'analyses médicales"
    },
    {
      CategoryId: 8,
      name: "Radiologie"
    },
    {
      CategoryId: 8,
      name: "Echographie"
    },
    {
      CategoryId: 8,
      name: "IRM"
    },
    {
      CategoryId: 8,
      name: "Scanner"
    },
   ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkDelete('Specialties', null, {});
  }
};
