"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Phone, User } from "lucide-react";
import { request } from "@/lib/api/request";

type Booking = {
  id: string; scheduledAt: string; sessionNumber: number;
  status: string; sessionMode: string; durationMinutes: number; priceAmount: number;
  applicationForm?: { purposes?: string[]; background?: string; emergencyContact?: string; emergencyPhone?: string };
};
type ClientData = {
  clientId: string; clientName: string; clientEmail: string;
  firstBookingAt: string; totalSessions: number; completedSessions: number;
  bookings: Booking[];
};

const STATUS_LABEL: Record<string,string> = {
  pending_confirmation:"待确认",pending_payment:"待支付",confirmed:"待咨询",completed:"已完成",cancelled:"已取消"
};
const STATUS_COLOR: Record<string,[string,string]> = {
  completed:["#E4F0DC","#3A6228"], cancelled:["#F5F0EA","#9B8E82"],
  confirmed:["#E8F4FC","#2A6E8A"], pending_payment:["#FEF3E2","#8A5A1A"],
  pending_confirmation:["#FEF3E2","#8A5A1A"],
};
function fmt(d:string){const t=new Date(d);return`${t.getMonth()+1}/${t.getDate()} ${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`;}

const MOCK:ClientData={
  clientId:"mock",clientName:"张小明",clientEmail:"zhangxm@example.com",
  firstBookingAt:new Date(Date.now()-30*864e5).toISOString(),
  totalSessions:4,completedSessions:3,
  bookings:[
    {id:"b1",scheduledAt:new Date(Date.now()-28*864e5).toISOString(),sessionNumber:1,status:"completed",sessionMode:"视频咨询",durationMinutes:50,priceAmount:380,
      applicationForm:{purpose:["焦虑","人际关系"],background:"工作压力较大，近半年睡眠质量下降，与同事关系紧张，希望通过咨询找到调整方式。",emergencyContact:"张父",emergencyPhone:"138xxxx0001"}},
    {id:"b2",scheduledAt:new Date(Date.now()-14*864e5).toISOString(),sessionNumber:2,status:"completed",sessionMode:"视频咨询",durationMinutes:50,priceAmount:380,applicationForm:{}},
    {id:"b3",scheduledAt:new Date(Date.now()-7*864e5).toISOString(),sessionNumber:3,status:"completed",sessionMode:"视频咨询",durationMinutes:50,priceAmount:380,applicationForm:{}},
    {id:"b4",scheduledAt:new Date(Date.now()+7*864e5).toISOString(),sessionNumber:4,status:"confirmed",sessionMode:"视频咨询",durationMinutes:50,priceAmount:380,applicationForm:{}},
  ],
};

export default function ClientDetailScreen() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.id as string;
  const [data, setData] = useState<ClientData|null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    request("/api/counselor/bookings").then(r=>r.json()).then((d:any)=>{
      const all:any[] = Array.isArray(d.bookings)?d.bookings:[];
      const mine = all.filter(b=>b.clientId===clientId||b.clientUserId===clientId);
      if(!mine.length){setLoading(false);return;}
      const sorted = [...mine].sort((a,b)=>new Date(a.scheduledAt).getTime()-new Date(b.scheduledAt).getTime());
      setData({clientId,clientName:sorted[0].clientName??"来访者",clientEmail:sorted[0].clientEmail??"",
        firstBookingAt:sorted[0].scheduledAt,totalSessions:mine.length,
        completedSessions:mine.filter((b:any)=>b.status==="completed").length,bookings:mine});
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[clientId]);

  const d = data ?? MOCK;
  const firstForm = d.bookings[0]?.applicationForm;

  return (
    <div className="h-svh flex flex-col" style={{background:"var(--color-bg)"}}>
      <div className="flex-none sticky top-0 z-20 flex items-center gap-3 px-4 pb-4"
        style={{ paddingTop: "max(env(safe-area-inset-top), 16px)", background: "rgba(245,240,232,0.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EBE7DF" }}>
        <button onClick={()=>router.back()} className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{background:"white",border:"1.5px solid var(--color-border)"}}>
          <ArrowLeft className="w-4 h-4" style={{color:"#5A4E44"}}/>
        </button>
        <h1 className="text-base font-bold" style={{color:"#2C2420"}}>来访档案</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-10">
        {/* 基本信息 */}
        <div className="rounded-2xl p-4 mb-4" style={{background:"white",border:"1.5px solid var(--color-border)"}}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-none"
              style={{background:"var(--color-primary)"}}>
              {d.clientName.slice(0,1)}
            </div>
            <div>
              <p className="font-bold text-base" style={{color:"#2C2420"}}>{d.clientName}</p>
              <p className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{d.clientEmail}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              {label:"首次咨询",value:new Date(d.firstBookingAt).toLocaleDateString("zh-CN",{month:"numeric",day:"numeric"})},
              {label:"总节次",value:`${d.totalSessions} 次`},
              {label:"已完成",value:`${d.completedSessions} 次`},
            ].map(item=>(
              <div key={item.label} className="rounded-xl py-2.5 px-3 text-center" style={{background:"#F8F5F0"}}>
                <p className="text-base font-bold" style={{color:"#2C2420"}}>{item.value}</p>
                <p className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 初始申请单 */}
        {firstForm?.background && (
          <div className="rounded-2xl mb-4 overflow-hidden" style={{background:"white",border:"1.5px solid var(--color-border)"}}>
            <button className="w-full flex items-center justify-between px-4 py-3.5" onClick={()=>setShowForm(v=>!v)}>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" style={{color:"var(--color-primary)"}}/>
                <span className="text-sm font-semibold" style={{color:"#2C2420"}}>初始预约表单</span>
              </div>
              {showForm?<ChevronUp className="w-4 h-4" style={{color:"#9B8E82"}}/>:<ChevronDown className="w-4 h-4" style={{color:"#9B8E82"}}/>}
            </button>
            <AnimatePresence>
              {showForm&&(
                <motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} className="overflow-hidden">
                  <div className="px-4 pb-4 border-t" style={{borderColor:"var(--color-border)"}}>
                    {firstForm.purposes?.length?(<div className="mt-3 mb-2">
                      <p className="text-xs font-medium mb-1.5" style={{color:"#9B8E82"}}>咨询目的</p>
                      <div className="flex flex-wrap gap-1.5">
                        {firstForm.purposes.map(p=>(
                          <span key={p} className="px-2.5 py-1 rounded-full text-xs" style={{background:"#E4F0DC",color:"#3A6228"}}>{p}</span>
                        ))}
                      </div>
                    </div>):null}
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-1" style={{color:"#9B8E82"}}>背景描述</p>
                      <p className="text-sm leading-relaxed" style={{color:"#2C2420"}}>{firstForm.background}</p>
                    </div>
                    {firstForm.emergencyContact&&(
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" style={{color:"#9B8E82"}}/>
                          <span className="text-xs" style={{color:"#5A4E44"}}>紧急联系人：{firstForm.emergencyContact}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" style={{color:"#9B8E82"}}/>
                          <span className="text-xs" style={{color:"#5A4E44"}}>{firstForm.emergencyPhone}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* 咨询记录 */}
        <p className="text-sm font-bold mb-3" style={{color:"#2C2420"}}>咨询记录</p>
        <div className="space-y-3 mb-10">
          {d.bookings.map(b=>{
            const [bg,color] = STATUS_COLOR[b.status]??["#F5F0EA","#9B8E82"];
            const expanded = expandedId===b.id;
            return(
              <div key={b.id} className="rounded-2xl overflow-hidden" style={{background:"white",border:"1.5px solid var(--color-border)"}}>
                <button className="w-full flex items-center justify-between px-4 py-3.5"
                  onClick={()=>setExpandedId(expanded?null:b.id)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                      style={{background:"#E4F0DC",color:"#3A6228"}}>{b.sessionNumber}</div>
                    <div className="text-left">
                      <p className="text-sm font-medium" style={{color:"#2C2420"}}>第 {b.sessionNumber} 次 · {b.sessionMode}</p>
                      <p className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{fmt(b.scheduledAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{background:bg,color}}>
                      {STATUS_LABEL[b.status]??b.status}
                    </span>
                    {expanded?<ChevronUp className="w-4 h-4" style={{color:"#9B8E82"}}/>:<ChevronDown className="w-4 h-4" style={{color:"#9B8E82"}}/>}
                  </div>
                </button>
                <AnimatePresence>
                  {expanded&&(
                    <motion.div initial={{height:0}} animate={{height:"auto"}} exit={{height:0}} className="overflow-hidden">
                      <div className="px-4 pb-4 border-t" style={{borderColor:"var(--color-border)"}}>
                        <div className="grid grid-cols-2 gap-2 mt-3">
                          {[
                            {label:"咨询方式",value:b.sessionMode},{label:"时长",value:`${b.durationMinutes} 分钟`},
                            {label:"费用",value:`¥${b.priceAmount}`},{label:"状态",value:STATUS_LABEL[b.status]??b.status},
                          ].map(item=>(
                            <div key={item.label} className="rounded-xl p-2.5" style={{background:"#F8F5F0"}}>
                              <p className="text-xs" style={{color:"#9B8E82"}}>{item.label}</p>
                              <p className="text-sm font-medium mt-0.5" style={{color:"#2C2420"}}>{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
