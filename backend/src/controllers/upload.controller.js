import uploadService from '../services/upload.service.js';
import importEngineService from '../services/importEngine.service.js';

/**
 * Handle listing available plants for frontend selection.
 */
export const getAvailablePlants = async (req, res, next) => {
  try {
    const plants = uploadService.getAvailablePlants();
    return res.status(200).json({
      success: true,
      plants,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 1: Upload attendance spreadsheet, validate, and return preview + uploadId session.
 */
export const uploadAttendanceFile = async (req, res, next) => {
  try {
    const plantCode = req.body.plantCode || req.body.plantId || 'PLANT_A';
    const result = await importEngineService.createUploadSession(req.file, plantCode);

    // Return 200 for valid uploads, 422 for invalid workbook structure
    const statusCode = result.valid ? 200 : 422;
    return res.status(statusCode).json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Step 2: Execute transactional database import for a validated uploadId session.
 */
export const executeAttendanceImport = async (req, res, next) => {
  try {
    const { uploadId } = req.params;
    const { plantCode = 'PLANT_A', replaceExisting = false } = req.body;

    const result = await importEngineService.executeImport(uploadId, {
      plantCode,
      replaceExisting: !!replaceExisting,
    });

    return res.status(200).json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        isDuplicate: !!err.isDuplicate,
      });
    }
    next(err);
  }
};

/**
 * Step 3: Fetch import history logs.
 */
export const getImportHistory = async (req, res, next) => {
  try {
    const { plantCode, year, month, status } = req.query;
    const history = await importEngineService.getImportHistory({
      plantCode,
      year,
      month,
      status,
    });

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Step 4: Fetch detailed breakdown for a single import record.
 */
export const getImportDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const details = await importEngineService.getImportDetails(id);

    return res.status(200).json({
      success: true,
      details,
    });
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }
    next(err);
  }
};
