import { apiClient } from "@/lib/apiClient";

export interface PublicStats {
  totalCourses: number;
  totalStudents: number;
  totalLessons: number;
}

interface PublicStatsResponse {
  data: PublicStats;
}

export async function getPublicStats(): Promise<PublicStats | null> {
  try {
    const res = await apiClient<PublicStatsResponse>("/api/public/stats");
    return res.data;
  } catch (err) {
    console.error("[stats] Failed to fetch public stats", err);
    return null;
  }
}