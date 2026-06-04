"use client";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { storage } from "@eazo/sdk";
import { useEazo } from "@eazo/sdk/react";

export function AvatarUploader({
  url, name, onChange,
}: { url: string; name: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const user = useEazo((s) => s.auth.user);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const userId = user?.id ?? "unknown";
      const key = `avatars/${userId}/${Date.now()}.${ext}`;
      const { url: cdnUrl } = await storage.upload(key, file, {
        contentType: file.type || "image/jpeg",
      });
      onChange(cdnUrl);
    } catch (err) {
      console.error("头像上传失败", err);
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const initials = name?.slice(0, 1) ?? "?";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center font-bold text-2xl text-white"
          style={{ background: url ? "transparent" : "var(--color-primary)" }}>
          {url
            ? <img src={url} alt="avatar" className="w-full h-full object-cover" />
            : initials}
        </div>
        <button type="button" onClick={() => ref.current?.click()}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "#5A4E44", border: "2px solid white" }}>
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            : <Camera className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>
      <button type="button" onClick={() => ref.current?.click()}
        disabled={uploading}
        className="px-4 py-1.5 rounded-full text-sm font-medium border"
        style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)", opacity: uploading ? 0.5 : 1 }}>
        {uploading ? "上传中…" : <>{url ? "更换头像" : "上传头像"}</>}
      </button>
      {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
      <p className="text-xs" style={{ color: "#9B8E82" }}>支持 JPG / PNG，建议正方形</p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFile} />
    </div>
  );
}
