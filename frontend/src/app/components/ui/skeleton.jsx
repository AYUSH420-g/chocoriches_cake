import { cn } from "./utils";
function Skeleton({ className, ...props }) {
  return <div
    className={cn("bg-[#ebebeb] animate-pulse rounded-md", className)}
    {...props}
  />;
}
export {
  Skeleton
};
