import historicalService from '../services/historical.service.js';

export const getAvailablePeriods = async (req, res, next) => {
  try {
    const { plantCode = 'PLANT_A' } = req.query;
    const periods = await historicalService.getAvailablePeriods(plantCode);
    return res.status(200).json({
      success: true,
      periods,
    });
  } catch (err) {
    next(err);
  }
};

export const getMonthlySummary = async (req, res, next) => {
  try {
    const { plantCode = 'PLANT_A', year, month, unit = 'ALL' } = req.query;
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: year and month',
      });
    }

    const summary = await historicalService.getMonthlySummary({ plantCode, year, month, unit });
    return res.status(200).json({
      success: true,
      plantCode,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      unit,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkers = async (req, res, next) => {
  try {
    const { plantCode = 'PLANT_A', year, month, unit = 'ALL' } = req.query;
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: year and month',
      });
    }

    const workers = await historicalService.getWorkers({ plantCode, year, month, unit });
    return res.status(200).json({
      success: true,
      plantCode,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      unit,
      count: workers.length,
      workers,
    });
  } catch (err) {
    next(err);
  }
};

export const getHistoricalAttendance = async (req, res, next) => {
  try {
    const { plantCode = 'PLANT_A', year, month, unit = 'ALL' } = req.query;
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: year and month',
      });
    }

    const workers = await historicalService.getHistoricalAttendance({ plantCode, year, month, unit });
    return res.status(200).json({
      success: true,
      plantCode,
      year: parseInt(year, 10),
      month: parseInt(month, 10),
      unit,
      totalWorkers: workers.length,
      workers,
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getAvailablePeriods,
  getMonthlySummary,
  getWorkers,
  getHistoricalAttendance,
};
