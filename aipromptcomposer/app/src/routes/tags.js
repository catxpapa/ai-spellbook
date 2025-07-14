// 标签(Tag)相关的API路由。
const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');

/**
 * 获取所有标签
 */
router.get('/', async (req, res) => {
  try {
    const tags = await Tag.getAll();
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取标签失败:', error);
    res.status(500).json({
      success: false,
      message: '获取标签失败',
      error: error.message
    });
  }
});

module.exports = router;