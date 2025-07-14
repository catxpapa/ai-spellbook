// Snippet 数据模型定义。
const db = require('../utils/db');

/**
 * 片段模型
 */
class Snippet {
  /**
   * 获取所有片段
   */
  static async getAll() {
    return await db.query(`
      SELECT s.*, GROUP_CONCAT(t.display_name) as tag_names
      FROM snippets s
      LEFT JOIN snippet_tags st ON s.id = st.snippet_id
      LEFT JOIN tags t ON st.tag_id = t.id
      GROUP BY s.id
      ORDER BY s.short_name
    `);
  }

  /**
   * 根据标签获取片段
   */
  static async getByTag(tagId) {
    return await db.query(`
      SELECT s.*
      FROM snippets s
      INNER JOIN snippet_tags st ON s.id = st.snippet_id
      WHERE st.tag_id = ?
      ORDER BY s.short_name
    `, [tagId]);
  }

  /**
   * 根据标签slug获取片段
   */
  static async getByTagSlug(tagSlug) {
    return await db.query(`
      SELECT s.*
      FROM snippets s
      INNER JOIN snippet_tags st ON s.id = st.snippet_id
      INNER JOIN tags t ON st.tag_id = t.id
      WHERE t.slug = ?
      ORDER BY s.short_name
    `, [tagSlug]);
  }

  /**
   * 创建新片段
   */
  static async create(snippetData) {
    const { short_name, content } = snippetData;
    const result = await db.query(
      'INSERT INTO snippets (short_name, content) VALUES (?, ?)',
      [short_name, content]
    );
    return result.insertId;
  }

  /**
   * 关联片段和标签
   */
  static async addTag(snippetId, tagId) {
    await db.query(
      'INSERT IGNORE INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
      [snippetId, tagId]
    );
  }
}

module.exports = Snippet;