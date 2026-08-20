import KamlaV1Parser from '../parsers/kamlaV1Parser.js';

/**
 * Plant Profiles Registry.
 * Holds conceptual configuration for current and future plants.
 */
export const PLANT_PROFILES = {
  PLANT_A: {
    code: 'PLANT_A',
    name: 'Kamla Enterprises Plant',
    city: 'Surat',
    state: 'Gujarat',
    description: 'Current Plant Location (BF-2 and BF-3 Units in Surat, Gujarat)',
    formatCode: 'KAMLA_V1',
    supportedUnits: ['BF-2', 'BF-3'],
    parserClass: KamlaV1Parser,
    isImplemented: true,
  },
  PLANT_B: {
    code: 'PLANT_B',
    name: 'Future Plant Location',
    city: 'Other City',
    description: 'Placeholder for Future Plant Location',
    formatCode: 'PLANT_B_V1',
    supportedUnits: ['UNIT-1'],
    parserClass: null,
    isImplemented: false,
  },
};

export default PLANT_PROFILES;
