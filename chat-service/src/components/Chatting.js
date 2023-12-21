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
      const newChatList = [...chatList, { type: type, content: content }];
      setChatList(newChatList);
    },
    [userId, chatList]
  );

  useEffect(() => {
    socket.on("chat", addChatList); // 새로운 chatlist
    return () => socket.off("chat", addChatList); // 기존의 chatlist는 지움?
  }, [addChatList]);

  useEffect(() => {
    const notice = (res) => {
      const newChatList = [...chatList, { type: "notice", content: res.msg }];
      setChatList(newChatList);
    };

    socket.on("notice", notice);
    return () => socket.off("notice", notice);
  }, [chatList]);

  //    채팅방 구현
  const sendMsg = () => {
    if (msgInput !== "") {
      socket.emit("sendMsg", { userId: userId, msg: msgInput, dm: dmTo });
      setMsgInput("");
    }
  };

  const entryChat = () => {
    initSocketConnect();
    socket.emit("entry", { userId: userIdInput });
  };

  return (
    <>
      {userId ? (
        <>
          <div className="chat-container">
            <div>{userId}님의 채팅방</div>
            {chatList.map((chat, i) => {
              if (chat.type === "notice") return <Notice key={i} chat={chat} />;
              else return <Chat key={i} chat={chat} />;
            })}
          </div>
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
            />
            <button onClick={sendMsg}>전송</button>
          </div>
        </>
      ) : (
        <>
          <div className="input-container">
            <label> Nickname </label>
            <input
              type="text"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
            />
            <button onClick={entryChat}>입장</button>
          </div>
        </>
      )}
    </>
  );
}
