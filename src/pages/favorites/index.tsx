import { useState, useEffect, useRef } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text, Input, ScrollView, Image, Swiper, SwiperItem, Textarea } from '@tarojs/components'
import { request } from '../../api/request'
import { useAuthStore } from '../../store/authStore'

import { useState, useEffect } from "react";

type Counselor = {
  id: string; displayName: string; counselorTypes: string[];
  pricePerSession: number; location: string; avatarUrl?: string;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Counselor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 读取收藏的咨询师 ID
    const ids: string[] = JSON.parse(localStorage.getItem("favorite_counselors") ?? "[]");
    if (ids.length === 0) { setLoading(false); return; }
    request("/api/counselors").then(d => {
      const all: Counselor[] = d.counselors ?? [];
      setFavorites(all.filter(c => ids.includes(c.id)));
      setLoading(false);
    });
  }, []);

  function removeFavorite(id: string) {
    const ids: string[] = JSON.parse(localStorage.getItem("favorite_counselors") ?? "[]");
    const next = ids.filter(i => i !== id);
    localStorage.setItem("favorite_counselors", JSON.stringify(next));
    setFavorites(f => f.filter(c => c.id !== id));
  }

  return (
    <View className="min-h-screen pb-10" style={{ background:"var(--color-bg)" }}>
      <View className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 border-b"
        style={{ background:"rgba(245,240,232,0.95)", backdropFilter:"blur(8px)", borderColor:"#DDD8D0" }}>
        <View onClick={() => Taro.navigateBack()} className="p-1.5 rounded-full" style={{ background:"#EBE7DF" }}>
          <Text>←</Text>
        </View>
        <Text className="text-base font-bold" style={{ color:"#2C2420" }}>收藏的咨询师</Text>
      </View>

      <View className="px-5 pt-4">
        {loading ? (
          <View className="py-16 text-center text-sm" style={{ color:"#C4BDB5" }}>加载中…</View>
        ) : favorites.length === 0 ? (
          <View className="py-16 flex flex-col items-center gap-3">
            <Text>♥</Text>
            <Text className="text-sm" style={{ color:"#9B8E82" }}>还没有收藏的咨询师</Text>
            <View onClick={() => Taro.navigateTo({url: '/pages//index'})} className="mt-2 px-6 py-2.5 rounded-2xl text-sm font-medium text-white"
              style={{ background:"var(--color-primary)" }}>
              浏览咨询师
            </View>
          </View>
        ) : (
          <View className="space-y-3">
            {favorites.map(c => (
              <View key={c.id} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background:"white", border:"1px solid #EBE7DF" }}>
                <View className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-none"
                  style={{ background:"var(--color-primary)" }}>
                  {c.avatarUrl ? <Image src={c.avatarUrl} className="w-full h-full rounded-full object-cover" /> : c.displayName[0]}
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-bold" style={{ color:"#2C2420" }}>{c.displayName}</Text>
                  <Text className="text-xs mt-0.5" style={{ color:"#9B8E82" }}>
                    {(c.counselorTypes ?? []).join(" · ")} · ¥{c.pricePerSession}/次
                  </Text>
                </View>
                <View className="flex flex-col items-end gap-2">
                  <View onClick={() => Taro.navigateTo({url: '/pages/counselors/index?id=${c.id}'})}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium text-white"
                    style={{ background:"var(--color-primary)" }}>
                    查看详情
                  </View>
                  <View onClick={() => removeFavorite(c.id)}
                    className="text-xs" style={{ color:"#C4BDB5" }}>
                    取消收藏
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
