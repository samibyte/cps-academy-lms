import { cn } from "@/lib/utils";
import Image from "next/image";

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={"/logo.avif"}
        width={32}
        height={32}
        alt="cps academy logo"
        className="rounded-sm"
      />
      <span className="text-xl font-bold">CPS Academy</span>
    </div>
  );
};

export default Logo;
