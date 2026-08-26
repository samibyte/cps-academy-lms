import Navbar from "@/components/shared/Navbar";

export default function MainLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
