"use client";
import { useState } from "react";

interface Props {
  counselorName: string;
  dateStr: string;
  durationMinutes: number;
  priceAmount: number;
  isPackagePurchase?: boolean;
  packageSessions?: number;
  onPay: (method: string) => Promise<void>;
  onBack: () => void;
}

const PAY_METHODS = [
  { id: "wechat", label: "微信支付", color: "#07C160" },
  { id: "alipay", label: "支付宝",   color: "#1677FF" },
  { id: "card",   label: "银行卡",   color: "#9B8E82" },
];

export function Step4Payment({ counselorName, dateStr, durationMinutes, priceAmount, isPackagePurchase, packageSessions, onPay, onBack }: Props) {
  const [method, setMethod] = useState("wechat");
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handlePay = async () => {
    setPaying(true);
    setError("");
    try {
      await onPay(method);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "支付失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  };

  // 线下转账：不模拟支付扣款，订单以「待支付」提交，由客服确认收款
  const handleOffline = async () => {
    setPaying(true);
    setError("");
    try {
      await onPay("offline");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交失败，请稍后重试");
    } finally {
      setPaying(false);
    }
  };

  if (done) {
    const offline = method === "offline";
    // 文案分四种：套餐/单次 × 线上支付/线下转账
    const title = offline ? "订单已提交" : isPackagePurchase ? "购买成功！" : "支付成功！";
    const body = isPackagePurchase
      ? (offline
          ? "预约需求已收到，请联系客服完成转账，客服确认收款后套餐即生效，之后可在「我的预约」中逐次预约"
          : `你的${packageSessions ?? ""}次套餐已生效，无需等待确认，可在「我的预约」中随时使用套餐逐次预约`)
      : (offline
          ? "请尽快联系客服完成转账，客服确认收款后订单即生效，咨询师确认后将通知你"
          : "咨询师确认后将通知你，并发送咨询设置与链接");
    return (
      <div className="flex flex-col items-center px-8 text-center pt-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: offline ? "#FAE9DD" : "#E8F4E4" }}>
          {offline ? (
            <svg viewBox="0 0 48 48" className="w-12 h-12 fill-none" stroke="#C66B2E" strokeWidth="3">
              <circle cx="24" cy="24" r="20" />
              <path d="M24 14v20M14 24h20" />
            </svg>
          ) : (
            <svg viewBox="0 0 48 48" className="w-12 h-12 fill-none" stroke="#9CB48A" strokeWidth="3">
              <circle cx="24" cy="24" r="20" />
              <polyline points="14,24 21,31 34,17" />
            </svg>
          )}
        </div>
        <h2 className="text-xl font-bold text-[#2C2420] mb-2">{title}</h2>
        <p className="text-sm text-[#9B8E82] mb-2">{body}</p>
        <p className="text-sm font-semibold text-[#5A4E44]">{counselorName} · {dateStr}</p>
        <div className="flex gap-3 mt-8 w-full">
          <button onClick={onBack}
            className="flex-1 py-3 rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            返回首页
          </button>
          <a href={offline ? "/support" : isPackagePurchase ? "/my-bookings" : "/profile"}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm text-center"
            style={{ background: "var(--color-primary)" }}>
            {offline ? "联系客服转账" : isPackagePurchase ? "去使用套餐" : "查看我的预约"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 pb-6">
        {/* 费用摘要 */}
        <div className="mx-0 mt-4 mb-5 rounded-2xl p-5" style={{ background: "#E8DFCC" }}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs text-[#9B8E82] mb-1">咨询师</p>
              <p className="text-base font-bold text-[#2C2420]">{counselorName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#9B8E82] mb-1">费用</p>
              <p className="text-2xl font-black text-[#2C2420]">¥{priceAmount}</p>
            </div>
          </div>
          <div className="border-t pt-3" style={{ borderColor: "#D8D0BC" }}>
            <p className="text-sm text-[#5A4E44]">{dateStr} · {durationMinutes} 分钟</p>
          </div>
          <p className="text-xs mt-3" style={{ color: "#8A7F6E" }}>此页仅为支付预览，点击下方「确认支付」后订单才会正式提交给咨询师</p>
        </div>

        {/* 支付方式 */}
        <h3 className="text-sm font-bold text-[#2C2420] mb-3">选择支付方式</h3>
        <div className="rounded-2xl overflow-hidden" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
          {PAY_METHODS.map((m, i) => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className="w-full flex items-center justify-between px-4 py-4 transition-colors"
              style={{ borderTop: i > 0 ? "1px solid #F5F0EA" : "none", background: "transparent" }}>
              <div className="flex items-center gap-3">
                
                <span className="text-sm font-medium text-[#2C2420]">{m.label}</span>
              </div>
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                style={{ borderColor: method === m.id ? "var(--color-primary)" : "#C4BDB5" }}>
                {method === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--color-primary)" }} />}
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-[#C4BDB5] text-center mt-4">
          支付即表示您同意平台服务协议及取消政策
        </p>
        {error && (
          <p className="text-xs text-red-600 text-center mt-2 font-medium">{error}</p>
        )}
      </div>

      {/* 底部 */}
      <div className="px-5 pb-8 pt-3 border-t" style={{ borderColor: "#EBE7DF", background: "var(--color-bg)" }}>
        <div className="flex gap-3">
          <button onClick={onBack} className="px-5 py-3 rounded-2xl border text-sm font-semibold"
            style={{ borderColor: "#E8E2D8", color: "#9B8E82" }}>
            返回
          </button>
          <button onClick={handlePay} disabled={paying}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-base"
            style={{ background: paying ? "#C4BDB5" : "var(--color-primary)" }}>
            {paying ? "处理中…" : `确认支付 ¥${priceAmount}`}
          </button>
        </div>
        <button onClick={handleOffline} disabled={paying}
          className="w-full mt-2.5 py-2.5 rounded-2xl text-sm font-medium"
          style={{ background: "transparent", color: "#9B8E82" }}>
          付款遇到问题？联系客服协助支付 →
        </button>
      </div>
    </div>
  );
}
