const express = require('express');
const router = express.Router();
const Formula = require('../models/Formula');

/**
 * 获取公式列表
 */
router.get('/', async (req, res) => {
  try {
    const { model_id, search, limit = 100, offset = 0 } = req.query;
    
    const options = {
      modelId: model_id ? parseInt(model_id) : null,
      search: search || null,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    const formulas = await Formula.getAll(options);
    
    res.json({
      success: true,
      data: formulas,
      pagination: {
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('获取公式列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公式列表失败',
      error: error.message
    });
  }
});

/**
 * 根据ID获取公式
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const formula = await Formula.getById(id);
    
    if (!formula) {
      return res.status(404).json({
        success: false,
        message: '公式不存在'
      });
    }
    
    // 解析模板中的标签
    const tags = Formula.parseTemplateTags(formula.template_text);
    formula.required_tags = tags;
    
    res.json({
      success: true,
      data: formula
    });
  } catch (error) {
    console.error('获取公式失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公式失败',
      error: error.message
    });
  }
});

/**
 * 组合提示词
 */
router.post('/:id/compose', async (req, res) => {
  try {
    const { id } = req.params;
    const { selected_snippets } = req.body;
    
    const formula = await Formula.getById(id);
    if (!formula) {
      return res.status(404).json({
        success: false,
        message: '公式不存在'
      });
    }
    
    const composedPrompt = Formula.composePrompt(formula.template_text, selected_snippets || {});
    
    res.json({
      success: true,
      data: {
        original_template: formula.template_text,
        selected_snippets: selected_snippets,
        composed_prompt: composedPrompt
      }
    });
  } catch (error) {
    console.error('组合提示词失败:', error);
    res.status(500).json({
      success: false,
      message: '组合提示词失败',
      error: error.message
    });
  }
});

/**
 * 创建新公式
 */
router.post('/', async (req, res) => {
  try {
    const { short_name, template_text, model_ids } = req.body;
    
    if (!short_name || !template_text) {
      return res.status(400).json({
        success: false,
        message: '公式简称和模板文本不能为空'
      });
    }
    
    // 检查是否已存在
    const exists = await Formula.exists(short_name);
    if (exists) {
      return res.status(400).json({
        success: false,
        message: '该公式简称已存在'
      });
    }
    
    const formulaId = await Formula.create({
      short_name,
      template_text,
      model_ids: model_ids || []
    });
    
    res.status(201).json({
      success: true,
      message: '公式创建成功',
      data: { id: formulaId }
    });
  } catch (error) {
    console.error('创建公式失败:', error);
    res.status(500).json({
      success: false,
      message: '创建公式失败',
      error: error.message
    });
  }
});

module.exports = router;