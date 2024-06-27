const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:'); // 메모리 기반 데이터베이스. 파일 기반으로 하려면 'database.sqlite3'로 변경

// 데이터베이스 연결 및 테이블 생성
db.serialize(() => {
  // 사용자 정보를 저장할 테이블 생성
  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      home_id INTEGER,
      name TEXT,
      nickname TEXT,
      phone TEXT
    )
  `);
});

module.exports = db;
