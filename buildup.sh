#!/bin/bash

# 懒猫微服应用项目结构生成脚本
#
# 功能:
# 1. 创建 'aipromptcomposer' 项目的完整目录结构。
# 2. 为每个文件添加一行描述性注释。
# 3. 如果文件或目录已存在，则跳过创建，不会覆盖任何现有内容。
#
# 使用方法:
# 1. 将此脚本保存为 `create_project.sh`。
# 2. 在终端中给予执行权限: `chmod +x create_project.sh`。
# 3. 运行脚本: `./create_project.sh`。

# --- 定义项目根目录 ---
BASE_DIR="aipromptcomposer"

# --- 创建主目录结构 ---
echo "正在创建目录结构..."
mkdir -p "${BASE_DIR}/app/src/config"
mkdir -p "${BASE_DIR}/app/src/models"
mkdir -p "${BASE_DIR}/app/src/routes"
mkdir -p "${BASE_DIR}/app/src/utils"
mkdir -p "${BASE_DIR}/app/public/css"
mkdir -p "${BASE_DIR}/app/public/js"
echo "目录结构创建完成。"
echo ""

# --- 定义一个函数来创建文件并写入注释 ---
# 参数1: 文件路径
# 参数2: 要写入的注释内容
create_file_with_comment() {
    if [ ! -f "$1" ]; then
        echo "创建文件: $1"
        echo "$2" > "$1"
    else
        echo "文件已存在，跳过: $1"
    fi
}

# --- 创建根目录下的文件 ---
echo "正在创建项目根文件..."
create_file_with_comment "${BASE_DIR}/lzc-manifest.yml" "# 懒猫应用项目描述文件，定义运行时行为和路由关系。"
create_file_with_comment "${BASE_DIR}/lzc-build.yml" "# 懒猫应用打包构建描述文件，控制lpk打包和预处理流程。"
create_file_with_comment "${BASE_DIR}/lzc-icon.png" "" # 创建一个空的图标文件

# --- 创建 app 目录下的文件 ---
echo "正在创建 app 核心文件..."
create_file_with_comment "${BASE_DIR}/app/package.json" "{
  \"name\": \"aipromptcomposer\",
  \"version\": \"1.0.0\",
  \"description\": \"AI Prompt Composer application for LanMao.\",
  \"main\": \"src/app.js\",
  \"scripts\": {
    \"start\": \"node src/app.js\"
  }
}"
create_file_with_comment "${BASE_DIR}/app/run.sh" "#!/bin/bash
# 应用启动脚本
node src/app.js"
# 为启动脚本添加执行权限
chmod +x "${BASE_DIR}/app/run.sh"

# --- 创建后端源代码文件 (src) ---
echo "正在创建后端源代码文件..."
create_file_with_comment "${BASE_DIR}/app/src/app.js" "// 主应用入口文件，初始化Express和中间件。"
create_file_with_comment "${BASE_DIR}/app/src/config/database.js" "// 数据库连接配置。"
create_file_with_comment "${BASE_DIR}/app/src/models/Formula.js" "// Formula 数据模型定义 (例如使用 Mongoose 或 Sequelize)。"
create_file_with_comment "${BASE_DIR}/app/src/models/Model.js" "// Model 类别数据模型定义。"
create_file_with_comment "${BASE_DIR}/app/src/models/Snippet.js" "// Snippet 数据模型定义。"
create_file_with_comment "${BASE_DIR}/app/src/models/Tag.js" "// Tag 数据模型定义。"
create_file_with_comment "${BASE_DIR}/app/src/routes/formulas.js" "// 公式(Formula)相关的API路由。"
create_file_with_comment "${BASE_DIR}/app/src/routes/models.js" "// 模型(Model)相关的API路由。"
create_file_with_comment "${BASE_DIR}/app/src/routes/snippets.js" "// 片段(Snippet)相关的API路由。"
create_file_with_comment "${BASE_DIR}/app/src/routes/tags.js" "// 标签(Tag)相关的API路由。"
create_file_with_comment "${BASE_DIR}/app/src/utils/db.js" "// 数据库连接和辅助函数。"

# --- 创建前端静态文件 (public) ---
echo "正在创建前端静态文件..."
create_file_with_comment "${BASE_DIR}/app/public/index.html" "<!-- 应用主HTML页面 -->"
create_file_with_comment "${BASE_DIR}/app/public/css/style.css" "/* 全局样式文件 */"
create_file_with_comment "${BASE_DIR}/app/public/js/app.js" "// 前端主逻辑脚本文件。"

echo ""
echo "项目 'aipromptcomposer' 结构已成功生成！"