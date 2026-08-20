import { query } from '../db/index.js';

export const SiteModel = {
  /**
   * Get all registered plant sites.
   */
  async findAll() {
    const res = await query('SELECT * FROM sites ORDER BY code ASC');
    return res.rows;
  },

  /**
   * Find a site by its site code (e.g., 'BF-2').
   * @param {string} code
   */
  async findByCode(code) {
    const res = await query('SELECT * FROM sites WHERE code = $1', [code]);
    return res.rows[0] || null;
  },

  /**
   * Create a new site.
   * @param {string} code
   * @param {string} name
   */
  async create(code, name) {
    const res = await query(
      'INSERT INTO sites (code, name) VALUES ($1, $2) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = CURRENT_TIMESTAMP RETURNING *',
      [code, name]
    );
    return res.rows[0];
  },
};

export default SiteModel;
