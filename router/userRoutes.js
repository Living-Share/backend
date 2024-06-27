const express = require("express");
const router = asyncify(express.Router());

// 로그인 처리
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      return res.status(200).json({
        message: 'Login successful!',
        user: {
          id: user.id,
          email: user.email,
          name: user.name // 예시로 사용자의 다른 필드 추가 가능
        }
      });
    }
    res.status(401).json({ error: 'Invalid email or password' });
  });
});


  // 회원가입 처리
router.post('/register', async (req, res) => {
  const { email, password, home_id, name, nickname, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (email, password, home_id, name, nickname, phone) VALUES (?, ?, ?, ?, ?, ?)", [email, hashedPassword, home_id, name, nickname, phone], (err) => {
    if (err) {
      return res.send('Error occurred');
    }
    res.send('Registration successful!');
  });
});

// 로그아웃
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.send('Logout successful');
  });
});