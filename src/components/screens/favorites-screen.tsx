"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart } from "lucide-react";
import { request } from "@/lib/api/request";
import { useAuth } from "@/contexts/auth-context";

type Counselor = {
  id: string; displayName: string; counselorTypes: string[];
  pricePerSession: number; location: string; avatarUrl?: string;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function loadFavorites() {
      setLoading(true);
      try {
        const legacyIds: string[] = JSON.parse(localStorage.getItem("favorite_counselors") ?? "[]");
        if (legacyIds.length > 0) {
          await Promise.all(
            legacyIds.map((counselorId) =>
              request("/api/user/favorites", {
                method: "POST",
                body: JSON.stringify({ counselorId }),
              }).catch(() => null),
            ),
          );
        }

        const res = await request("/api/user/favorites");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "加载收藏失败");
        if (!cancelled) setFavorites(data.counselors ?? []);
      } catch {
        if (!cancelled) setFavorites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFavorites();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  async function removeFavorite(id: string) {
    await request("/api/user/favorites", {
      method: "DELETE",
      body: JSON.stringify({ counselorId: id }),
    }).catch(() => null);
    const ids: string[] = JSON.parse(localStorage.getItem("favorite_counselors") ?? "[]");
    localStorage.setItem("favorite_counselors", JSON.stringify(ids.filter(i => i !== id)));
    setFavorites(f => f.filter(c => c.id !== id));
  }

  return (
    <div className="min-h-screen pb-10" style={{ background:"var(--color-bg)" }}>
      <div className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background:"rgba(245,240,232,0.95)", backdropFilter:"blur(8px)", borderColor:"#DDD8D0" }}>
        <button onClick={() => router.back()} className="p-1.5 rounded-full" style={{ background:"#EBE7DF" }}>
          <ArrowLeft className="w-4 h-4" style={{ color:"#5A4E44" }} />
        </button>
        <h1 className="text-base font-bold" style={{ color:"#2C2420" }}>收藏的咨询师</h1>
      </div>

      <div className="px-5 pt-4">
        {!user && !authLoading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Heart className="w-10 h-10" style={{ color:"#DDD8D0" }} />
            <p className="text-sm" style={{ color:"#9B8E82" }}>登录后查看收藏的咨询师</p>
            <button onClick={() => router.push("/login")} className="mt-2 px-6 py-2.5 rounded-2xl text-sm font-medium text-white"
              style={{ background:"var(--color-primary)" }}>
              去登录
            </button>
          </div>
        ) : loading ? (
          <div className="py-16 text-center text-sm" style={{ color:"#C4BDB5" }}>加载中…</div>
        ) : favorites.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Heart className="w-10 h-10" style={{ color:"#DDD8D0" }} />
            <p className="text-sm" style={{ color:"#9B8E82" }}>还没有收藏的咨询师</p>
            <button onClick={() => router.push("/")} className="mt-2 px-6 py-2.5 rounded-2xl text-sm font-medium text-white"
              style={{ background:"var(--color-primary)" }}>
              浏览咨询师
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map(c => (
              <div key={c.id} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background:"white", border:"1px solid #EBE7DF" }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-none"
                  style={{ background:"var(--color-primary)" }}>
                  {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full rounded-full object-cover" /> : c.displayName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color:"#2C2420" }}>{c.displayName}</p>
                  <p className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>
                    {(c.counselorTypes ?? []).join(" · ")} · ¥{c.pricePerSession}/次
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={() => router.push(`/counselors/${c.id}`)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                    style={{ background:"var(--color-primary)" }}>
                    查看详情
                  </button>
                  <button onClick={() => removeFavorite(c.id)}
                    className="text-xs" style={{ color:"#C4BDB5" }}>
                    取消收藏
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
