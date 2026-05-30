"use client";

interface Props {
  counselorName: string;
  dateStr: string;
  bookingId: string;
  onGoPayment: () => void;
}

export function Step3Waiting({ counselorName, dateStr, bookingId, onGoPayment }: Props) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-8 text-center">
      {/* 动画图标 */}
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 relative"
        style={{ background: "#E8F4E4" }}>
        <svg viewBox="0 0 48 48" className="w-12 h-12 fill-none" stroke="#9CB48A" strokeWidth="2.5">
          <circle cx="24" cy="24" r="20" />
          <polyline points="24,14 24,24 30,30" />
        </svg>
        <div className="absolute inset-0 rounded-full border-2 animate-ping opacity-30"
          style={{ borderColor: "#9CB48A" }} />
      </div>

      <h2 className="text-xl font-bold text-[#2C2420] mb-2">预约申请已提交</h2>
      <p className="text-sm text-[#9B8E82] mb-6 leading-relaxed">
        已向 <span className="font-semibold text-[#5A4E44]">{counselorName}</span> 发送预约申请。
        咨询师通常在 12 小时内确认，确认后你将收到通知并可支付。
      </p>

      {/* 摘要卡 */}
      <div className="w-full rounded-2xl p-4 text-left mb-6" style={{ background: "#E8DFCC" }}>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#9B8E82]">咨询师</span>
          <span className="text-sm font-semibold text-[#2C2420]">{counselorName}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[#9B8E82]">预约时间</span>
          <span className="text-sm text-[#5A4E44]">{dateStr}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-[#9B8E82]">订单编号</span>
          <span className="text-xs text-[#9B8E82]">{bookingId.toUpperCase()}</span>
        </div>
      </div>

      <p className="text-xs text-[#C4BDB5]">
        如需取消或修改，请在咨询师确认前操作
      </p>
    </div>
  );
}
