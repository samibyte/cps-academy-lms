import Link from "next/link";
import Logo from "./ui/logo";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
];

const supportLinks = [
  { label: "Student Dashboard", href: "/dashboard/student" },
  { label: "Instructor Portal", href: "/dashboard/instructor" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Contact", href: "/contact" },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/bd.cpsacademy" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/cps-academy" },
  { label: "YouTube", href: "https://www.youtube.com/@CPSAcademy" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-muted/20 to-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex justify-between gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Logo />
            </div>

            <p className="max-w-sm text-sm leading-6 text-muted-foreground">
              Grow with practical learning, expert guidance, and industry-ready
              courses designed to help students and professionals move forward.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
              Explore
            </h3>
            <ul className="space-y-3 flex gap-3 text-sm text-muted-foreground">
              {navigationLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
              Follow us
            </h3>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} CPS Academy. All rights reserved.</p>
          <p>Learn. Grow. Lead.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
