const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database(':memory:');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 데이터베이스 초기화
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    description TEXT,
    phone TEXT
  )`);

  db.run(`CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event TEXT,
    day TEXT,
    time TEXT,
    type TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 사용자 데이터 추가
  db.run(`INSERT INTO users (name, email, password) VALUES ('김철수', 'kimcheolsu@example.com', 'password')`);
  db.run(`INSERT INTO users (name, email, password) VALUES ('이영희', 'leeyounghee@example.com', 'password')`);

  // 이벤트 데이터 추가
  db.run(`INSERT INTO events (user_id, event, day, time, type) VALUES (1, '회사 모임', '2024-07-01', '14:00', '회식')`);
  db.run(`INSERT INTO events (user_id, event, day, time, type) VALUES (1, '프로젝트 회의', '2024-07-03', '10:00', '업무')`);
});

// 이벤트 조회
app.get('/event', (req, res) => {
  db.all('SELECT events.*, users.name AS userName FROM events LEFT JOIN users ON events.user_id = users.id', (err, events) => {
    if (err) {
      console.error('Error fetching events:', err.message);
      return res.status(500).json({ error: '이벤트 조회 중 오류가 발생했습니다.' });
    }

    // 조회 결과를 JSON 형식으로 반환
    res.status(200).json(events);
  });
});

// 이벤트 등록 처리
app.post('/event/register', (req, res) => {
  const { event, day, time, type, userId } = req.body;

  db.run(
    'INSERT INTO events (user_id, event, day, time, type) VALUES (?, ?, ?, ?, ?)',
    [userId, event, day, time, type],
    function (err) {
      if (err) {
        console.error('Error inserting event:', err.message);
        return res.status(500).json({ error: '이벤트 등록 중 오류가 발생했습니다.' });
      }

      // 등록된 이벤트의 사용자 이름 조회
      db.get('SELECT name FROM users WHERE id = ?', [userId], (err, row) => {
        if (err) {
          console.error('Error fetching user:', err.message);
          return res.status(500).json({ error: '사용자 조회 중 오류가 발생했습니다.' });
        }

        const userName = row ? row.name : 'Unknown';
        res.status(200).json({ message: '이벤트 등록 성공!', userName });
      });
    }
  );
});

// 사용자 정보 수정 처리
app.put('/user/:id', (req, res) => {
  const userId = req.params.id;
  const { name, phone } = req.body;

  db.run(
    'UPDATE users SET description = ?, phone = ? WHERE id = ?',
    [name, phone, userId],
    function (err) {
      if (err) {
        console.error('Error updating user:', err.message);
        return res.status(500).json({ error: '사용자 정보 수정 중 오류가 발생했습니다.' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      res.status(200).json({ message: '사용자 정보 수정 성공!' });
    }
  );
});

app.get('/user/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Error fetching user:', err.message);
      return res.status(500).json({ error: '사용자 정보 조회 중 오류가 발생했습니다.' });
    }

    if (!row) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    res.status(200).json({ message: row });
  });
}); 

// 서버 시작
const port = 3000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
