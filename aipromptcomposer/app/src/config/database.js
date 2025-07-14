// 数据库连接配置。
/**
 * 数据库配置文件
 * 使用懒猫微服固定的MySQL环境变量
 */
module.exports = {
  host: 'mysql.cloud.lazycat.app.aipromptcomposer.lzcapp',
  port: 3306,
  user: 'LAZYCAT',
  password: 'LAZYCAT',
  database: 'LAZYCAT',
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: 'utf8mb4'
};