import KamlaV1Parser from '../parsers/kamlaV1Parser.js';
import KorbaV1Parser from '../parsers/korbaV1Parser.js';

/**
 * Plant Profiles Registry.
 * Holds configuration for supported plants across Kamla Enterprises.
 */
export const PLANT_PROFILES = {
  PLANT_A: {
    code: 'PLANT_A',
    name: 'Kamla Enterprises Plant',
    city: 'Surat',
    state: 'Gujarat',
    description: 'Surat Plant Location (BF-2 and BF-3 Units in Surat, Gujarat)',
    formatCode: 'KAMLA_V1',
    supportedUnits: ['BF-2', 'BF-3'],
    parserClass: KamlaV1Parser,
    isImplemented: true,
    attendanceType: 'PUNCH_BASED',
  },
  PLANT_B: {
    code: 'PLANT_B',
    name: 'Kamla Enterprises Plant',
    city: 'Korba',
    state: 'Chhattisgarh',
    description: 'Korba Plant Location (Korba Site / Main Workforce)',
    formatCode: 'KORBA_V1',
    supportedUnits: ['KORBA-MAIN'],
    parserClass: KorbaV1Parser,
    isImplemented: true,
    attendanceType: 'MD_OT_BASED',
  },
};

export default PLANT_PROFILES;
