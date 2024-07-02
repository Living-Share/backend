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

  db.run(`CREATE TABLE homeworks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    event TEXT,
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
    `INSERT INTO events (user_id, event, day, time, type) VALUES (1, '일정등록', '2024-06-29', '14:00', '회식')`
  );
  db.run(
    `INSERT INTO events (user_id, event, day, time, type) VALUES (2, '일정등록', '2024-07-05', '18:00', '친목')`
  );

  db.run(`INSERT INTO homeworks (user_id, event) VALUES (1, '설거지하기')`);

  db.run(`INSERT INTO homeworks (user_id, event) VALUES (2, '빨래하기')`);

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

app.get("/events", (req, res) => {
  console.log("events 실행");

  const today = new Date().toISOString().split("T")[0];

  console.log(today);

  const getEventsQuery = `
    SELECT events.*, users.name AS user_name
    FROM events
    JOIN users ON events.user_id = users.id
    WHERE events.day = ?`;

  db.all(getEventsQuery, [today], (err, events) => {
    if (err) {
      console.error("Error fetching events:", err.message);
      return res
        .status(500)
        .json({ error: "이벤트 조회 중 오류가 발생했습니다." });
    }

    if (events.length > 0) {
      // 오늘의 이벤트가 있는 경우
      return res.status(200).json(events);
    } else {
      // 오늘의 이벤트가 없는 경우 가장 가까운 날짜의 이벤트 조회
      const getClosestEventsQuery = `
        SELECT events.*, users.name AS user_name
        FROM events
        JOIN users ON events.user_id = users.id
        WHERE events.day > ?
        ORDER BY events.day ASC
        LIMIT 1`;

      db.all(getClosestEventsQuery, [today], (err, closestEvents) => {
        if (err) {
          console.error("Error fetching closest events:", err.message);
          return res
            .status(500)
            .json({ error: "이벤트 조회 중 오류가 발생했습니다." });
        }

        if (closestEvents.length > 0) {
          return res.status(200).json(closestEvents);
        } else {
          return res.status(404).json({ error: "이벤트가 없습니다." });
        }
      });
    }
  });
});

// Event 추가
app.post("/events", (req, res) => {
  const { user_id, event, day, time, type } = req.body;

  db.run(
    `INSERT INTO events (user_id, event, day, time, type) VALUES (?, ?, ?, ?, ?)`,
    [user_id, event, day, time, type],
    function (err) {
      if (err) {
        console.error("Error inserting event:", err.message);
        return res
          .status(500)
          .json({ error: "Event 추가 중 오류가 발생했습니다." });
      }
      res
        .status(201)
        .json({ message: "Event가 추가되었습니다.", id: this.lastID });
    }
  );
});

// test
app.get("/test", (req, res) => {
  db.all(`SELECT * FROM events`, (err, rows) => {
    if (err) {
      console.error("Error fetching money information:", err.message);
      return res
        .status(500)
        .json({ error: "test 문제 발생했습니다." });
    }

    res.status(200).json(rows);
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

// 사용자의 비용 정보 조회
app.get("/user", (req, res) => {
  db.all(`SELECT * FROM users`, (err, rows) => {
    if (err) {
      console.error("Error fetching money information:", err.message);
      return res
        .status(500)
        .json({ error: "유저 정보 조회 중 오류가 발생했습니다." });
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

// homework doevent 상태 업데이트
app.put("/homeworks/:id/doEvent", (req, res) => {
  const eventId = req.params.id;

  // 현재 doevent 상태 조회
  db.get(
    "SELECT doevent FROM homeworks WHERE id = ?",
    [eventId],
    (err, row) => {
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
        "UPDATE homeworks SET doevent = ? WHERE id = ?",
        [newDoEventState, eventId],
        function (err) {
          if (err) {
            console.error("Error updating event doevent state:", err.message);
            return res.status(500).json({
              error: "이벤트 doevent 상태 업데이트 중 오류가 발생했습니다.",
            });
          }

          if (this.changes === 0) {
            return res
              .status(404)
              .json({ error: "이벤트를 찾을 수 없습니다." });
          }

          res.status(200).json({
            message: "이벤트 doevent 상태가 업데이트되었습니다.",
            newDoEventState,
          });
        }
      );
    }
  );
});

// Homework 추가
app.post("/homeworks", (req, res) => {
  const { user_id, event } = req.body;

  db.run(
    `INSERT INTO homeworks (user_id, event) VALUES (?, ?)`,
    [user_id, event],
    function (err) {
      if (err) {
        console.error("Error inserting homework:", err.message);
        return res
          .status(500)
          .json({ error: "Homework 추가 중 오류가 발생했습니다." });
      }
      res
        .status(201)
        .json({ message: "Homework가 추가되었습니다.", id: this.lastID });
    }
  );
});

// Homework 조회
app.get("/homeworks", (req, res) => {
  db.all(
    `SELECT homeworks.*, users.name AS user_name 
    FROM homeworks 
    INNER JOIN users ON homeworks.user_id = users.id`,
    (err, rows) => {
      if (err) {
        console.error("Error fetching homeworks:", err.message);
        return res
          .status(500)
          .json({ error: "Homework 조회 중 오류가 발생했습니다." });
      }
      res.status(200).json(rows);
    }
  );
});

// 서버 시작
const port = 3000;
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
