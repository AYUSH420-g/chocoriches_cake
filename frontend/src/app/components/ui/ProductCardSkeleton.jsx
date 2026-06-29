import React from "react";
import { Skeleton } from "./Skeleton";

export function ProductCardSkeleton({ compact = false }) {
  return (
    <article className="bk-card flex h-full flex-col overflow-hidden">
      <Skeleton
        className={`w-full ${compact ? "aspect-square md:aspect-[1.12/1]" : "aspect-square md:aspect-[1.05/1]"}`}
      />
      <div className="flex flex-1 flex-col p-2.5 md:p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
        <div className="mt-auto pt-3">
          <Skeleton className="h-6 w-1/3 mb-1" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </article>
  );
}
