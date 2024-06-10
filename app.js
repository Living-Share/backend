const express = require("express");

// Express 앱 생성
const app = express();
const port = 3001;

// event

app.get("/event", (req, res) => {
  res.send("오늘 생긴 이벤트");
});

app.post("/event", (req, res) => {
  res.send("이벤트 등록하기");
});

// todo

app.get("/todo", (req, res) => {
  res.send("집안일 같은 로테이션 표시");
});

app.post("/todo", (req, res) => {
  res.send("로테이션 등록 post");
});

// money

app.get("/money", (req, res) => {
  res.send("공과금, 관리비등등 총금액 알려줌 + 낸사람 안낸사람 + 계좌 번호?");
});

app.get("money/detail", (req, res) => {
  res.send("전기세, 난방비, 수도세등 상세히 보기");
});

app.post("/money/detail", (req, res) => {
  res.send("자세한 돈 설정하기");
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
