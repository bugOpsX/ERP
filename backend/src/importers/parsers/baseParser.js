/**
 * Abstract Base Parser interface for Attendance Import Architecture.
 * All plant-specific parsers must extend or implement this contract.
 */
export class BaseParser {
  constructor(options = {}) {
    this.name = options.name || 'BaseParser';
    this.formatCode = options.formatCode || 'GENERIC';
  }

  /**
   * Validate workbook structure, sheet existence, and required columns.
   * @param {Object} workbook - SheetJS workbook instance.
   * @returns {Object} { valid: boolean, errors: Array<{code: string, message: string}> }
   */
  validate(workbook) {
    throw new Error(`validate() method must be implemented by ${this.name}`);
  }

  /**
   * Inspect workbook details, sheet record counts, and detected period.
   * @param {Object} workbook - SheetJS workbook instance.
   * @param {string} fileName - Original file name.
   * @returns {Object} Inspection metadata.
   */
  inspect(workbook, fileName = '') {
    throw new Error(`inspect() method must be implemented by ${this.name}`);
  }

  /**
   * Parse full workbook data into normalized attendance contract.
   * @param {Object} workbook - SheetJS workbook instance.
   * @returns {Object} Normalized attendance model.
   */
  parse(workbook) {
    throw new Error(`parse() method must be implemented by ${this.name}`);
  }
}

export default BaseParser;
