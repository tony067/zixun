"use client";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";

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
      // 1. 后端获取预签名 URL
      const metaRes = await fetch("/api/counselor/avatar-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!metaRes.ok) throw new Error("获取上传地址失败");
      const { uploadUrl, cdnUrl } = await metaRes.json();

      // 2. 直接 PUT 到 S3
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploadRes.ok) throw new Error("上传失败，请重试");

      onChange(cdnUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const initials = name ? name.slice(0, 1) : "?";

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-none"
        style={{ background: "var(--color-primary)" }}>
        {url
          ? <img src={url} alt="头像" className="w-full h-full object-cover" />
          : <span className="text-2xl font-bold text-white">{initials}</span>}
      </div>
      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={() => ref.current?.click()} disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border"
          style={{ background: "white", borderColor: "#DDD8D0", color: "#2C2420" }}>
          {uploading
            ? <><Loader2 className="w-4 h-4 animate-spin" />上传中…</>
            : <><Camera className="w-4 h-4" />{url ? "更换头像" : "上传头像"}</>}
        </button>
        {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}
        <p className="text-xs" style={{ color: "#9B8E82" }}>支持 JPG / PNG，建议正方形</p>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp"
          className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}
