// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const schedule = require('node-schedule');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// 数据库连接
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'nav_system'
});

// 自动生成每日密码
function generateDailyPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// 自动发布密码到QQ群
async function publishPasswordToQQ(password) {
  try {
    // QQ机器人API调用 (需要配置QQ机器人)
    const response = await axios.post('http://qq-bot-api/send_group_msg', {
      group_id: '你的QQ群号',
      message: `【系统公告】\n今日访问密码：${password}\n有效期：${new Date().toLocaleDateString()}`
    });
    console.log('密码已发布到QQ群');
  } catch (error) {
    console.error('QQ群发布失败:', error);
  }
}

// 每日凌晨更新密码
schedule.scheduleJob('0 0 * * *', async () => {
  const newPassword = generateDailyPassword();
  
  // 更新数据库中的密码
  db.query('UPDATE system_settings SET value = ? WHERE name = "daily_password"', [newPassword]);
  
  // 发布到QQ群
  await publishPasswordToQQ(newPassword);
  
  console.log(`每日密码已更新: ${newPassword}`);
});

// 获取系统设置
app.get('/api/settings', (req, res) => {
  db.query('SELECT * FROM system_settings', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const settings = {};
    results.forEach(row => {
      settings[row.name] = row.value;
    });
    res.json(settings);
  });
});

// 管理员登录
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  db.query('SELECT * FROM admin_users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: '用户不存在' });
    
    const admin = results[0];
    const validPassword = await bcrypt.compare(password, admin.password);
    
    if (!validPassword) return res.status(401).json({ error: '密码错误' });
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, 'your-secret-key', { expiresIn: '24h' });
    
    res.json({ token, username: admin.username });
  });
});

// 更新系统设置 (需要管理员权限)
app.post('/api/settings/update', authenticateToken, (req, res) => {
  const { settings } = req.body;
  
  const queries = Object.keys(settings).map(key => {
    return new Promise((resolve, reject) => {
      db.query('UPDATE system_settings SET value = ? WHERE name = ?', [settings[key], key], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
  
  Promise.all(queries)
    .then(() => res.json({ message: '设置更新成功' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

// 获取导航按钮
app.get('/api/nav-buttons', (req, res) => {
  db.query('SELECT * FROM nav_buttons ORDER BY `order`', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 更新导航按钮
app.post('/api/nav-buttons/update', authenticateToken, (req, res) => {
  const { buttons } = req.body;
  
  // 先删除所有按钮
  db.query('DELETE FROM nav_buttons', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    
    // 插入新按钮
    const values = buttons.map((btn, index) => [btn.id, btn.number, btn.text, btn.url, index]);
    db.query('INSERT INTO nav_buttons (id, number, text, url, `order`) VALUES ?', [values], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: '导航按钮更新成功' });
    });
  });
});

// 发布公告
app.post('/api/announcements/publish', authenticateToken, (req, res) => {
  const { title, content } = req.body;
  
  db.query('INSERT INTO announcements (title, content, created_at) VALUES (?, ?, NOW())', [title, content], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '公告发布成功' });
  });
});

// 获取最新公告
app.get('/api/announcements/latest', (req, res) => {
  db.query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || null);
  });
});

// JWT验证中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: '访问被拒绝' });
  
  jwt.verify(token, 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: '令牌无效' });
    req.user = user;
    next();
  });
}

app.listen(3000, () => {
  console.log('服务器运行在端口 3000');
});
