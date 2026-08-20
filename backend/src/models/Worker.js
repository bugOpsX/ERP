import { query } from '../db/index.js';

export const WorkerModel = {
  /**
   * Find a worker by blast_furnace and wisa ID.
   * @param {string} blastFurnace
   * @param {string|number} wisa
   */
  async findByFurnaceAndWisa(blastFurnace, wisa) {
    const res = await query(
      'SELECT * FROM workers WHERE blast_furnace = $1 AND wisa = $2',
      [blastFurnace, String(wisa)]
    );
    return res.rows[0] || null;
  },

  /**
   * Upsert a worker record based on blast_furnace + wisa.
   * @param {Object} workerData
   * @param {import('pg').PoolClient} [client] - Optional transaction client.
   */
  async upsert(workerData, client = null) {
    const { gatePass, wisa, name, designation, department, blastFurnace, siteId } = workerData;
    const sql = `
      INSERT INTO workers (gate_pass, wisa, name, designation, department, blast_furnace, site_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (blast_furnace, wisa) DO UPDATE SET
        gate_pass = EXCLUDED.gate_pass,
        name = EXCLUDED.name,
        designation = EXCLUDED.designation,
        department = EXCLUDED.department,
        site_id = COALESCE(EXCLUDED.site_id, workers.site_id),
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const values = [gatePass, String(wisa), name, designation, department, blastFurnace, siteId || null];
    const res = client ? await client.query(sql, values) : await query(sql, values);
    return res.rows[0];
  },

  /**
   * Find all workers for a specific blast furnace unit.
   * @param {string} [blastFurnace]
   */
  async findAll(blastFurnace = null) {
    if (blastFurnace && blastFurnace.toUpperCase() !== 'ALL') {
      const res = await query('SELECT * FROM workers WHERE blast_furnace = $1 ORDER BY name ASC', [blastFurnace]);
      return res.rows;
    }
    const res = await query('SELECT * FROM workers ORDER BY name ASC');
    return res.rows;
  },
};

export default WorkerModel;
