import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Logo from "@/components/shared/ui/logo";
import { SearchIcon, MenuIcon } from "lucide-react";
import Link from "next/link";

type NavigationItem = {
  title: string;
  href: string;
};

const navigationData: NavigationItem[] = [{ title: "Home", href: "/home" }];

const Navbar = () => {
  return (
    <header className="bg-background sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-7 sm:px-6">
        <div className="text-muted-foreground flex flex-1 items-center gap-8 font-medium md:justify-center lg:gap-16">
          <Link href={"/"} className="hover:text-primary max-md:hidden">
            হোম
          </Link>
          <Link href={"/courses"} className="hover:text-primary max-md:hidden">
            সকল কোর্স
          </Link>
          <Link href={"/"}>
            <Logo className="text-foreground gap-3" />
          </Link>
          <Link href={"/about"} className="hover:text-primary max-md:hidden">
            আমাদের সম্পর্কে
          </Link>
          <Link href={"/blog"} className="hover:text-primary max-md:hidden">
            ব্লগ
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon">
            <SearchIcon />
            <span className="sr-only">Search</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="md:hidden"
              render={<Button variant="outline" size="icon" />}
            >
              <MenuIcon />
              <span className="sr-only">Menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuGroup>
                {navigationData.map((item, index) => (
                  <DropdownMenuItem key={index}>
                    <a href={item.href}>{item.title}</a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
