// Tag 数据模型定义。
const db = require('../utils/db');

/**
 * 标签模型
 */
class Tag {
  /**
   * 获取所有标签
   */
  static async getAll() {
    return await db.query('SELECT * FROM tags ORDER BY display_name');
  }

  /**
   * 根据ID获取标签
   */
  static async getById(id) {
    const result = await db.query('SELECT * FROM tags WHERE id = ?', [id]);
    return result[0];
  }

  /**
   * 根据slug获取标签
   */
  static async getBySlug(slug) {
    const result = await db.query('SELECT * FROM tags WHERE slug = ?', [slug]);
    return result[0];
  }

  /**
   * 创建新标签
   */
  static async create(tagData) {
    const { slug, display_name, is_multi_select = false } = tagData;
    const result = await db.query(
      'INSERT INTO tags (slug, display_name, is_multi_select) VALUES (?, ?, ?)',
      [slug, display_name, is_multi_select]
    );
    return result.insertId;
  }
}

module.exports = Tag;