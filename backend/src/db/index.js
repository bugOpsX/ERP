import pool from '../config/database.js';

/**
 * Execute a SQL query using the connection pool.
 * @param {string} text - The SQL query string.
 * @param {Array} params - Query parameters.
 * @returns {Promise<import('pg').QueryResult>} Query result object.
 */
export const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client from the pool for transactions.
 * @returns {Promise<import('pg').PoolClient>} Pool client.
 */
export const getClient = () => pool.connect();

export default {
  query,
  getClient,
  pool,
};
