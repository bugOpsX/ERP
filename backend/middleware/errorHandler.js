/**
 * Global error handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[UNHANDLED ERROR]', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.'
  });
};

export default errorHandler;
