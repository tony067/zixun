"use client";
import { useParams } from "next/navigation";
import { BookingScreen } from "@/components/screens/booking-screen";
export default function Page() {
  const { id } = useParams();
  return <BookingScreen counselorId={id as string} />;
}
