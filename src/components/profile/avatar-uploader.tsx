"use client";
import { useRef } from "react";
import { Camera, X } from "lucide-react";
import { request } from "@/lib/api/request";

interface Props {
  avatarUrl: string;
  displayName: string;
  onChange: (url: string) => void;
}

export function AvatarUploader({ avatarUrl, displayName, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
    // 实际上传（简单版：base64存储在数据库字段里）
    const fr = new FileReader();
    fr.onload = () => onChange(fr.result as string);
    fr.readAsDataURL(file);
  };

  return (
    <div className="mb-4">
      <div className="text-sm font-medium text-[#2C2420] mb-1">头像</div>
      <div className="text-xs text-[#9B8E82] mb-3">支持 JPG / PNG，建议正方形，最大 5MB</div>
      <div className="flex items-start gap-4">
        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#F0EDE8] flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#9CB48A]">
              {displayName?.[0] || "?"}
            </div>
          )}
          {avatarUrl && (
            <button
              onClick={() => onChange("")}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <button
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#DDD8D0] bg-white text-sm text-[#2C2420]"
        >
          <Camera className="w-4 h-4 text-[#9B8E82]" />
          {avatarUrl ? "更换头像" : "上传头像"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
