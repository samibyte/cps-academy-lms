import type { Metadata } from "next";
import { cookies } from "next/headers";
import CourseDetailsClient from "./CourseDetailsClient";
import { getPublicCourseBySlug } from "../../_components/_actions/coursesActions";

type CourseDetailsPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: CourseDetailsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublicCourseBySlug(slug);

  return {
    title: course ? course.title : "Course Not Found",
  };
}

export default async function CourseDetailsPage({
  params,
}: CourseDetailsPageProps) {
  const { slug } = await params;
  const cookieStore = await cookies();
  const userRole = cookieStore.get("userRole")?.value ?? "";

  return <CourseDetailsClient slug={slug} userRole={userRole} />;
}
