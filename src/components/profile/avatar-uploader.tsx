"use client";
import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { storage } from "@eazo/sdk";

export function AvatarUploader({
  url, name, onChange,
}: { url: string; name: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const path = `avatars/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const result = await storage.upload(file, { path });
      const cdnUrl = result.url ?? result.publicUrl ?? (result as { data?: { url?: string } }).data?.url ?? "";
      if (!cdnUrl) throw new Error("未收到CDN地址");
      onChange(cdnUrl);
    } catch (err) {
      console.error("[avatar upload]", err);
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const initials = name?.trim()[0] ?? "?";

  return (
    <div className="flex items-center gap-4">
      {/* 头像预览 */}
      <div className="w-20 h-20 rounded-full overflow-hidden flex-none"
        style={{ background: "var(--color-primary)" }}>
        {url ? (
          <img src={url} alt="头像" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
            {initials}
          </div>
        )}
      </div>

      {/* 上传按钮 */}
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border"
          style={{ background: "white", borderColor: "#DDD8D0", color: "#2C2420", opacity: uploading ? 0.6 : 1 }}>
          <Camera className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          {uploading ? "上传中…" : url ? "更换头像" : "上传头像"}
        </button>
        {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
        <p className="text-xs" style={{ color: "#9B8E82" }}>支持 JPG / PNG，建议正方形</p>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
