const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");

const app = express();
const db = new sqlite3.Database(":memory:");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
const cors = require("cors");
app.use(cors());

// 데이터베이스 초기화
db.serialize(() => {
  db.run(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    description TEXT,
    phone TEXT,
    money BOOLEAN DEFAULT 0
  )`);

  db.run(`CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event TEXT,
    day TEXT,
    time TEXT,
    type TEXT,
    doevent BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // money 테이블 생성
  db.run(`CREATE TABLE money (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    electricity INTEGER,
    water INTEGER,
    gas INTEGER,
    heating INTEGER,
    management_fee INTEGER
  )`);

  // 사용자 데이터 추가
  db.run(
    `INSERT INTO users (name, email, password) VALUES ('김철수', 'kimcheolsu@example.com', 'password')`
  );
  db.run(
    `INSERT INTO users (name, email, password) VALUES ('박영희', 'parkyounghee@example.com', 'password')`
  );

  // 이벤트 데이터 추가 (수정된 부분: user_id 컬럼 추가)
  db.run(
    `INSERT INTO events (user_id, event, day, time, type) VALUES (1, '회사 모임', '2024-07-01', '14:00', '회식')`
  );
  db.run(
    `INSERT INTO events (user_id, event, day, time, type) VALUES (1, '프로젝트 회의', '2024-07-03', '10:00', '업무')`
  );
  db.run(
    `INSERT INTO events (user_id, event, day, time, type) VALUES (2, '친구 모임', '2024-07-05', '18:00', '친목')`
  );

  // money 테이블 예시 데이터 추가
  db.run(
    `INSERT INTO money (electricity, water, gas, heating, management_fee) VALUES (?, ?, ?, ?, ?)`,
    [10000, 20000, 15000, 12000, 30000],
    function (err) {
      if (err) {
        console.error("Error inserting money data:", err.message);
        return;
      }
      console.log("Money data inserted successfully");
    }
  );
});

// 사용자 정보 업데이트
app.put("/user/:id", (req, res) => {
  const userId = req.params.id;
  const { email, phone } = req.body;

  db.run(
    "UPDATE users SET email = ?, phone = ? WHERE id = ?",
    [email, phone, userId],
    function (err) {
      if (err) {
        console.error("Error updating user information:", err.message);
        return res
          .status(500)
          .json({ error: "사용자 정보 업데이트 중 오류가 발생했습니다." });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
      }

      res.status(200).json({
        message: "사용자 정보가 업데이트되었습니다.",
        email,
        phone,
      });
    }
  );
});

// 이벤트 조회
app.get("/events", (req, res) => {
  console.log("events 실행");
  db.all("SELECT * FROM events", (err, events) => {
    if (err) {
      console.error("Error fetching events:", err.message);
      return res
        .status(500)
        .json({ error: "이벤트 조회 중 오류가 발생했습니다." });
    }

    // 조회 결과를 JSON 형식으로 반환
    res.status(200).json(events);
  });
});

// 사용자의 비용 정보 조회
app.get("/getMoney", (req, res) => {
  db.all(`SELECT * FROM money`, (err, rows) => {
    if (err) {
      console.error("Error fetching money information:", err.message);
      return res
        .status(500)
        .json({ error: "비용 정보 조회 중 오류가 발생했습니다." });
    }

    res.status(200).json(rows);
  });
});

// 사용자 정보 조회
app.get("/user/:id", (req, res) => {
  const userId = req.params.id;

  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      console.error("Error fetching user:", err.message);
      return res
        .status(500)
        .json({ error: "사용자 정보 조회 중 오류가 발생했습니다." });
    }

    if (!user) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).json(user);
  });
});

app.put("user/:id", (req, res) => {});

// 사용자 money 상태 업데이트
app.put("/user/:id/money", (req, res) => {
  const userId = req.params.id;

  // 현재 money 상태 조회
  db.get("SELECT money FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error("Error fetching user money:", err.message);
      return res
        .status(500)
        .json({ error: "사용자 money 상태 조회 중 오류가 발생했습니다." });
    }

    if (!row) {
      return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    }

    // 현재 money 상태를 반전하여 업데이트
    const newMoneyState = row.money === 0 ? 1 : 0;

    db.run(
      "UPDATE users SET money = ? WHERE id = ?",
      [newMoneyState, userId],
      function (err) {
        if (err) {
          console.error("Error updating user money:", err.message);
          return res.status(500).json({
            error: "사용자 money 상태 업데이트 중 오류가 발생했습니다.",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
        }

        res.status(200).json({
          message: "사용자 money 상태가 업데이트되었습니다.",
          newMoneyState,
        });
      }
    );
  });
});

// 이벤트 doevent 상태 업데이트
app.put("/events/:id/doEvent", (req, res) => {
  const eventId = req.params.id;

  // 현재 doevent 상태 조회
  db.get("SELECT doevent FROM events WHERE id = ?", [eventId], (err, row) => {
    if (err) {
      console.error("Error fetching event doevent state:", err.message);
      return res
        .status(500)
        .json({ error: "이벤트 doevent 상태 조회 중 오류가 발생했습니다." });
    }

    if (!row) {
      return res.status(404).json({ error: "이벤트를 찾을 수 없습니다." });
    }

    // 현재 doevent 상태를 반전하여 업데이트
    const newDoEventState = row.doevent === 0 ? 1 : 0;

    db.run(
      "UPDATE events SET doevent = ? WHERE id = ?",
      [newDoEventState, eventId],
      function (err) {
        if (err) {
          console.error("Error updating event doevent state:", err.message);
          return res.status(500).json({
            error: "이벤트 doevent 상태 업데이트 중 오류가 발생했습니다.",
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: "이벤트를 찾을 수 없습니다." });
        }

        res.status(200).json({
          message: "이벤트 doevent 상태가 업데이트되었습니다.",
          newDoEventState,
        });
      }
    );
  });
});

// 서버 시작
const port = 3000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
