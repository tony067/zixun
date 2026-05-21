"use client";
import { useState, useEffect } from "react";
import ExploreScreen from "@/components/screens/ExploreScreen";

export default function HomePage() {
  const [counselors, setCounselors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [avail, setAvail] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/counselors").then(r => r.json())
      .then(data => { setCounselors(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = counselors.filter(c => {
    if (search && !c.displayName.includes(search) && !c.bio.includes(search) &&
        !c.specialties?.some((s: string) => s.includes(search))) return false;
    if (role === "督导" && !c.isSupervisor) return false;
    else if (role !== "all" && role !== "督导" && !c.counselorTypes?.includes(role)) return false;
    if (avail.includes("online") && !c.sessionModes?.includes("视频") && !c.sessionModes?.includes("语音")) return false;
    if (avail.includes("accepting") && !c.isAccepting) return false;
    return true;
  });

  const toggleAvail = (k: string) => setAvail(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);
  const clear = () => { setSearch(""); setRole("all"); setAvail([]); };

  return <ExploreScreen counselors={counselors} loading={loading} search={search} onSearch={setSearch}
    role={role} onRole={setRole} avail={avail} onAvail={toggleAvail} onClear={clear} filtered={filtered} />;
}
