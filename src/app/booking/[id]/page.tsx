"use client";
import { BookingScreen } from "@/components/screens/booking-screen";
import { useParams } from "next/navigation";
export default function Page() {
  const { id } = useParams();
  return <BookingScreen counselorId={id as string} />;
}
