import path from 'path';
import XLSX from 'xlsx';
import ImporterRegistry from '../importers/registry/importerRegistry.js';

export const uploadService = {
  /**
   * Get available plant profiles for frontend dropdowns.
   */
  getAvailablePlants() {
    return ImporterRegistry.getAvailablePlants();
  },

  /**
   * Process, inspect, and validate uploaded attendance spreadsheet for a specific plant.
   * @param {Express.Multer.File} file - Multer uploaded file object.
   * @param {string} plantCode - Plant location code (e.g. 'PLANT_A').
   * @returns {Object} Inspection and validation results.
   */
  processAttendanceUpload(file, plantCode = 'PLANT_A') {
    const ext = path.extname(file.originalname).toLowerCase();
    const uploadId = file.filename.replace(ext, '');

    // Resolve plant profile
    const profile = ImporterRegistry.getProfile(plantCode);
    if (!profile) {
      return {
        success: false,
        valid: false,
        errors: [
          {
            code: 'UNKNOWN_PLANT',
            message: `Plant code "${plantCode}" is not recognized by the system.`,
          },
        ],
      };
    }

    // Check parser implementation
    let parser;
    try {
      parser = ImporterRegistry.getParserForPlant(plantCode);
    } catch (err) {
      return {
        success: false,
        valid: false,
        plant: {
          code: profile.code,
          name: profile.name,
          city: profile.city,
        },
        errors: [
          {
            code: 'PARSER_NOT_IMPLEMENTED',
            message: err.message,
          },
        ],
      };
    }

    // Read Excel workbook using SheetJS
    let workbook;
    try {
      workbook = XLSX.readFile(file.path);
    } catch (err) {
      return {
        success: false,
        valid: false,
        plant: {
          code: profile.code,
          name: profile.name,
          city: profile.city,
        },
        errors: [
          {
            code: 'FILE_READ_ERROR',
            message: `Unable to read Excel workbook: ${err.message}`,
          },
        ],
      };
    }

    // Inspect workbook with plant-specific parser
    const inspection = parser.inspect(workbook, file.originalname);

    if (!inspection.valid) {
      return {
        success: false,
        valid: false,
        plant: {
          code: profile.code,
          name: profile.name,
          city: profile.city,
        },
        format: {
          code: profile.formatCode,
        },
        errors: inspection.errors || [],
      };
    }

    return {
      success: true,
      valid: true,
      message: 'Attendance file uploaded and validated successfully',
      plant: {
        code: profile.code,
        name: profile.name,
        city: profile.city,
      },
      format: inspection.format,
      workbook: inspection.workbook,
      warnings: inspection.warnings || [],
      upload: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uploadId,
      },
    };
  },
};

export default uploadService;
