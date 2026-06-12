import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState } from "react";
import { FAQS, BOOKING_STEPS, REFUNDS } from "@/lib/settings-data";

const T = (on: boolean) => ({ width:44,height:24,borderRadius:12,background:on?"#9CB48A":"#D4CFC8",position:"relative" as const,cursor:"pointer",flexShrink:0 as const });
const K = (on: boolean) => ({ position:"absolute" as const,top:3,left:on?23:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left 0.2s" });

type Sec = "main"|"notifications"|"privacy"|"help";
type Sub = "main"|"faq"|"booking"|"refund";

export default function SettingsScreen() {
  const router = useRouter();
  const [sec, setSec] = useState<Sec>("main");
  const [sub, setSub] = useState<Sub>("main");
  const [notif, setNotif] = useState({ booking:true,reminder:true,message:true,reschedule:true,news:false });
  const [faqOpen, setFaqOpen] = useState<number|null>(null);

  const back = () => {
    if (sec==="help"&&sub!=="main"){setSub("main");return;}
    if (sec!=="main"){setSec("main");setSub("main");return;}
    Taro.navigateBack();
  };

  const title = sec==="notifications"?"通知设置":sec==="privacy"?"隐私与安全":sec==="help"?(sub==="faq"?"常见问题 FAQ":sub==="booking"?"预约流程说明":sub==="refund"?"退款政策":"帮助与反馈"):"账号设置";

  return (
    <View className="min-h-svh pb-10" style={{background:"#F5F0E8"}}>
      <View className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3" style={{background:"rgba(245,240,232,0.97)",backdropFilter:"blur(10px)",borderBottom:"1px solid #EBE7DF"}}>
        <View onClick={back} className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{background:"#EBE7DF"}}>
          <Text>‹</Text>
        </View>
        <Text className="text-base font-bold" style={{color:"#2C2420"}}>{title}</Text>
      </View>

      <View className="px-4 pt-4 space-y-3">
        {sec==="main" && ([
          {icon:Bell,label:"通知设置",sub:"预约提醒和消息通知",id:"notifications" as Sec},
          {icon:Shield,label:"隐私与安全",sub:"密码和授权管理",id:"privacy" as Sec},
          {icon:HelpCircle,label:"帮助与反馈",sub:"常见问题和联系客服",id:"help" as Sec},
        ]).map(item=>(
          <View key={item.id} onClick={()=>setSec(item.id)} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl" style={{background:"white",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
            <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:"#F0F7EC"}}><item.icon className="w-5 h-5" style={{color:"#9CB48A"}}/></View>
            <View className="flex-1 text-left"><Text className="text-sm font-semibold" style={{color:"#2C2420"}}>{item.label}</Text><Text className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{item.sub}</Text></View>
            <Text>›</Text>
          </View>
        ))}

        {sec==="notifications" && (
          <View className="rounded-2xl overflow-hidden" style={{background:"white"}}>
            {([{k:"booking",l:"预约状态通知",s:"确认、支付、取消等"},{k:"reminder",l:"咨询提醒",s:"咨询前24小时和1小时提醒"},{k:"message",l:"新消息通知",s:"来自咨询师的私信"},{k:"reschedule",l:"改期通知",s:"改期申请和确认结果"},{k:"news",l:"平台动态",s:"新咨询师、活动和资讯"}] as {k:keyof typeof notif;l:string;s:string}[]).map((item,i,arr)=>(
              <View key={item.k} className={`flex items-center justify-between px-4 py-4${i<arr.length-1?" border-b":""}`} style={{borderColor:"#F5F0E8"}}>
                <View><Text className="text-sm font-medium" style={{color:"#2C2420"}}>{item.l}</Text><Text className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{item.s}</Text></View>
                <View style={T(notif[item.k])} onClick={()=>setNotif(p=>({...p,[item.k]:!p[item.k]}))}>
                  <View style={K(notif[item.k])}/>
                </View>
              </View>
            ))}
          </View>
        )}

        {sec==="privacy" && (
          <View className="space-y-3">
            <View className="rounded-2xl overflow-hidden" style={{background:"white"}}>
              {[{l:"修改密码",s:"定期更换密码保护安全"},{l:"绑定手机号",s:"用于账号验证和找回密码"},{l:"隐私设置",s:"控制谁能看到你的信息"}].map((item,i)=>(
                <View key={item.l} className={`flex items-center justify-between px-4 py-4${i<2?" border-b":""}`} style={{borderColor:"#F5F0E8"}}>
                  <View><Text className="text-sm font-medium" style={{color:"#2C2420"}}>{item.l}</Text><Text className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{item.s}</Text></View>
                  <Text>›</Text>
                </View>
              ))}
            </View>
            <View className="rounded-2xl" style={{background:"white"}}>
              <View className="flex items-center justify-between px-4 py-4">
                <View><Text className="text-sm font-medium" style={{color:"#E05555"}}>注销账号</Text><Text className="text-xs mt-0.5" style={{color:"#9B8E82"}}>永久删除账号和数据</Text></View>
                <Text>›</Text>
              </View>
            </View>
            <Text className="text-xs text-center px-4" style={{color:"#C4BDB5"}}>你的个人信息受《MindPace 隐私政策》保护，我们不会将你的数据出售给任何第三方。</Text>
          </View>
        )}

        {sec==="help"&&sub==="main" && (
          <View className="space-y-3">
            <View className="rounded-2xl overflow-hidden" style={{background:"white"}}>
              {([{l:"常见问题 FAQ",s:"查看使用指引和解答",id:"faq" as Sub},{l:"预约流程说明",s:"了解如何预约咨询师",id:"booking" as Sub},{l:"退款政策",s:"查看退款规则和流程",id:"refund" as Sub}]).map((item,i)=>(
                <View key={item.l} onClick={()=>setSub(item.id)} className={`w-full flex items-center justify-between px-4 py-4${i<2?" border-b":""}`} style={{borderColor:"#F5F0E8"}}>
                  <View className="text-left"><Text className="text-sm font-medium" style={{color:"#2C2420"}}>{item.l}</Text><Text className="text-xs mt-0.5" style={{color:"#9B8E82"}}>{item.s}</Text></View>
                  <Text>›</Text>
                </View>
              ))}
            </View>
            <Text className="text-xs font-medium text-center" style={{color:"#9B8E82"}}>联系我们</Text>
            <View className="flex gap-3">
              <View onClick={()=>Taro.navigateTo({url: '/pages/support/index'})} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border" style={{borderColor:"#9CB48A",color:"#9CB48A",background:"white"}}><Text>💬</Text>在线客服</View>
              <View onClick={()=>window.open("mailto:support@mindpace.app")} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold border" style={{borderColor:"#EBE7DF",color:"#5A4E44",background:"white"}}><Mail className="w-4 h-4"/>发送邮件</View>
            </View>
            <Text className="text-center text-xs" style={{color:"#C4BDB5"}}>MindPace v1.0.0</Text>
          </View>
        )}

        {sec==="help"&&sub==="faq" && (
          <View className="rounded-2xl overflow-hidden" style={{background:"white"}}>
            {FAQS.map((faq,i)=>(
              <View key={i} className={i<FAQS.length-1?"border-b":""} style={{borderColor:"#F5F0E8"}}>
                <View onClick={()=>setFaqOpen(faqOpen===i?null:i)} className="w-full flex items-center justify-between px-4 py-4 text-left">
                  <Text className="text-sm font-medium pr-4" style={{color:"#2C2420"}}>{faq.q}</Text>
                  <Text>∨</Text>
                </View>
                {faqOpen===i && <Text className="px-4 pb-4 text-sm leading-relaxed" style={{color:"#6B5F57"}}>{faq.a}</Text>}
              </View>
            ))}
          </View>
        )}

        {sec==="help"&&sub==="booking" && (
          <View className="space-y-3">
            {BOOKING_STEPS.map(s=>(
              <View key={s.n} className="flex gap-4 px-4 py-4 rounded-2xl" style={{background:"white"}}>
                <View className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{background:"#E8F4E0",color:"#5A7A3A"}}>{s.n}</View>
                <View><Text className="text-sm font-semibold" style={{color:"#2C2420"}}>{s.t}</Text><Text className="text-sm mt-1 leading-relaxed" style={{color:"#6B5F57"}}>{s.d}</Text></View>
              </View>
            ))}
          </View>
        )}

        {sec==="help"&&sub==="refund" && (
          <View className="space-y-3">
            <View className="rounded-2xl overflow-hidden" style={{background:"white"}}>
              {REFUNDS.map((r,i)=>(
                <View key={i} className={`flex items-center justify-between px-4 py-4${i<REFUNDS.length-1?" border-b":""}`} style={{borderColor:"#F5F0E8"}}>
                  <Text className="text-sm" style={{color:"#2C2420"}}>{r.label}</Text>
                  <Text className="text-sm font-semibold" style={{color:r.color}}>{r.value}</Text>
                </View>
              ))}
            </View>
            <Text className="text-xs px-4 py-3 rounded-2xl leading-relaxed" style={{background:"white",color:"#9B8E82"}}>退款申请请联系在线客服或发邮件至 support@mindpace.app，3-5个工作日内原路退回。</Text>
            <View onClick={()=>Taro.navigateTo({url: '/pages/support/index'})} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{background:"#9CB48A",color:"white"}}>联系客服申请退款</View>
          </View>
        )}
      </View>
    </View>
  );
}
