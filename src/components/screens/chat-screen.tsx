"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { request } from "@/lib/api/request";

type Msg = {
  msg: { id: string; content: string; senderId: string; createdAt: string };
  sender: { id: string; name: string | null; email: string | null };
};

function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  const COLORS = ["#9CB48A","#C4A882","#89B4C8","#B8A86E","#A89BC8","#C8A889"];
  const idx = name.charCodeAt(0) % COLORS.length;
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white flex-none"
      style={{ width: size, height: size, background: COLORS[idx], fontSize: size * 0.38 }}>
      {name.slice(0,1)}
    </div>
  );
}

function fmtTime(s: string) {
  const d = new Date(s);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
function fmtDate(s: string) {
  const d = new Date(s), t = new Date();
  if (d.toDateString() === t.toDateString()) return "今天";
  const y = new Date(t); y.setDate(t.getDate()-1);
  if (d.toDateString() === y.toDateString()) return "昨天";
  return `${d.getMonth()+1}月${d.getDate()}日`;
}

export function ChatScreen() {
  const params = useParams();
  const convId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [otherName, setOtherName] = useState("对话");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    if (!user) return;
    request(`/api/messages/${convId}`).then(r=>r.json()).then((d)=>{
      const msgList: Msg[] = Array.isArray(d) ? d : (d.msgs ?? []);
      setMsgs(msgList);
      if (d.otherUser) {
        setOtherName(d.otherUser.name ?? d.otherUser.email ?? "对方");
      } else {
        const other = msgList.find((m: Msg)=>m.sender.id!==user.id)?.sender;
        if (other) setOtherName(other.name ?? other.email ?? "对方");
      }
    });
  };

  useEffect(()=>{ load(); },[convId, user]);

  // 5秒轮询
  useEffect(()=>{
    const t = setInterval(load, 5000);
    return ()=>clearInterval(t);
  },[convId, user]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({ behavior:"smooth" }); },[msgs]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending || !user) return;
    setInput(""); setSending(true);
    const opt: Msg = {
      msg: { id:`opt_${Date.now()}`, content, senderId: user.id, createdAt: new Date().toISOString() },
      sender: { id: user.id, name: user.name??null, email: user.email??null },
    };
    setMsgs(p=>[...p, opt]);
    try {
      const res = await request(`/api/messages/${convId}`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setMsgs(p=>p.map(m=>m.msg.id===opt.msg.id ? data : m));
    } catch { setMsgs(p=>p.filter(m=>m.msg.id!==opt.msg.id)); }
    finally { setSending(false); }
  };

  // 日期分组
  const grouped: {date:string; items:Msg[]}[] = [];
  msgs.forEach(m=>{
    const d = fmtDate(m.msg.createdAt);
    const last = grouped[grouped.length-1];
    if (!last||last.date!==d) grouped.push({date:d,items:[m]});
    else last.items.push(m);
  });

  if (!user) return (
    <div className="min-h-svh flex items-center justify-center" style={{background:"var(--color-bg)"}}>
      <p className="text-sm" style={{color:"#9B8E82"}}>请先登录</p>
    </div>
  );

  return (
    <div className="flex flex-col h-svh" style={{background:"var(--color-bg)"}}>
      {/* 顶栏 */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 flex-none"
        style={{background:"var(--color-bg)", borderBottom:"1px solid var(--color-border)"}}>
        <button onClick={()=>router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center" style={{background:"#F5F0EA"}}>
          <ArrowLeft className="w-4 h-4" style={{color:"#5A4E44"}}/>
        </button>
        <Avatar name={otherName} size={36}/>
        <div>
          <p className="text-sm font-bold" style={{color:"#2C2420"}}>{otherName}</p>
          <p className="text-xs" style={{color:"#9B8E82"}}>私信对话</p>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <div className="flex flex-col items-center pt-16 text-center">
            <p className="text-sm" style={{color:"#C4BDB5"}}>开始你们的第一条消息吧</p>
          </div>
        )}
        {grouped.map(g=>(
          <div key={g.date}>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{background:"#EBE7DF"}}/>
              <span className="text-[10px] px-2" style={{color:"#C4BDB5"}}>{g.date}</span>
              <div className="flex-1 h-px" style={{background:"#EBE7DF"}}/>
            </div>
            {g.items.map((m,i)=>{
              const mine = m.sender.id===user.id;
              const name = m.sender.name ?? m.sender.email ?? "用户";
              const showAv = !mine && (i===0 || g.items[i-1]?.sender.id!==m.sender.id);
              return (
                <div key={m.msg.id} className={`flex items-end gap-2 mb-2 ${mine?"flex-row-reverse":"flex-row"}`}>
                  {!mine ? (showAv ? <Avatar name={name} size={28}/> : <div style={{width:28}}/>): null}
                  <div className={`max-w-[72%] flex flex-col ${mine?"items-end":"items-start"}`}>
                    <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={{
                        background: mine ? "var(--color-primary)" : "white",
                        color: mine ? "white" : "#2C2420",
                        borderBottomRightRadius: mine ? 6 : 18,
                        borderBottomLeftRadius: mine ? 18 : 6,
                        boxShadow: mine ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
                      }}>
                      {m.msg.content}
                    </div>
                    <p className="text-[10px] mt-1 px-1" style={{color:"#C4BDB5"}}>{fmtTime(m.msg.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* 输入栏 */}
      <div className="flex items-end gap-2 px-4 py-3 flex-none border-t"
        style={{background:"var(--color-bg)", borderColor:"var(--color-border)", paddingBottom:"calc(env(safe-area-inset-bottom)+12px)"}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
          placeholder="说点什么…" rows={1}
          className="flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none"
          style={{background:"white", border:"1.5px solid var(--color-border)", color:"#2C2420", maxHeight:120}}/>
        <motion.button whileTap={{scale:0.9}} onClick={send} disabled={!input.trim()||sending}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-none"
          style={{background: input.trim() ? "var(--color-primary)" : "#E8E2D8"}}>
          <Send className="w-4 h-4 text-white"/>
        </motion.button>
      </div>
    </div>
  );
}
