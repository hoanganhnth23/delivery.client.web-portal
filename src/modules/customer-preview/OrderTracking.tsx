import { useEffect, useState } from "react";
import { deliveryStages, type MockOrder } from "./model";

export default function OrderTracking({ order, onStatus }: { order: MockOrder; onStatus: (status: string) => void }) {
  const [playing, setPlaying] = useState(false);
  const stage = deliveryStages.indexOf(order.status);
  const terminal = order.status === "Đã giao" || order.status === "Đã hủy";
  useEffect(() => {
    if (!playing || terminal || stage < 0) return;
    const timer = window.setTimeout(() => onStatus(deliveryStages[stage + 1]), 3000);
    return () => window.clearTimeout(timer);
  }, [playing, terminal, stage, onStatus]);
  const [message, setMessage] = useState("");
  const positions = [[70,180],[95,150],[130,120],[240,90],[320,55]];
  const [x,y] = positions[Math.max(0,stage)];
  return <section className="sf-tracking">
    <div className="sf-tracking-controls"><span><b>Theo dõi thử</b><small>Mô phỏng · mỗi bước 3 giây</small></span><button onClick={() => { if (terminal) { onStatus(deliveryStages[0]); setPlaying(true); } else setPlaying(!playing); }}>{terminal ? "Chạy lại" : playing ? "Tạm dừng" : "Chạy mô phỏng"}</button></div>
    {order.status !== "Đã hủy" && <>
      <div className="sf-tracking-map"><svg viewBox="0 0 390 240" role="img" aria-label={`Bản đồ minh họa: ${order.status}`}>
        <rect width="390" height="240" fill="#edf0e9"/><path d="M0 45H390M0 115H390M0 205H390M55 0V240M150 0V240M290 0V240" stroke="white" strokeWidth="14"/><path d="M350 0Q305 90 355 150T355 240" fill="none" stroke="#c1e5e9" strokeWidth="26"/>
        <rect x="175" y="135" width="76" height="47" rx="12" fill="#d1e3bf"/><text x="190" y="163" fontSize="10" fill="#719063">Công viên</text><text x="65" y="30" fontSize="10" fill="#889082">HOÀN KIẾM</text><text x="165" y="222" fontSize="10" fill="#889082">TRÀNG THI</text>
        <path d="M70 180L95 150L130 120L240 90L320 55" stroke="white" strokeWidth="10" fill="none"/><path d="M70 180L95 150L130 120L240 90L320 55" stroke="#ee4d2d" strokeWidth="5" fill="none" strokeDasharray={stage<3?'6 4':undefined}/>
        <circle cx="70" cy="180" r="13" fill="#fff" stroke="#ee4d2d" strokeWidth="2"/><text x="65" y="185" fontSize="13" fill="#ee4d2d">Q</text><text x="26" y="214" fontSize="11" fill="#555">Nhà hàng</text>
        <circle cx="320" cy="55" r="14" fill="#ee4d2d"/><text x="315" y="60" fontSize="14" fill="white">⌂</text><text x="286" y="30" fontSize="11" fill="#555">Địa chỉ nhận</text>
        <g className="sf-driver-marker" style={{transform:`translate(${x}px,${y}px)`}}><circle r="19" fill="#fff" stroke="#179b80" strokeWidth="3"/><text x="-9" y="7" fontSize="22" fill="#179b80">➤</text></g>
      </svg><span>Sơ đồ minh họa · không phải GPS thật</span></div>
      <div className="sf-tracking-eta"><b>{stage === 4 ? "Đã giao đến bạn" : `Dự kiến còn ${[25,20,15,8][Math.max(0,stage)]} phút`}</b><small>{order.address.line}</small></div>
      {stage>=2 && <div className="sf-driver-card"><div className="sf-driver-avatar">TA</div><span><b>Tuấn Anh · Tài xế mẫu</b><small>★ 4.9 · Honda Wave · 29-A1 000.00</small></span><button aria-label="Liên hệ tài xế mẫu" onClick={()=>setMessage("Đây là tài xế giả lập. Không thực hiện cuộc gọi hoặc gửi tin nhắn thật.")}><span className="material-symbols-outlined" aria-hidden="true">chat_bubble_outline</span></button></div>}
    </>}
    {message && <p className="sf-tracking-message" role="status">{message}</p>}
    <ol className="sf-timeline">{(order.status === "Đã hủy" ? ["Đã đặt đơn", "Đã hủy"] : deliveryStages).map((label,index)=><li key={label} className={order.status === "Đã hủy" || index<=stage ? "done" : ""} aria-current={label===order.status?'step':undefined}><i/ ><span><b>{label}</b>{label===order.status && <small>Trạng thái hiện tại</small>}</span></li>)}</ol>
    {!terminal && <button className="sf-tracking-next" onClick={()=>{setPlaying(false);onStatus(deliveryStages[Math.min(stage+1,4)]);}}>Chuyển bước tiếp theo →</button>}
  </section>;
}
