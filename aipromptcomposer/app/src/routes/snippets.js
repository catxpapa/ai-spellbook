// 片段(Snippet)相关的API路由。
const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');

/**
 * 根据标签获取片段
 */
router.get('/by-tag/:tagSlug', async (req, res) => {
  try {
    const { tagSlug } = req.params;
    const snippets = await Snippet.getByTagSlug(tagSlug);
    
    res.json({
      success: true,
      data: snippets
    });
  } catch (error) {
    console.error('获取片段失败:', error);
    res.status(500).json({
      success: false,
      message: '获取片段失败',
      error: error.message
    });
  }
});

/**
 * 创建新片段
 */
router.post('/', async (req, res) => {
  try {
    const { short_name, content, tag_ids = [] } = req.body;
    
    if (!short_name || !content) {
      return res.status(400).json({
        success: false,
        message: '片段名称和内容不能为空'
      });
    }
    
    const snippetId = await Snippet.create({ short_name, content });
    
    // 关联标签
    for (const tagId of tag_ids) {
      await Snippet.addTag(snippetId, tagId);
    }
    
    res.json({
      success: true,
      data: { id: snippetId },
      message: '片段创建成功'
    });
  } catch (error) {
    console.error('创建片段失败:', error);
    res.status(500).json({
      success: false,
      message: '创建片段失败',
      error: error.message
    });
  }
});

module.exports = router;