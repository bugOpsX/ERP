import PLANT_PROFILES from '../profiles/plantProfiles.js';

export class ImporterRegistry {
  /**
   * Get list of all registered plant profiles for UI dropdowns.
   * @returns {Array<Object>} Public plant information list.
   */
  static getAvailablePlants() {
    return Object.values(PLANT_PROFILES).map((profile) => ({
      code: profile.code,
      name: profile.name,
      city: profile.city,
      state: profile.state,
      description: profile.description,
      supportedUnits: profile.supportedUnits,
      formatCode: profile.formatCode,
      attendanceType: profile.attendanceType,
      isImplemented: profile.isImplemented,
    }));
  }

  /**
   * Get plant profile metadata by code.
   * @param {string} plantCode
   * @returns {Object|null}
   */
  static getProfile(plantCode) {
    if (!plantCode) return PLANT_PROFILES.PLANT_A; // Default fallback to Plant A
    const key = String(plantCode).trim().toUpperCase();
    return PLANT_PROFILES[key] || null;
  }

  /**
   * Instantiate and return the parser assigned to a plant profile.
   * @param {string} plantCode
   * @returns {BaseParser} Parser instance
   */
  static getParserForPlant(plantCode) {
    const profile = this.getProfile(plantCode);
    if (!profile) {
      throw new Error(`Unknown plant code "${plantCode}".`);
    }

    if (!profile.isImplemented || !profile.parserClass) {
      throw new Error(
        `Attendance Excel parser for plant "${profile.name}" (${profile.code}) is not implemented yet.`
      );
    }

    return new profile.parserClass();
  }
}

export default ImporterRegistry;
