// 数据库连接和辅助函数。
const mysql = require('mysql2/promise');
const dbConfig = require('../config/database');

/**
 * 数据库连接池
 */
let pool = null;

/**
 * 初始化数据库连接池
 */
function initPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('数据库连接池已初始化');
  }
  return pool;
}

/**
 * 执行SQL查询
 * @param {string} sql SQL语句
 * @param {Array} params 参数数组
 * @returns {Promise<Array>} 查询结果
 */
async function query(sql, params = []) {
  let connection = null;
  try {
    const pool = initPool();
    connection = await pool.getConnection();
    const [rows] = await connection.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('SQL执行失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * 初始化数据库表结构
 */
async function initTables() {
  try {
    console.log('开始初始化数据库表结构...');

    // 创建models表 [citation](5)
    await query(`
      CREATE TABLE IF NOT EXISTS models (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        version VARCHAR(50) DEFAULT '1.0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建tags表 [citation](5)[citation](6)
    await query(`
      CREATE TABLE IF NOT EXISTS tags (
        id INT PRIMARY KEY AUTO_INCREMENT,
        slug VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        is_multi_select BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建snippets表 [citation](5)[citation](6)
    await query(`
      CREATE TABLE IF NOT EXISTS snippets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        short_name VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建formulas表 [citation](5)[citation](6)
    await query(`
      CREATE TABLE IF NOT EXISTS formulas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        short_name VARCHAR(200) NOT NULL,
        template_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建关联表：snippets与tags的多对多关系 [citation](5)[citation](6)
    await query(`
      CREATE TABLE IF NOT EXISTS snippet_tags (
        snippet_id INT NOT NULL,
        tag_id INT NOT NULL,
        PRIMARY KEY (snippet_id, tag_id),
        FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建关联表：formulas与models的多对多关系 [citation](5)[citation](6)
    await query(`
      CREATE TABLE IF NOT EXISTS formula_models (
        formula_id INT NOT NULL,
        model_id INT NOT NULL,
        PRIMARY KEY (formula_id, model_id),
        FOREIGN KEY (formula_id) REFERENCES formulas(id) ON DELETE CASCADE,
        FOREIGN KEY (model_id) REFERENCES models(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('数据库表结构初始化完成');
    return true;
  } catch (error) {
    console.error('数据库表结构初始化失败:', error);
    throw error;
  }
}

/**
 * 插入初始测试数据
 */
async function insertInitialData() {
  try {
    console.log('开始插入初始测试数据...');

    // 检查是否已有数据
    const [modelCount] = await query('SELECT COUNT(*) as count FROM models');
    if (modelCount.count > 0) {
      console.log('数据已存在，跳过初始化');
      return;
    }

    // 插入模型数据 [citation](5)[citation](6)
    const models = [
      { name: 'Midjourney', version: 'v6' },
      { name: 'FLUX', version: '1.0' },
      { name: 'Stable Diffusion', version: 'XL' },
      { name: 'LLM通用', version: '1.0' },
      { name: '绘画模型通用', version: '1.0' }
    ];

    const modelIds = {};
    for (const model of models) {
      const result = await query(
        'INSERT INTO models (name, version) VALUES (?, ?)',
        [model.name, model.version]
      );
      modelIds[model.name] = result.insertId;
    }

    // 插入标签数据 [citation](5)[citation](6)
    const tags = [
      { slug: 'subject', display_name: '画面主题', is_multi_select: false },
      { slug: 'character', display_name: '形象', is_multi_select: false },
      { slug: 'details', display_name: '细节', is_multi_select: true },
      { slug: 'environment', display_name: '环境描述', is_multi_select: true },
      { slug: 'style', display_name: '审美风格', is_multi_select: false },
      { slug: 'parameters', display_name: '模型参数', is_multi_select: true }
    ];

    const tagIds = {};
    for (const tag of tags) {
      const result = await query(
        'INSERT INTO tags (slug, display_name, is_multi_select) VALUES (?, ?, ?)',
        [tag.slug, tag.display_name, tag.is_multi_select]
      );
      tagIds[tag.slug] = result.insertId;
    }

    // 插入片段数据 [citation](5)[citation](6)
    const snippets = [
      // 画面主题
      { short_name: '美丽女孩', content: 'beautiful girl, portrait', tags: ['subject'] },
      { short_name: '神秘森林', content: 'mysterious forest, ancient trees', tags: ['subject'] },
      { short_name: '未来城市', content: 'futuristic city, cyberpunk', tags: ['subject'] },
      { short_name: '可爱动物', content: 'cute animals, kawaii style', tags: ['subject'] },
      
      // 形象
      { short_name: '优雅姿态', content: 'elegant pose, graceful', tags: ['character'] },
      { short_name: '英雄气质', content: 'heroic, strong character', tags: ['character'] },
      { short_name: '神秘气息', content: 'mysterious aura, enigmatic', tags: ['character'] },
      
      // 细节
      { short_name: '华丽服装', content: 'ornate clothing, detailed costume', tags: ['details'] },
      { short_name: '精致纹理', content: 'intricate texture, detailed patterns', tags: ['details'] },
      { short_name: '发光效果', content: 'glowing effects, luminous', tags: ['details'] },
      
      // 环境描述
      { short_name: '柔和光线', content: 'soft lighting, gentle shadows', tags: ['environment'] },
      { short_name: '星空背景', content: 'starry night sky, cosmic background', tags: ['environment'] },
      { short_name: '梦幻氛围', content: 'dreamy atmosphere, ethereal mood', tags: ['environment'] },
      
      // 审美风格
      { short_name: '动漫风格', content: 'anime style, manga art', tags: ['style'] },
      { short_name: '写实风格', content: 'photorealistic, hyperrealistic', tags: ['style'] },
      { short_name: '水彩画风', content: 'watercolor style, soft brushstrokes', tags: ['style'] },
      
      // 模型参数
      { short_name: '高质量', content: '--quality 2', tags: ['parameters'] },
      { short_name: '16:9比例', content: '--aspect 16:9', tags: ['parameters'] },
      { short_name: '风格化', content: '--stylize 1000', tags: ['parameters'] }
    ];

    const snippetIds = {};
    for (const snippet of snippets) {
      const result = await query(
        'INSERT INTO snippets (short_name, content) VALUES (?, ?)',
        [snippet.short_name, snippet.content]
      );
      const snippetId = result.insertId;
      snippetIds[snippet.short_name] = snippetId;

      // 关联标签
      for (const tagSlug of snippet.tags) {
        if (tagIds[tagSlug]) {
          await query(
            'INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)',
            [snippetId, tagIds[tagSlug]]
          );
        }
      }
    }

    // 插入公式数据 [citation](5)[citation](6)
    const formulas = [
      {
        short_name: '基础人物画像',
        template_text: '创作一幅关于 #subject 的图片，图片看上去是一个 #character，注意表达 #details，画面环境是 #environment，这幅画具有 #style 的风格。 [#parameters]',
        models: ['Midjourney', 'FLUX', '绘画模型通用']
      },
      {
        short_name: '场景描述公式',
        template_text: '描绘一个 #subject 的场景，环境特征包括 #environment，整体风格为 #style，细节要求 #details。 [#parameters]',
        models: ['Stable Diffusion', '绘画模型通用']
      },
      {
        short_name: 'LLM创意写作',
        template_text: '请以 #style 的风格，创作一个关于 #subject 的故事，主角是 #character，故事中要包含这些细节：#details，背景设定在 #environment。',
        models: ['LLM通用']
      }
    ];

    for (const formula of formulas) {
      const result = await query(
        'INSERT INTO formulas (short_name, template_text) VALUES (?, ?)',
        [formula.short_name, formula.template_text]
      );
      const formulaId = result.insertId;

      // 关联模型
      for (const modelName of formula.models) {
        if (modelIds[modelName]) {
          await query(
            'INSERT INTO formula_models (formula_id, model_id) VALUES (?, ?)',
            [formulaId, modelIds[modelName]]
          );
        }
      }
    }

    console.log('初始测试数据插入完成');
  } catch (error) {
    console.error('插入初始数据失败:', error);
    throw error;
  }
}

module.exports = {
  query,
  initTables,
  insertInitialData
};