import { redirect } from "next/navigation";

export default async function CMCourseDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/content-manager/courses/${id}/lessons`);
}
