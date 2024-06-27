const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();
const port = 3000;

// 미들웨어 설정
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'secret-key', // 비밀 키는 환경 변수로 설정하는 것이 좋습니다
  resave: false,
  saveUninitialized: true
}));

// 로그인 페이지
app.get('/login', (req, res) => {
  res.send('<form action="/login" method="post">Email: <input type="text" name="email"/><br>Password: <input type="password" name="password"/><br><button type="submit">Login</button></form>');
});

// 로그인 처리
app.post('/login', (req, res) => {
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
});

// 회원가입 페이지
app.get('/register', (req, res) => {
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
});

// 회원가입 처리
app.post('/register', async (req, res) => {
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
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.send('Error logging out');
    }
    res.send('Logout successful');
  });
});

// 홈 페이지
app.get('/', (req, res) => {
  if (req.session.userId) {
    res.send('Welcome! <a href="/logout">Logout</a>');
  } else {
    res.send('You are not logged in. <a href="/login">Login</a> or <a href="/register">Register</a>');
  }
});

// 이벤트 조회
app.get('/event', (req, res) => {
  // 사용자 ID에 따른 이벤트 조회
  const userId = req.session.userId; // 세션에서 사용자 ID 가져오기

  if (!userId) {
    return res.send('로그인이 필요합니다.');
  }

  db.all('SELECT * FROM events WHERE user_id = ?', [userId], (err, events) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return res.send('이벤트 조회 중 오류가 발생했습니다.');
    }

    // 조회 결과를 화면에 출력
    res.send(events.map(event => `
      <div>
        이벤트: ${event.event}<br>
        날짜: ${event.day}<br>
        시간: ${event.time}<br>
        타입: ${event.type}<br>
      </div><br>
    `).join(''));
  });
});

// 이벤트 등록 페이지
app.get('/event/register', (req, res) => {
  res.send(`
    <form action="/event/register" method="post">
      이벤트명: <input type="text" name="event"/><br>
      날짜: <input type="text" name="day"/><br>
      시간: <input type="text" name="time"/><br>
      타입: <input type="text" name="type"/><br>
      <button type="submit">이벤트 등록</button>
    </form>
  `);
});

// 이벤트 등록 처리
app.post('/event/register', (req, res) => {
  const userId = req.session.userId; // 세션에서 사용자 ID 가져오기
  const { event, day, time, type } = req.body;

  db.run(
    'INSERT INTO events (user_id, event, day, time, type) VALUES (?, ?, ?, ?, ?)',
    [userId, event, day, time, type],
    (err) => {
      if (err) {
        console.error('Error inserting event:', err.message);
        return res.send('이벤트 등록 중 오류가 발생했습니다.');
      }
      res.send('이벤트 등록 성공!');
    }
  );
});

// todo
app.get('/todo', (req, res) => {
  res.send('집안일 같은 로테이션 표시');
});

app.post('/todo', (req, res) => {
  res.send('로테이션 등록 post');
});

// money
app.get('/money', (req, res) => {
  res.send('공과금, 관리비등등 총금액 알려줌 + 낸사람 안낸사람 + 계좌 번호?');
});

app.get('/money/detail', (req, res) => { // 경로 수정
  res.send('전기세, 난방비, 수도세등 상세히 보기');
});

app.post('/money/detail', (req, res) => {
  res.send('자세한 돈 설정하기');
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
