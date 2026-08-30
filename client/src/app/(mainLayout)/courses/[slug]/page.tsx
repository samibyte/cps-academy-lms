import { cookies } from "next/headers";
import CourseDetailsClient from "./CourseDetailsClient";

type CourseDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseDetailsPage({
  params,
}: CourseDetailsPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const userRole = cookieStore.get("userRole")?.value ?? "";

  return <CourseDetailsClient slug={slug} userRole={userRole} />;
}
