"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, LogOut, User2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, signOut, type GalaxiaUser } from "@/lib/userAuth";
import dynamic from "next/dynamic";

// Loaded on first use: the auth form (and its Radix dialog) is not part of the
// initial homepage payload.
const AuthModal = dynamic(() => import("@/components/AuthModal"), {
  ssr: false,
});

const links = [
  { href: "/events", label: "Events" },
  { href: "/#about", label: "About" },
  { href: "/#stats", label: "Stats" },
  { href: "/#performers", label: "Performers" },
  { href: "/#passes", label: "Passes" },
  { href: "/#faq", label: "FAQ" },
];

const actionClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-5 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]";

export function SiteNav({ onGetPasses }: { onGetPasses?: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [hash, setHash] = React.useState("");
  const [authOpen, setAuthOpen] = React.useState(false);
  const [authMounted, setAuthMounted] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<"signin" | "signup">("signin");
  const [user, setUser] = React.useState<GalaxiaUser | null>(null);

  const openAuth = React.useCallback((mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthMounted(true);
    setAuthOpen(true);
  }, []);

  const closeMenu = React.useCallback(() => setOpen(false), []);

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
    const syncHash = () => setHash(window.location.hash.replace("#", ""));
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled((prev) => {
        const next = window.scrollY > 24;
        return prev === next ? prev : next;
      });
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Close the sheet whenever the route changes (the sheet also closes on tap).
  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // `html { overflow-x: clip }` (the global safety net) stops the body scroll
  // lock from propagating to the viewport, so pin the page while the sheet is
  // open. The previous scroll offset is restored on close.
  React.useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const body = document.body;
    const scrollY = window.scrollY;
    const scrollbar = window.innerWidth - root.clientWidth;
    const previousHtmlOverflow = root.style.overflow;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    };

    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      root.style.overflow = previousHtmlOverflow;
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const handleSectionClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (pathname !== "/" || !href.startsWith("/#")) return;
    const target = document.getElementById(href.slice(2));
    if (!target) return;
    event.preventDefault();
    // Let the menu release the body scroll lock before scrolling.
    window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    window.history.replaceState(null, "", href);
    setHash(href.slice(2));
  };

  const isActive = (href: string) => {
    if (href === "/events") return pathname === "/events";
    if (!href.startsWith("/#")) return pathname === href;
    return pathname === "/" && hash === href.slice(2);
  };

  const getPassesClass = cn(actionClass, "bg-[#E5121F] text-white hover:bg-[#FF1F2D]");

  const renderCta = (extra?: string) =>
    onGetPasses ? (
      <button type="button" onClick={onGetPasses} className={cn(getPassesClass, extra)}>
        Get Passes <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    ) : (
      <Link href="/#passes" onClick={() => setOpen(false)} className={cn(getPassesClass, extra)}>
        Get Passes <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    );

  const cta = renderCta();

  const sheetLinkClass = (href: string) =>
    cn(
      "flex min-h-14 w-full items-center border-b border-white/10 py-2 text-xl font-medium leading-tight text-[var(--text-body)] transition-colors hover:text-[var(--text-strong)]",
      isActive(href) && "text-[var(--text-strong)] underline decoration-[#F4EDE0] decoration-2 underline-offset-4",
    );

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 h-[calc(64px+env(safe-area-inset-top))] overflow-visible pt-[env(safe-area-inset-top)] transition-colors duration-300 md:h-[72px] md:pt-0",
          scrolled
            ? "border-b border-white/10 bg-[#06123A]/80 backdrop-blur-md"
            : "bg-[#06123A]/35 backdrop-blur-sm"
        )}
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-5 sm:px-6 md:h-[72px] md:px-10 xl:gap-4"
        >
          {/* Phones get the wordmark; from md up the bar keeps its original layout. */}
          <Link href="/" aria-label="Galaxia i-Fest home" className="flex h-11 shrink-0 items-center md:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/logo-trim-128.png"
              srcSet="/images/logo-trim-128.png 1x, /images/logo-trim-192.png 2x"
              alt="Galaxia i-Fest"
              width={320}
              height={227}
              fetchPriority="high"
              decoding="async"
              className="h-10 w-auto"
            />
          </Link>

          {/* Tablet — always-visible, swipeable section links (unchanged above md) */}
          <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex xl:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleSectionClick(event, link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap text-xs font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-strong)]",
                  isActive(link.href) &&
                    "text-[var(--text-strong)] underline decoration-[#F4EDE0] decoration-2 underline-offset-4"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop spacer keeps the links centred */}
          <div aria-hidden className="hidden xl:block xl:flex-1" />

          {/* Desktop section links */}
          <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 xl:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleSectionClick(event, link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap text-[15px] font-medium text-[var(--text-body)] transition-colors hover:text-[var(--text-strong)]",
                  isActive(link.href) &&
                    "text-[var(--text-strong)] underline decoration-[#F4EDE0] decoration-2 underline-offset-8"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Phone actions: compact red pill + 44×44 menu trigger */}
          <div className="ml-auto flex shrink-0 items-center gap-2 md:hidden">
            {renderCta("px-4 text-sm")}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls="site-mobile-menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F4EDE0] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Right region — desktop actions + tablet menu trigger */}
          <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex xl:ml-0 xl:flex-1 xl:justify-end">
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/admin"
                prefetch={false}
                className="hidden text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-strong)] xl:inline"
              >
                Admin
              </Link>
              {user ? (
                <>
                  <span className="hidden max-w-[120px] items-center gap-1 truncate text-sm text-[var(--text-muted)] xl:inline-flex">
                    <User2 className="h-4 w-4" aria-hidden />
                    {user.email}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setUser(null);
                    }}
                    className={cn(
                      actionClass,
                      "border border-[#F4EDE0]/40 text-[#F4EDE0] hover:bg-white/10"
                    )}
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      openAuth("signin");
                    }}
                    className={cn(
                      actionClass,
                      "border border-[#F4EDE0]/40 text-[#F4EDE0] hover:bg-white/10"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      openAuth("signup");
                    }}
                    className={cn(actionClass, "bg-[#E5121F] text-white hover:bg-[#FF1F2D]")}
                  >
                    Sign Up
                  </button>
                </>
              )}
              {cta}
            </div>

            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
              aria-haspopup="dialog"
              aria-controls="site-mobile-menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F4EDE0] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A] xl:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </nav>
      </header>

      <MobileMenu open={open} onClose={closeMenu}>
          <div className="flex items-center justify-between px-5 pb-4 pt-5">
            <Link href="/" aria-label="Galaxia i-Fest home" onClick={() => setOpen(false)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-trim-128.png"
                srcSet="/images/logo-trim-128.png 1x, /images/logo-trim-192.png 2x"
                alt="Galaxia i-Fest"
                width={320}
                height={227}
                loading="lazy"
                decoding="async"
                className="h-8 w-auto"
              />
            </Link>
            <button
              type="button"
              onClick={closeMenu}
              data-menu-close
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F4EDE0] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0]"
            >
              <X className="h-5 w-5" aria-hidden />
              <span className="sr-only">Close menu</span>
            </button>
          </div>

          <nav aria-label="Mobile" className="flex flex-col border-t border-white/10 px-5">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleSectionClick(event, link.href)}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={sheetLinkClass(link.href)}
              >
                {link.label}
              </Link>
            ))}
            {/* Matches the old tablet dropdown: admin entry only where the desktop bar shows it. */}
            <Link
              href="/admin"
              prefetch={false}
              onClick={() => setOpen(false)}
              className={cn(sheetLinkClass("/admin"), "hidden md:flex")}
            >
              Admin
            </Link>
          </nav>

          <div className="mt-auto space-y-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-8">
            {user ? (
              <>
                <p className="flex items-center gap-2 truncate text-sm text-[var(--text-muted)]">
                  <User2 className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{user.email}</span>
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    setUser(null);
                    setOpen(false);
                  }}
                  className={cn(
                    actionClass,
                    "h-[52px] w-full justify-center border border-[#F4EDE0]/40 text-[#F4EDE0] hover:bg-white/10"
                  )}
                >
                  <LogOut className="h-4 w-4" aria-hidden /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    openAuth("signin");
                    setOpen(false);
                  }}
                  className={cn(
                    actionClass,
                    "h-[52px] w-full justify-center border border-[#F4EDE0]/40 text-[#F4EDE0] hover:bg-white/10"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openAuth("signup");
                    setOpen(false);
                  }}
                  className={cn(actionClass, "h-[52px] w-full justify-center bg-[#E5121F] text-white hover:bg-[#FF1F2D]")}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </MobileMenu>

      {authMounted && (
        <AuthModal
          key={authMode}
          open={authOpen}
          onOpenChange={setAuthOpen}
          initial={authMode}
          onSuccess={() => setUser(getUser())}
        />
      )}
    </>
  );
}

/**
 * Lightweight slide-in navigation panel.
 *
 * The previous implementation reused the Radix Dialog based `Sheet`, which
 * pulled the whole dialog primitive (~12 kB gzip) into the homepage's initial
 * payload just to render a list of links. This keeps the same markup, the same
 * `sheet-*` animations and the same keyboard behaviour (Escape, focus trap,
 * scroll lock) without the dependency.
 */
function MobileMenu({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const restoreRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!open) return;

    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Scroll locking lives in `SiteNav` (it also preserves the scroll offset),
    // so this effect only manages focus. Locking here as well left
    // `documentElement.style.overflow` stuck on "hidden" after closing.
    panelRef.current
      ?.querySelector<HTMLElement>("[data-menu-close]")
      ?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="sheet-overlay fixed inset-0 z-50 bg-[#050816]/70"
        data-state="open"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id="site-mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        data-state="open"
        className="sheet-panel fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-[88vw] max-w-sm flex-col overflow-hidden border-l border-white/10 bg-[#06123A]/95 shadow-2xl shadow-black/40 focus:outline-none"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)]">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

export default SiteNav;
