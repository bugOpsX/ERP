import databaseService from '../services/database.service.js';

export const getDbHealth = async (req, res, next) => {
  try {
    const health = await databaseService.getHealthStatus();
    if (health.status === 'healthy') {
      return res.status(200).json(health);
    }
    return res.status(503).json(health);
  } catch (err) {
    next(err);
  }
};
