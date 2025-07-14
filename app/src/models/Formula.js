const db = require('../utils/db');

/**
 * 公式模型 - 管理提示词公式模板
 */
class Formula {
  /**
   * 获取所有公式
   * @param {Object} options 查询选项
   * @param {number} options.modelId 模型ID筛选
   * @param {string} options.search 搜索关键词
   * @param {number} options.limit 分页限制
   * @param {number} options.offset 分页偏移
   * @returns {Promise<Array>} 公式列表
   */
  static async getAll(options = {}) {
    const { modelId, search, limit = 100, offset = 0 } = options;
    
    let sql = `
      SELECT f.*, GROUP_CONCAT(m.name) as model_names
      FROM formulas f
      LEFT JOIN formula_models fm ON f.id = fm.formula_id
      LEFT JOIN models m ON fm.model_id = m.id
    `;
    
    let whereConditions = [];
    let params = [];
    
    // 按模型筛选
    if (modelId) {
      whereConditions.push('fm.model_id = ?');
      params.push(modelId);
    }
    
    // 搜索功能
    if (search) {
      whereConditions.push('(f.short_name LIKE ? OR f.template_text LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    sql += `
      GROUP BY f.id
      ORDER BY f.short_name
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);
    
    const results = await db.query(sql, params);
    
    // 处理模型名称字符串
    return results.map(formula => ({
      ...formula,
      model_names: formula.model_names ? formula.model_names.split(',') : []
    }));
  }

  /**
   * 根据ID获取公式
   * @param {number} id 公式ID
   * @returns {Promise<Object|null>} 公式信息
   */
  static async getById(id) {
    const result = await db.query(`
      SELECT f.*, GROUP_CONCAT(m.name) as model_names
      FROM formulas f
      LEFT JOIN formula_models fm ON f.id = fm.formula_id
      LEFT JOIN models m ON fm.model_id = m.id
      WHERE f.id = ?
      GROUP BY f.id
    `, [id]);
    
    if (result.length === 0) return null;
    
    const formula = result[0];
    formula.model_names = formula.model_names ? formula.model_names.split(',') : [];
    
    return formula;
  }

  /**
   * 创建新公式
   * @param {Object} formulaData 公式数据
   * @param {string} formulaData.short_name 公式简称
   * @param {string} formulaData.template_text 模板文本
   * @param {Array} formulaData.model_ids 关联的模型ID数组
   * @returns {Promise<number>} 新创建的公式ID
   */
  static async create(formulaData) {
    const { short_name, template_text, model_ids = [] } = formulaData;
    
    // 插入公式
    const result = await db.query(
      'INSERT INTO formulas (short_name, template_text) VALUES (?, ?)',
      [short_name, template_text]
    );
    
    const formulaId = result.insertId;
    
    // 关联模型
    if (model_ids.length > 0) {
      await this.updateModelAssociations(formulaId, model_ids);
    }
    
    return formulaId;
  }

  /**
   * 更新公式模型关联
   * @param {number} formulaId 公式ID
   * @param {Array} modelIds 模型ID数组
   * @returns {Promise<void>}
   */
  static async updateModelAssociations(formulaId, modelIds) {
    // 删除现有关联
    await db.query('DELETE FROM formula_models WHERE formula_id = ?', [formulaId]);
    
    // 添加新关联
    if (modelIds.length > 0) {
      const values = modelIds.map(modelId => [formulaId, modelId]);
      const placeholders = values.map(() => '(?, ?)').join(', ');
      const flatValues = values.flat();
      
      await db.query(
        `INSERT INTO formula_models (formula_id, model_id) VALUES ${placeholders}`,
        flatValues
      );
    }
  }

  /**
   * 更新公式
   * @param {number} id 公式ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<boolean>} 是否更新成功
   */
  static async update(id, updateData) {
    const { short_name, template_text, model_ids } = updateData;
    
    // 更新公式基本信息
    const result = await db.query(
      'UPDATE formulas SET short_name = ?, template_text = ? WHERE id = ?',
      [short_name, template_text, id]
    );
    
    // 更新模型关联
    if (model_ids !== undefined) {
      await this.updateModelAssociations(id, model_ids);
    }
    
    return result.affectedRows > 0;
  }

  /**
   * 删除公式
   * @param {number} id 公式ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  static async delete(id) {
    const result = await db.query('DELETE FROM formulas WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * 检查公式是否已存在
   * @param {string} short_name 公式简称
   * @param {number} excludeId 排除的ID
   * @returns {Promise<boolean>} 是否已存在
   */
  static async exists(short_name, excludeId = null) {
    let sql = 'SELECT COUNT(*) as count FROM formulas WHERE short_name = ?';
    let params = [short_name];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const result = await db.query(sql, params);
    return result[0].count > 0;
  }

  /**
   * 解析公式中的标签占位符
   * @param {string} templateText 模板文本
   * @returns {Array} 标签数组
   */
  static parseTemplateTags(templateText) {
    const tagRegex = /#([^#\s]+)/g;
    const tags = [];
    let match;
    
    while ((match = tagRegex.exec(templateText)) !== null) {
      if (!tags.includes(match[1])) {
        tags.push(match[1]);
      }
    }
    
    return tags;
  }

  /**
   * 根据选择的片段组合最终提示词
   * @param {string} templateText 模板文本
   * @param {Object} selectedSnippets 选择的片段 {tagSlug: snippetContent}
   * @returns {string} 组合后的提示词
   */
  static composePrompt(templateText, selectedSnippets) {
    let result = templateText;
    
    // 替换所有标签占位符
    for (const [tagSlug, snippetContent] of Object.entries(selectedSnippets)) {
      const tagPattern = new RegExp(`#${tagSlug}\\b`, 'g');
      result = result.replace(tagPattern, snippetContent);
    }
    
    return result;
  }
}

module.exports = Formula;