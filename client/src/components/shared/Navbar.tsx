import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Logo from "@/components/shared/ui/logo";
import LogoutButton from "@/components/shared/LogoutButton";
import { MenuIcon, LayoutDashboardIcon } from "lucide-react";
import Link from "next/link";
import { cookies } from "next/headers";
import { deleteCookie } from "@/lib/cookieUtils";

type NavigationItem = {
  title: string;
  href: string;
};

const navigationData: NavigationItem[] = [{ title: "Home", href: "/home" }];

async function logoutAction() {
  "use server";
  await deleteCookie("accessToken");
  await deleteCookie("refreshToken");
  await deleteCookie("userRole");
}

const Navbar = async () => {
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("accessToken")?.value;

  return (
    <header className="bg-background sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between  px-4 py-7 sm:px-6">
        <div className="w-35"></div>
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

        <div className="flex items-center gap-3">
          {/* Auth buttons — desktop */}
          {isLoggedIn ? (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                nativeButton={false}
                render={
                  <Link href="/dashboard">
                    <LayoutDashboardIcon className="h-4 w-4" />
                    ড্যাশবোর্ড
                  </Link>
                }
              />
              <LogoutButton action={logoutAction} />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button
                nativeButton={false}
                variant="ghost"
                size="sm"
                render={<Link href="/auth/login">লগইন</Link>}
              />
              <Button
                nativeButton={false}
                size="sm"
                render={<Link href="/auth/register">সাইন আপ</Link>}
              />
            </div>
          )}

          {/* Mobile menu */}
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
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                {isLoggedIn ? (
                  <>
                    <DropdownMenuItem>
                      <a
                        href="/dashboard"
                        className="flex w-full items-center gap-2"
                      >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        ড্যাশবোর্ড
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="p-0">
                      <LogoutButton action={logoutAction} />
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem>
                      <a href="/auth/login" className="w-full">
                        লগইন
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <a href="/auth/register" className="w-full">
                        সাইন আপ
                      </a>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
