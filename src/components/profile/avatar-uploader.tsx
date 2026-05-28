"use client";
import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { storage } from "@eazo/sdk";

export function AvatarUploader({
  url, name, onChange,
}: { url: string; name: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // upload as raw File — cast to satisfy SDK's overloaded signature
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (storage.upload as any)(file, { path: `avatars/${Date.now()}_${file.name}` });
      onChange((result as { url: string }).url);
    } catch { /* silent */ } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="relative flex-shrink-0">
        <div
          className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center text-2xl font-bold"
          style={{ background: url ? undefined : "#D4E8C8", color: "#3a6228" }}
        >
          {url
            ? <img src={url} alt="头像" className="w-full h-full object-cover" />
            : (name?.[0] ?? "?")}
        </div>
        {url && (
          <button onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
            <X className="w-3 h-3" />
          </button>
        )}
        {uploading && (
          <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-[#2C2420] mb-1">头像</p>
        <p className="text-xs text-[#9B8E82] mb-2">支持 JPG / PNG，建议正方形，最大 5MB</p>
        <button onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-[#2C2420] border border-[#DDD8D0] bg-white">
          <Camera className="w-4 h-4" />
          {url ? "更换头像" : "上传头像"}
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
