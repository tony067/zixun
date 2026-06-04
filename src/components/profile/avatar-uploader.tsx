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
  const user = useEazo((s: { auth: { user: { id?: string } | null } }) => s.auth.user);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `avatars/${user?.id ?? "unknown"}/${Date.now()}.${ext}`;
      const { url: cdnUrl } = await storage.upload(path, file, {
        contentType: file.type || "image/jpeg",
      });
      onChange(cdnUrl);
    } catch (err) {
      console.error("头像上传失败:", err);
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* 头像预览 */}
      <div className="relative w-24 h-24">
        <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-white"
          style={{ background: url ? "transparent" : "var(--color-primary)" }}>
          {url
            ? <img src={url} alt="头像" className="w-full h-full object-cover" />
            : <span>{name?.[0] ?? "?"}</span>
          }
        </div>
        <button type="button" onClick={() => ref.current?.click()}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow"
          style={{ background: "var(--color-primary)" }}>
          <Camera className="w-4 h-4 text-white" />
        </button>
      </div>

      <button type="button" onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
        style={{ background: "#EBE7DF", color: "#5A4E44" }}>
        {uploading
          ? <><Loader2 className="w-4 h-4 animate-spin" />上传中…</>
          : <>{url ? "更换头像" : "上传头像"}</>
        }
      </button>

      {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
      <p className="text-xs" style={{ color: "#9B8E82" }}>支持 JPG / PNG，建议正方形</p>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
        className="hidden" onChange={handleFile} />
    </div>
  );
}
