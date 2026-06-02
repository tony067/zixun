"use client";
import { useState, useEffect } from "react";
import { useEazo } from "@eazo/sdk/react";
import { auth } from "@eazo/sdk";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Settings, Calendar, Clock, Video, MessageCircle, ChevronRight, LogOut, Stethoscope, ShieldCheck } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; status: string; scheduledAt: string; durationMinutes: number;
  sessionMode: string; priceAmount: number; sessionNumber?: number;
  counselor: { id: string; displayName: string } | null;
};
const BOOKING_TABS = [
  { key: "pending_confirmation", label: "待确认", statuses: ["pending_confirmation"] },
  { key: "pending_payment",      label: "待支付", statuses: ["pending_payment"] },
  { key: "upcoming",             label: "待咨询", statuses: ["paid"] },
  { key: "past",                 label: "已完成",   statuses: ["completed","cancelled","rejected"] },
];
const STATUS_BADGE: Record<string,{label:string;color:string;bg:string}> = {
  pending_confirmation:{label:"待确认",color:"#D97706",bg:"#FEF3C7"},
  pending_payment:{label:"待支付",color:"#2563EB",bg:"#DBEAFE"},
  paid:{label:"即将咨询",color:"#059669",bg:"#D1FAE5"},
  completed:{label:"已完成",color:"#6B7280",bg:"#F3F4F6"},
  cancelled:{label:"已取消",color:"#9CA3AF",bg:"#F9FAFB"},
  rejected:{label:"已拒绝",color:"#DC2626",bg:"#FEF2F2"},
};
function BookingMiniCard({b}:{b:Booking}){
  const router = useRouter();
  const dt = b.scheduledAt ? new Date(b.scheduledAt) : null;
  const WD = ["周日","周一","周二","周三","周四","周五","周六"];
  const endDt = dt ? new Date(dt.getTime() + b.durationMinutes*60000) : null;
  const pad = (n:number) => n.toString().padStart(2,"0");
  const timeRange = dt && endDt ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}-${pad(endDt.getHours())}:${pad(endDt.getMinutes())}` : "";
  const dateStr = dt ? `${dt.getFullYear()}.${pad(dt.getMonth()+1)}.${pad(dt.getDate())} ${WD[dt.getDay()]} ${timeRange}` : "";
  const badge = STATUS_BADGE[b.status]??{label:b.status,color:"#9B8E82",bg:"#F5F0E8"};
  return(
    <motion.div layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
      className="rounded-2xl mb-3 overflow-hidden cursor-pointer" 
      style={{background:"white",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}
      onClick={()=>router.push(`/my-bookings/${b.id}`)}>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-[#2C2420]">
          第{b.sessionNumber??1}次 {b.sessionMode??"视频"}咨询 ›
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{color:badge.color,background:badge.bg}}>{badge.label}</span>
      </div>
      {dateStr && <p className="px-4 text-xs text-[#9B8E82] pb-3">{dateStr}</p>}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
          style={{background:"#E8DFCC",color:"#7A6248"}}>
          {b.counselor?.displayName[0]??"?"}
        </div>
        <div>
          <p className="text-[11px] text-[#9B8E82]">咨询师</p>
          <p className="text-sm font-semibold text-[#2C2420]">{b.counselor?.displayName??"咨询师"}</p>
        </div>
      </div>
      {/* 按钮区：stopPropagation 阻止冒泡，按钮各自带功能 */}
      <div className="border-t border-[#F0EBE3] px-4 py-3 flex gap-2" onClick={e=>e.stopPropagation()}>
        {b.status==="pending_confirmation"&&(<>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1"
            style={{borderColor:"#9CB48A",color:"#9CB48A"}}
            onClick={()=>router.push(`/messages?counselorId=${b.counselor?.id ?? ""}`)}>
            <MessageCircle className="w-3.5 h-3.5"/>联系咨询师</button>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border"
            style={{borderColor:"#E0D8CE",color:"#9B8E82"}}
            onClick={async()=>{if(!confirm("确认取消本次预约？"))return;const r=await request(`/api/bookings/${b.id}`);if(r.ok)window.location.reload();}}>取消预约</button>
        </>)}
        {b.status==="pending_payment"&&(<>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1"
            style={{borderColor:"#9CB48A",color:"#9CB48A"}}
            onClick={()=>router.push(`/messages?counselorId=${b.counselor?.id ?? ""}`)}>
            <MessageCircle className="w-3.5 h-3.5"/>联系咨询师</button>
          <button className="flex-[2] py-2.5 rounded-xl text-white text-xs font-semibold"
            style={{background:"#9CB48A"}}
            onClick={()=>router.push(`/my-bookings/${b.id}?pay=1`)}>立即支付 ¥{b.priceAmount}</button>
        </>)}
        {b.status==="paid"&&(<>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1"
            style={{borderColor:"#9CB48A",color:"#9CB48A"}}
            onClick={()=>router.push(`/messages?counselorId=${b.counselor?.id ?? ""}`)}>
            <MessageCircle className="w-3.5 h-3.5"/>联系咨询师</button>
          <button className="flex-[2] py-2.5 rounded-xl text-xs font-semibold border"
            style={{borderColor:"#E0D8CE",color:"#9B8E82"}}
            onClick={()=>router.push(`/my-bookings/${b.id}?reschedule=1`)}>申请改期</button>
        </>)}
        {(b.status==="completed"||b.status==="cancelled"||b.status==="rejected")&&(<>
          <button className="flex-1 py-2.5 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1"
            style={{borderColor:"#9CB48A",color:"#9CB48A"}}
            onClick={()=>router.push(`/messages?counselorId=${b.counselor?.id ?? ""}`)}>
            <MessageCircle className="w-3.5 h-3.5"/>联系咨询师</button>
          <button className="flex-[2] py-2.5 rounded-xl text-white text-xs font-semibold"
            style={{background:"#9CB48A"}}
            onClick={()=>router.push(`/booking/${b.counselor?.id ?? ""}`)}>续约</button>
        </>)}
      </div>
    </motion.div>
  );
}
export default function ProfileScreen(){
  const user=useEazo((s)=>s.auth.user);
  const loading=useEazo((s)=>s.auth.loading);
  const router=useRouter();
  const [tab,setTab]=useState(BOOKING_TABS[0].key);
  const [bookings,setBookings]=useState<Booking[]>([]);
  const [loadingBk,setLoadingBk]=useState(true);
  const [showSwitch,setShowSwitch]=useState(false);
  const [seenTabs,setSeenTabs]=useState<Record<string,number>>(()=>{
    try{ return JSON.parse(localStorage.getItem("bp_seen")||"{}"); }catch{ return {}; }
  });
  const markSeen=(key:string,count:number)=>{
    setSeenTabs(prev=>{
      const next={...prev,[key]:count};
      try{localStorage.setItem("bp_seen",JSON.stringify(next));}catch{}
      return next;
    });
  };
  useEffect(()=>{
    if(!user)return;
    request("/api/bookings/my").then(r=>r.json()).then(d=>{
      setBookings(Array.isArray(d)?d:[]);
    }).finally(()=>setLoadingBk(false));
  },[user]);
  const handleLogout=async()=>{await auth.logout();router.push("/");};
  const currentTab=BOOKING_TABS.find(t=>t.key===tab)!;
  const displayed=bookings.filter(b=>currentTab.statuses.includes(b.status));
  const counts=Object.fromEntries(BOOKING_TABS.map(t=>[t.key,bookings.filter(b=>t.statuses.includes(b.status)).length]));
  const PORTALS=[
    {icon:Stethoscope,label:"咨询师端",href:"/counselor/bookings"},
    {icon:ShieldCheck,label:"管理员端",href:"/admin/counselors"},
  ];
  if(loading)return<div className="min-h-svh flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#9CB48A] border-t-transparent animate-spin"/></div>;
  return(
    <div className="min-h-svh pb-28" style={{background:"var(--color-surface)"}}>
      {/* 个人信息区 */}
      <div className="px-5 pt-14 pb-5 relative">
        <button onClick={()=>router.push("/settings")}
          className="absolute top-14 right-5 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{background:"#F0EBE3"}}>
          <Settings className="w-4 h-4 text-[#9B8E82]"/>
        </button>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
            style={{background:"#E8DFCC",color:"#7A6248"}}>
            {(user?.name||user?.email||"我")[0]}
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2C2420]">{user?.name||"未设置昵称"}</h1>
            <p className="text-xs text-[#9B8E82] mt-0.5">{user?.email??""}</p>
          </div>
        </div>
      </div>
      {/* 预约管理标题 */}
      <div className="px-5 mb-2"><h2 className="text-base font-bold text-[#2C2420]">我的预约</h2></div>
      {/* 4个Tab */}
      <div className="sticky top-0 z-10 px-5 pb-3 pt-1" style={{background:"var(--color-surface)"}}>
        <div className="flex gap-1.5">
          {BOOKING_TABS.map(t=>(
            <button key={t.key} onClick={()=>{setTab(t.key);markSeen(t.key,counts[t.key]??0);}}
              className="flex-1 py-2 rounded-xl text-xs font-semibold relative transition-all"
              style={{background:tab===t.key?"#9CB48A":"#F0EBE3",color:tab===t.key?"white":"#9B8E82"}}>
              {t.label}
              {counts[t.key]>0&&tab!==t.key&&counts[t.key]>(seenTabs[t.key]??0)&&(
                <span className="absolute -top-1.5 -right-0.5 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white"
                  style={{background:"#E07B54"}}>{counts[t.key]-(seenTabs[t.key]??0)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* 订单列表 */}
      <div className="px-4">
        {loadingBk?(
          <div className="space-y-3">{[1,2].map(i=><div key={i} className="h-24 rounded-2xl skeleton"/>)}</div>
        ):displayed.length===0?(
          <div className="text-center py-16">
            <Calendar className="w-10 h-10 mx-auto mb-3" style={{color:"#C4BDB5"}}/>
            <p className="text-sm text-[#9B8E82]">暂无记录</p>
          </div>
        ):(
          <AnimatePresence mode="popLayout">
            {displayed.map(b=><BookingMiniCard key={b.id} b={b}/>)}
          </AnimatePresence>
        )}
      </div>
      {/* 退出登录 */}
      <div className="px-5 mt-6">
        <button onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 text-red-500"
          style={{background:"#FEF2F2",border:"1px solid #FECACA"}}>
          <LogOut className="w-4 h-4"/>退出登录
        </button>
      </div>
      {/* 切换端口 */}
      <div className="px-5 mt-4 pb-4">
        <button onClick={()=>setShowSwitch(!showSwitch)}
          className="w-full py-2 text-xs text-[#C4BDB5] flex items-center justify-center gap-1">
          · · · 切换端口
        </button>
        <AnimatePresence>
          {showSwitch&&(
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              className="mt-2 rounded-2xl overflow-hidden" style={{background:"white",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
              {PORTALS.map((p,i)=>(
                <button key={p.label} onClick={()=>{setShowSwitch(false);router.push(p.href);}}
                  className={`w-full flex items-center gap-3 px-4 py-3 ${i<PORTALS.length-1?"border-b border-[#F0EBE3]":""}`}>
                  <p.icon className="w-4 h-4 text-[#9B8E82]"/>
                  <span className="text-sm text-[#2C2420]">{p.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#C4BDB5] ml-auto"/>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
