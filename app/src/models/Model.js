// Model 类别数据模型定义。
const db = require('../utils/db');

/**
 * 模型类 - 管理AI模型信息
 */
class Model {
  /**
   * 获取所有模型
   * @returns {Promise<Array>} 模型列表
   */
  static async getAll() {
    return await db.query(`
      SELECT * FROM models 
      ORDER BY name, version
    `);
  }

  /**
   * 根据ID获取模型
   * @param {number} id 模型ID
   * @returns {Promise<Object|null>} 模型信息
   */
  static async getById(id) {
    const result = await db.query('SELECT * FROM models WHERE id = ?', [id]);
    return result[0] || null;
  }

  /**
   * 根据名称获取模型
   * @param {string} name 模型名称
   * @returns {Promise<Array>} 模型列表
   */
  static async getByName(name) {
    return await db.query('SELECT * FROM models WHERE name = ? ORDER BY version', [name]);
  }

  /**
   * 创建新模型
   * @param {Object} modelData 模型数据
   * @param {string} modelData.name 模型名称
   * @param {string} modelData.version 版本号
   * @returns {Promise<number>} 新创建的模型ID
   */
  static async create(modelData) {
    const { name, version = '1.0' } = modelData;
    const result = await db.query(
      'INSERT INTO models (name, version) VALUES (?, ?)',
      [name, version]
    );
    return result.insertId;
  }

  /**
   * 更新模型信息
   * @param {number} id 模型ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, updateData) {
    const { name, version } = updateData;
    const result = await db.query(
      'UPDATE models SET name = ?, version = ? WHERE id = ?',
      [name, version, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * 删除模型
   * @param {number} id 模型ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM models WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 获取模型关联的公式数量
   * @param {number} modelId 模型ID
   * @returns {Promise<number>} 关联的公式数量
   */
  static async getFormulaCount(modelId) {
    const result = await db.query(`
      SELECT COUNT(*) as count 
      FROM formula_models 
      WHERE model_id = ?
    `, [modelId]);
    return result[0].count;
  }

  /**
   * 获取模型关联的所有公式
   * @param {number} modelId 模型ID
   * @returns {Promise<Array>} 公式列表
   */
  static async getFormulas(modelId) {
    return await db.query(`
      SELECT f.* 
      FROM formulas f
      INNER JOIN formula_models fm ON f.id = fm.formula_id
      WHERE fm.model_id = ?
      ORDER BY f.short_name
    `, [modelId]);
  }

  /**
   * 检查模型名称是否已存在
   * @param {string} name 模型名称
   * @param {string} version 版本号
   * @param {number} excludeId 排除的ID（用于更新时检查）
   * @returns {Promise<boolean>} 是否已存在
   */
  static async exists(name, version, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM models WHERE name = ? AND version = ?';
    let params = [name, version];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await db.query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 获取模型统计信息
   * @returns {Promise<Object>} 统计信息
   */
  static async getStats() {
    const [totalCount] = await db.query('SELECT COUNT(*) as count FROM models');
    const [formulaStats] = await db.query(`
      SELECT 
        m.name,
        m.version,
        COUNT(fm.formula_id) as formula_count
      FROM models m
      LEFT JOIN formula_models fm ON m.id = fm.model_id
      GROUP BY m.id, m.name, m.version
      ORDER BY formula_count DESC
    `);
    
    return {
      total_models: totalCount.count,
      model_formula_stats: formulaStats
    };
  }
}

module.exports = Model;