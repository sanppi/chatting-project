export default function Notice({ chat }) {
  return (
    <>
      <div className="list-notice">{chat.content}</div>
      <div>{chat.time}</div>
    </>
  );
}
