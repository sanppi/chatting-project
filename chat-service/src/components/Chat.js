// ui가 다르기 때문에 (chat이랑 notice랑) 컴포넌트를 분리한 것.

export default function Chat({ chat }) {
  return (
    <div className={`list ${chat.type}-chat`}>
      <div className="content">{chat.content}</div>
    </div>
  );
}
