import AdminCounselorDetailScreen from "@/components/screens/admin-counselor-detail-screen";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminCounselorDetailScreen id={id} />;
}
