"use client";
import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { request } from "@/lib/api/request";

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
      const fd = new FormData();
      fd.append("file", file);
      const res = await request("/api/upload/avatar", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "上传失败");
      }
      const { url: cdnUrl } = await res.json();
      onChange(cdnUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const initials = name?.slice(0, 1) ?? "?";

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={() => ref.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
        style={{ background: url ? "transparent" : "var(--color-primary)" }}>
        {url ? (
          <img src={url} alt="头像" className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-bold text-white">{initials}</span>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {uploading
            ? <Loader2 className="w-6 h-6 text-white animate-spin" />
            : <Camera className="w-6 h-6 text-white" />
          }
        </div>
      </button>
      <button type="button" onClick={() => ref.current?.click()}
        className="text-sm font-medium px-4 py-1.5 rounded-full"
        style={{ background: "#E8DFCC", color: "#5A4E44" }}>
        {uploading
          ? <Loader2 className="w-4 h-4 animate-spin inline" />
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
