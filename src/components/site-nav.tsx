"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, LogOut, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, signOut, type GalaxiaUser } from "@/lib/userAuth";
import AuthModal from "@/components/AuthModal";

const links = [
  { href: "/events", label: "Events" },
  { href: "/#about", label: "About" },
  { href: "/#stats", label: "Stats" },
  { href: "/#artists", label: "Performers" },
  { href: "/#passes", label: "Passes" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteNav({ onGetPasses }: { onGetPasses?: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin");
  const [user, setUser] = React.useState<GalaxiaUser | null>(null);
  const headerRef = React.useRef<HTMLElement>(null);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setUser(getUser());
    const onChange = () => setUser(getUser());
    window.addEventListener("galaxia-auth-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("galaxia-auth-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  /* Close the mobile menu on Escape or a click outside the header. */
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      menuButtonRef.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (pathname !== "/" || !href.startsWith("/#")) return;
    const target = document.getElementById(href.slice(2));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", href);
  };

  const cta = onGetPasses ? (
    <button
      type="button"
      onClick={onGetPasses}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-fest-red px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(229,18,31,.5)] transition hover:bg-red-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
    >
      Get Passes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </button>
  ) : (
    <Link
      href="/#passes"
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-fest-red px-4 py-2 text-xs font-semibold text-white shadow-[0_0_20px_rgba(229,18,31,.5)] transition hover:bg-red-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
    >
      Get Passes <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );

  return (
    <>
      <header
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-white/10 bg-[#06123a]/85 py-2 shadow-[0_10px_30px_rgba(3,7,24,0.28)] backdrop-blur-xl"
            : "bg-[#06123a]/55 py-3 backdrop-blur-md md:py-4"
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex max-w-7xl items-center gap-3 px-5 md:px-8"
        >
          {/* Left region — logo */}
          <div className="flex min-w-0 flex-1 items-center justify-start">
            <Link href="/" aria-label="Galaxia i-Fest home" className="shrink-0">
              <Image
                src="/images/galaxia-logo.png"
                alt="Galaxia i-Fest"
                width={1200}
                height={851}
                priority
                sizes="(min-width: 768px) 68px, 56px"
                className="h-10 w-auto md:h-12"
              />
            </Link>
          </div>

          {/* Center region — section links, exactly centered by the equal flex sides */}
          <div className="hidden shrink-0 items-center gap-4 xl:flex xl:gap-7">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleSectionClick(event, link.href)}
                aria-current={link.href === "/events" && pathname === "/events" ? "page" : undefined}
                className={cn(
                  "text-[12.5px] font-medium tracking-wide text-cream/75 transition hover:text-cream",
                  link.href === "/events" && pathname === "/events" && "text-cream"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right region — admin, auth, CTA, mobile trigger */}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/admin"
                prefetch={false}
                className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-cream/40 transition hover:text-cream xl:inline"
              >
                Admin
              </Link>
              {user ? (
                <>
                  <span className="hidden max-w-[100px] items-center gap-1 truncate text-xs text-cream/60 xl:inline-flex">
                    <User2 className="h-3.5 w-3.5" aria-hidden />
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setUser(null);
                    }}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-white/20 px-3 py-2 text-xs text-cream/80 transition hover:bg-white/10"
                  >
                    <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthOpen(true);
                    }}
                    className="whitespace-nowrap rounded-full border border-cream/40 px-4 py-2 text-xs font-medium text-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthOpen(true);
                    }}
                    className="whitespace-nowrap rounded-full bg-fest-red px-4 py-2 text-xs font-semibold text-white shadow-[0_0_18px_rgba(229,18,31,.35)] transition hover:bg-red-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70"
                  >
                    Sign Up
                  </button>
                </>
              )}
              {cta}
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 text-cream transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cream/70 xl:hidden"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        <nav
          id="mobile-nav"
          aria-label="Mobile navigation"
          aria-hidden={!open}
          className={cn(
            "mx-4 mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#06123a]/95 backdrop-blur-xl transition-all duration-300 xl:hidden",
            open ? "visible max-h-[560px] opacity-100" : "invisible max-h-0 border-transparent opacity-0"
          )}
        >
          <div className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleSectionClick(event, link.href)}
                aria-current={link.href === "/events" && pathname === "/events" ? "page" : undefined}
                className="rounded-xl px-3 py-2.5 text-sm text-cream/80 transition hover:bg-white/10 hover:text-cream"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-white/10 pt-3">
              <Link href="/admin" prefetch={false} className="rounded-xl px-3 py-2 text-xs uppercase tracking-[0.2em] text-cream/45">
                Admin
              </Link>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthOpen(true);
                    setOpen(false);
                  }}
                  className="flex-1 rounded-full border border-cream/40 px-4 py-2 text-xs text-cream"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthOpen(true);
                    setOpen(false);
                  }}
                  className="flex-1 rounded-full bg-fest-red px-4 py-2 text-xs font-semibold text-white"
                >
                  Sign Up
                </button>
              </div>
              <div onClick={() => setOpen(false)}>{cta}</div>
            </div>
          </div>
        </nav>
      </header>

      <AuthModal
        key={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initial={authMode}
        onSuccess={() => setUser(getUser())}
      />
    </>
  );
}

export default SiteNav;
