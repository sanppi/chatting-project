import "../styles/chat.css";
import { useCallback, useEffect, useState, useMemo } from "react";
import Chat from "./Chat";
import Notice from "./Notice";
import io from "socket.io-client";

const socket = io.connect("http://localhost:8000", { autoConnect: false });

export default function Chatting() {
  const [msgInput, setMsgInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [chatList, setChatList] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userList, setUserList] = useState({});
  const [dmTo, setDmTo] = useState("all");

  const initSocketConnect = () => {
    console.log("connected", socket.connected);
    if (!socket.connected) socket.connect();
  };

  // 클라이언트에서 채팅방 목록 상태 추가
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomNameInput, setRoomNameInput] = useState("");

  // // 방 생성 함수
  // const createOrJoinRoom = () => {
  //   if (!roomNameInput) {
  //     alert("방 이름을 입력하세요.");
  //     return;
  //   }

  //   const existingRoom = roomList.find((room) => room.name === roomNameInput);

  //   if (existingRoom) {
  //     // 이미 존재하는 방이면 참여
  //     joinRoom(existingRoom.id);
  //   } else {
  //     // 존재하지 않는 방이면 생성 후 참여
  //     socket.emit("create-room", roomNameInput);
  //   }
  // };

  // 채팅방
  // const [roomList, setRoomList] = useState([]);
  // useEffect(() => {
  //   // 서버에서 전달되는 채팅 방 목록 받아와서 업데이트 하기
  //   const getRooms = (rooms) => {
  //     setRoomList(rooms);
  //   };
  //   const createRoom = (rooms) => {
  //     setRoomList(rooms);
  //   };

  //   // 클라이언트가 입력한 채팅방 서버에 보내기
  //   socket.emit("get-rooms", getRooms);
  //   // 서버가 보내는 룸리스트 받기
  //   socket.on("room-list", createRoom);
  //   return () => {
  //     socket.off("get-rooms", getRooms);
  //     socket.off("room-list", createRoom);
  //   };
  // }, []);

  useEffect(() => {
    socket.on("error", (res) => {
      alert(res.msg);
    });

    socket.on("entrySuccess", (res) => {
      setUserId(res.userId);
    });

    socket.on("userList", (res) => {
      setUserList(res);
    });

    // 대화방 날짜
    socket.on("date", (date) => {
      // 렌더링 후에 요소를 찾아서 처리
      const dateElement = document.getElementById("date");
      if (dateElement) {
        dateElement.textContent = date;
      }
    });
  }, []);

  // useMemo : 값을 메모라이징 한다.
  // 뒤에 있는 의존성 배열에 있는 값이 update 될 때마다 다시 이 함수(연산)를 실행시켜서
  // 원하는 값을 받아오도록 함.
  // return값을 받아서 이 userListOptions에 값을 넣을 것.
  const userListOptions = useMemo(() => {
    // [<option></option>, <option></option>]
    const options = [];
    for (const key in userList) {
      // key: userList의 key 값을 여기에 담음 (socket id)
      // userList[key] : userList의 value 값 가져오기 (사용자 id)
      if (userList[key] === userId) continue; // 다음 걸 읽지 않고 다시 돌아감. 나는 option에 안나오게 하려고.
      options.push(
        <option key={key} value={key}>
          {userList[key]}
        </option>
      );
    }
    return options; // 배열 잘 만들어놨으니 return해서 사용할 수 있도록 함
  }, [userList]);

  // useCallback: 함수를 메모라이징 한다
  // 뒤에 있는 의존성배열에 있는 값이 update 될 때만 함수를 다시 선언함, [userId, chatList] 이게 update 될때마다
  const addChatList = useCallback(
    (res) => {
      const type = res.userId === userId ? "my" : "other";
      const content = `${res.dm ? `(속닥속닥)` : ``} ${res.userId} : ${
        res.msg
      }`;
      const currentDate = new Date();
      const hours = String(currentDate.getHours()).padStart(2, "0");
      const minutes = String(currentDate.getMinutes()).padStart(2, "0");
      const time = `${hours}:${minutes}`;
      const newChatList = [
        ...chatList,
        { type: type, content: content, time: time },
      ];
      setChatList(newChatList);
    },
    [userId, chatList]
  );

  useEffect(() => {
    socket.on("chat", addChatList); // 새로운 chatlist
    return () => socket.off("chat", addChatList);
  }, [addChatList]);

  useEffect(() => {
    const notice = (res) => {
      const newChatList = [...chatList, { type: "notice", content: res.msg }];
      setChatList(newChatList);
    };

    socket.on("notice", notice);
    return () => socket.off("notice", notice);
  }, [chatList]);

  // 메세지 입력창 공백 만들기
  const sendMsg = () => {
    if (msgInput !== "") {
      const currentDate = new Date();
      const hours = String(currentDate.getHours()).padStart(2, "0");
      const minutes = String(currentDate.getMinutes()).padStart(2, "0");
      const time = `${hours}:${minutes}`;

      socket.emit("sendMsg", {
        userId: userId,
        msg: msgInput,
        dm: dmTo,
        time: time,
      });
      setMsgInput("");
    }
  };

  const entryChat = () => {
    initSocketConnect();
    socket.emit("entry", { userId: userIdInput });
  };

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      if (userId) {
        sendMsg();
      } else {
        entryChat();
      }
    }
  };

  return (
    <>
      {userId ? (
        <>
          <div className="chat-container">
            <div>{userId}님의 채팅방</div>
            <div id="date" className="chat-date"></div>
            {chatList.map((chat, i) => {
              if (chat.type === "notice") return <Notice key={i} chat={chat} />;
              else return <Chat key={i} chat={chat} />;
            })}

            <div className="input-container">
              <select value={dmTo} onChange={(e) => setDmTo(e.target.value)}>
                <div>To.</div>
                <option value="all">All</option>
                {userListOptions}
              </select>
              <input
                type="text"
                value={msgInput}
                onChange={(e) => setMsgInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button onClick={sendMsg}>전송</button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="enter">
            <label> Nickname </label>
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={entryChat}>입장</button>
          </div>
        </>
      )}
    </>
  );
}
