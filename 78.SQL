CREATE DATABASE nav_system;
USE nav_system;

-- 系统设置表
CREATE TABLE system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  description VARCHAR(255)
);

-- 初始系统设置
INSERT INTO system_settings (name, value, description) VALUES
('daily_password', '123456', '每日用户密码'),
('site_title', '科技导航中心', '网站标题'),
('avatar_url', 'http://glowguide.space/img/68f4b97844768.jpg', '头像URL'),
('theme_color', '#00a8ff', '主题颜色');

-- 管理员用户表
CREATE TABLE admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 默认管理员账户 (密码: admin123)
INSERT INTO admin_users (username, password) VALUES 
('admin', '$2a$10$8K1p/a0dRTlR0d.8U6Q1kO8QZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZJZ');

-- 导航按钮表
CREATE TABLE nav_buttons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(10) NOT NULL,
  text VARCHAR(50) NOT NULL,
  url VARCHAR(500) NOT NULL,
  `order` INT DEFAULT 0
);

-- 默认导航按钮
INSERT INTO nav_buttons (number, text, url, `order`) VALUES
('1', '王者区', 'https://www.123912.com/s/5ieZjv-RRxH3', 0),
('2', '和平专区', 'https://www.123912.com/s/5ieZjv-ORxH3', 1),
('3', 'PUBG专区', 'https://www.123912.com/s/5ieZjv-NRxH3', 2),
('4', '联系我们', 'https://qm.qq.com/q/wipYMhNrGw', 3);

-- 公告表
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
