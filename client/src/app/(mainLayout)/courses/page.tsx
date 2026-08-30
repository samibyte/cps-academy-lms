"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Loader2,
  BookOpen,
  Terminal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { CourseCard } from "../_components/FeaturedCourses";
import { Section, SectionHeader } from "../_components/Section";
import { Reveal } from "../_components/motion/Reveal";
import {
  type FeaturedCourse,
  type CourseLevel,
  type PaginatedCoursesResponse,
} from "../_components/_lib/courses";
import { getPagedCourses } from "../_components/_actions/coursesActions";

const LEVELS = [
  { value: "ALL", label: "./all_courses" },
  { value: "BEGINNER", label: "./beginner" },
  { value: "INTERMEDIATE", label: "./intermediate" },
  { value: "ADVANCED", label: "./advanced" },
];

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Extract query variables from URL
  const levelParam = searchParams.get("level") || "ALL";
  const searchParam = searchParams.get("search") || "";
  const pageParam = Number(searchParams.get("page")) || 1;

  // Local state for immediate input feedback. Initial value is taken from the URL on mount.
  const [searchInput, setSearchInput] = useState(() => searchParam);
  // Main data states
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Debounced search logic updating routing params
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateQueryParams({ search: searchInput, page: "1" });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, searchParam]);

  // Fetch data from database when parameters change
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const queryLevel =
      levelParam !== "ALL" ? (levelParam as CourseLevel) : undefined;

    getPagedCourses({
      search: searchParam,
      level: queryLevel,
      page: pageParam,
      pageSize: 8,
    })
      .then((res: PaginatedCoursesResponse) => {
        if (!active) return;
        setCourses(res.data);
        setTotalPages(res.meta.pagination.pageCount || 1);
        setTotalItems(res.meta.pagination.total || 0);
      })
      .catch((err: unknown) => {
        console.error("CoursesPage fetch failed", err);
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [levelParam, searchParam, pageParam]);

  // Helper to construct query string updates
  function updateQueryParams(updatedParams: Record<string, string | null>) {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(updatedParams).forEach(([key, value]) => {
      if (
        value === null ||
        value === "" ||
        (key === "level" && value === "ALL")
      ) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    // Reset page if filtering changes and page isn't explicitly set
    if (
      !updatedParams.hasOwnProperty("page") &&
      (updatedParams.hasOwnProperty("level") ||
        updatedParams.hasOwnProperty("search"))
    ) {
      current.set("page", "1");
    }

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";

    startTransition(() => {
      router.push(`/courses${query}`, { scroll: false });
    });
  }

  const handleLevelChange = (lvl: string) => {
    updateQueryParams({ level: lvl, page: "1" });
  };

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      updateQueryParams({ page: String(p) });
    }
  };

  return (
    <main className="flex flex-1 flex-col pb-16">
      <Section>
        <Reveal>
          <SectionHeader
            eyebrow="// courses_list"
            title="সব কোর্সসমূহ"
            description="লেভেল বেছে নাও, এনরোল করো আর প্রতিদিন একটু করে স্টেপ অ্যাপ প্র্যাকটিস চালাও।"
          />
        </Reveal>

        {/* Search & Filter bar widget */}
        <div className="mt-8 flex flex-col gap-4 border border-border/30 rounded-2xl p-5 bg-card/10 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          {/* Level selection buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {LEVELS.map((lvl) => (
              <button
                key={lvl.value}
                onClick={() => handleLevelChange(lvl.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-300 border ${
                  levelParam === lvl.value
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "border-border/30 text-muted-foreground hover:text-foreground hover:bg-card/30"
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>

          {/* Search box input */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
            <Input
              type="text"
              placeholder="সার্চ করো..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-9 w-full bg-card/25 border-border/40 placeholder:text-muted-foreground/50 rounded-lg text-sm"
            />
            {(isLoading || isPending) && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-primary/80" />
            )}
          </div>
        </div>

        {/* Display results */}
        {isLoading ? (
          <div className="mt-16 flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
            <span className="font-mono text-xs text-muted-foreground">
              fetching_courses...
            </span>
          </div>
        ) : courses.length === 0 ? (
          <div className="mt-16 py-24 flex flex-col items-center gap-4 text-center border border-dashed border-border/20 rounded-2xl bg-card/5 backdrop-blur-sm">
            <Terminal className="h-10 w-10 text-muted-foreground/30 font-light" />
            <p className="text-sm font-mono text-muted-foreground">
              no courses found matching search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course, index) => (
                <Reveal
                  key={course.key}
                  delay={Math.min(index * 0.05, 0.2)}
                  className="h-full"
                >
                  <CourseCard course={course} />
                </Reveal>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col items-center gap-4 border-t border-border/20 pt-8 sm:flex-row sm:justify-between font-mono text-xs text-muted-foreground">
                <span>
                  showing page {pageParam} of {totalPages} (total {totalItems}{" "}
                  courses)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pageParam - 1)}
                    disabled={pageParam === 1}
                    className="p-2 rounded-lg border border-border/30 disabled:opacity-40 hover:bg-card/40 transition disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`h-8 w-8 rounded-lg border transition ${
                          pageParam === p
                            ? "bg-primary border-primary text-primary-foreground font-bold"
                            : "border-border/30 hover:bg-card/40"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    onClick={() => handlePageChange(pageParam + 1)}
                    disabled={pageParam === totalPages}
                    className="p-2 rounded-lg border border-border/30 disabled:opacity-40 hover:bg-card/40 transition disabled:hover:bg-transparent"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Section>
    </main>
  );
}
