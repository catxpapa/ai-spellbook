const express = require('express');
const router = express.Router();
const Model = require('../models/Model');

/**
 * 获取所有模型
 */
router.get('/', async (req, res) => {
  try {
    const models = await Model.getAll();
    res.json({
      success: true,
      data: models
    });
  } catch (error) {
    console.error('获取模型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型列表失败',
      error: error.message
    });
  }
});

/**
 * 根据ID获取模型
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const model = await Model.getById(id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: '模型不存在'
      });
    }
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    console.error('获取模型失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型失败',
      error: error.message
    });
  }
});

/**
 * 获取模型关联的公式
 */
router.get('/:id/formulas', async (req, res) => {
  try {
    const { id } = req.params;
    const formulas = await Model.getFormulas(id);
    
    res.json({
      success: true,
      data: formulas
    });
  } catch (error) {
    console.error('获取模型公式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模型公式失败',
      error: error.message
    });
  }
});

/**
 * 创建新模型
 */
router.post('/', async (req, res) => {
  try {
    const { name, version } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: '模型名称不能为空'
      });
    }
    
    // 检查是否已存在
    const exists = await Model.exists(name, version || '1.0');
    if (exists) {
      return res.status(400).json({
        success: false,
        message: '该模型名称和版本已存在'
      });
    }
    
    const modelId = await Model.create({ name, version });
    
    res.status(201).json({
      success: true,
      message: '模型创建成功',
      data: { id: modelId }
    });
  } catch (error) {
    console.error('创建模型失败:', error);
    res.status(500).json({
      success: false,
      message: '创建模型失败',
      error: error.message
    });
  }
});

module.exports = router;