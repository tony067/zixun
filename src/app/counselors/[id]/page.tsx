"use client";
import { useParams } from "next/navigation";
import { CounselorDetailScreen } from "@/components/screens/counselor-detail-screen";
export default function Page() {
  const { id } = useParams();
  return <CounselorDetailScreen counselorId={id as string} />;
}
