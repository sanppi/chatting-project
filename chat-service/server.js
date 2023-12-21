const http = require("http");
const express = require("express");
const app = express();
// 소켓이 http모듈로 생성된 서버에서만 동작
const server = http.createServer(app);
const PORT = 8000;

// cors 이슈 : 다른 서버에서 보내는 요청을 제한함
const cors = require("cors");
app.use(cors());

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

const userIdArr = {};
// { "socket.id": "userIda", "socket.id": "userIdb" ,"socket.id": "userIdc"  }

const updateUserList = () => {
  io.emit("userList", userIdArr);
};

io.on("connection", (socket) => {
  console.log("socket id", socket.id);

  socket.on("entry", (res) => {
    if (Object.values(userIdArr).includes(res.userId)) {
      socket.emit("error", {
        msg: "중복된 아이디가 존재하여 입장이 불가합니다.",
      });
    } else {
      io.emit("notice", { msg: `${res.userId}님이 입장하셨습니다.` });
      socket.emit("entrySuccess", { userId: res.userId });
      userIdArr[socket.id] = res.userId;
      updateUserList();
    }
    console.log(userIdArr);
  });

  socket.on("disconnect", () => {
    io.emit("notice", { msg: `${userIdArr[socket.id]}님이 퇴장하셨습니다.` });
    delete userIdArr[socket.id];
    updateUserList();
  });

  socket.on("sendMsg", (res) => {
    if (res.dm === "all")
      io.emit("chat", { userId: res.userId, msg: res.msg }); // 전체에게 메세지
    else {
      // io.to(소켓아이디).emit() => 원하는 특정 사람 선택하기, res.dm이 소켓아이디를 담고 있음
      io.to(res.dm).emit("chat", {
        userId: res.userId,
        msg: res.msg,
        dm: true,
      });
      socket.emit("chat", { userId: res.userId, msg: res.msg, dm: true });
    }
  });
});

server.listen(PORT, function () {
  console.log(`Sever Open: ${PORT}`);
});
