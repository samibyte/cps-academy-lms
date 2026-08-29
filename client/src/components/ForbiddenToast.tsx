"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

function ForbiddenToastInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const hasShown = useRef(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "forbidden" && !hasShown.current) {
      hasShown.current = true;
      toast.error("Access Denied: You do not have permission to view that resource.", {
        duration: 5000,
      });

      // Silently remove the error parameter from the URL address bar
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const cleanSearch = params.toString();
      const newUrl = pathname + (cleanSearch ? `?${cleanSearch}` : "");
      router.replace(newUrl);
    }
  }, [searchParams, router, pathname]);

  return null;
}

import { Suspense } from "react";

export default function ForbiddenToast() {
  return (
    <Suspense fallback={null}>
      <ForbiddenToastInner />
    </Suspense>
  );
}
