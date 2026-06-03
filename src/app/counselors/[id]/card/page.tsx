"use client";
import { use } from "react";
import CounselorCardScreen from "@/components/screens/counselor-card-screen";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CounselorCardScreen id={id} />;
}
