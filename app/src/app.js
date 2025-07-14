// 主应用入口文件，初始化Express和中间件。
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./utils/db');

// 路由模块
const formulasRouter = require('./routes/formulas');
const snippetsRouter = require('./routes/snippets');
const tagsRouter = require('./routes/tags');
const modelsRouter = require('./routes/models');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API路由
app.use('/api/formulas', formulasRouter);
app.use('/api/snippets', snippetsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/models', modelsRouter);

// 根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI魔法书服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('应用错误:', error);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await db.initTables();
    await db.insertInitialData();
    
    app.listen(PORT, () => {
      console.log(`=================================`);
      console.log(`🎨 AI魔法书服务已启动`);
      console.log(`📡 端口: ${PORT}`);
      console.log(`🕐 时间: ${new Date().toLocaleString()}`);
      console.log(`=================================`);
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;