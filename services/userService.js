const bcrypt = require('bcrypt');
const db = require('../database');

function renderLoginPage(req, res) {
  res.send('<form action="/login" method="post">Email: <input type="text" name="email"/><br>Password: <input type="password" name="password"/><br><button type="submit">Login</button></form>');
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (err) {
      return res.send('Error occurred');
    }
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      return res.send('Login successful!');
    }
    res.send('Invalid email or password');
  });
}

function renderRegisterPage(req, res) {
  res.send(`
    <form action="/register" method="post">
      Email: <input type="text" name="email"/><br>
      Password: <input type="password" name="password"/><br>
      Home ID: <input type="text" name="home_id"/><br>
      Name: <input type="text" name="name"/><br>
      Nickname: <input type="text" name="nickname"/><br>
      Phone: <input type="text" name="phone"/><br>
      <button type="submit">Register</button>
    </form>
  `);
}

async function registerUser(req, res) {
  const { email, password, home_id, name, nickname, phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (email, password, home_id, name, nickname, phone) VALUES (?, ?, ?, ?, ?, ?)", [email, hashedPassword, home_id, name, nickname, phone], (err) => {
    if (err) {
      return res.send('Error occurred');
    }
    res.send('Registration successful!');
  });
}

function logoutUser(req, res) {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.send('Logout successful');
  });
}

module.exports = {
  renderLoginPage,
  loginUser,
  renderRegisterPage,
  registerUser,
  logoutUser
};
