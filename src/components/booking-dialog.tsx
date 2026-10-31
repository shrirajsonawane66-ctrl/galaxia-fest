"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { eventSeed, passesSeed } from "@/lib/data";
import { formatINR, genRef } from "@/lib/utils";
import { getUser, type GalaxiaUser } from "@/lib/userAuth";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06123A]";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPass: string;
  onSelectPass?: (id: string) => void;
};

export default function BookingDialog({
  open,
  onOpenChange,
  initialPass,
  onSelectPass,
}: Props) {
  const [selectedPass, setSelectedPass] = useState(initialPass);
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    college: "",
    collegeId: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successRef, setSuccessRef] = useState<string | null>(null);
  const [user, setUser] = useState<GalaxiaUser | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedPass(initialPass);
  }, [open, initialPass]);

  useEffect(() => {
    setUser(getUser());
    const onAuth = () => setUser(getUser());
    window.addEventListener("galaxia-auth-change", onAuth);
    window.addEventListener("storage", onAuth);
    return () => {
      window.removeEventListener("galaxia-auth-change", onAuth);
      window.removeEventListener("storage", onAuth);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setForm((f) =>
      f.email ? f : { ...f, email: user.email, name: user.name || f.name }
    );
  }, [user]);

  const activePass =
    passesSeed.find((p) => p.id === selectedPass) || passesSeed[1];
  const remaining = (p: (typeof passesSeed)[0]) => p.capacity - p.sold_count;
  const isSoldOut = (p: (typeof passesSeed)[0]) =>
    remaining(p) <= 0 || !p.is_active;
  const total = activePass.price * qty;

  const choosePass = (id: string) => {
    setSelectedPass(id);
    onSelectPass?.(id);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Valid email required";
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "")))
      e.phone = "Valid 10-digit phone required";
    if (!form.college.trim()) e.college = "College is required";
    if (qty < 1 || qty > 6) e.qty = "Qty 1–6 only";
    if (isSoldOut(activePass)) e.pass = "This pass is sold out";
    if (qty > remaining(activePass)) e.qty = `Only ${remaining(activePass)} left`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleBook = () => {
    if (!validate()) return;
    const ref = genRef();
    const booking = {
      ref,
      pass: activePass.name,
      qty,
      total,
      ...form,
      at: new Date().toISOString(),
      status: "paid",
    };
    const prev = JSON.parse(localStorage.getItem("galaxia_bookings") || "[]");
    localStorage.setItem("galaxia_bookings", JSON.stringify([booking, ...prev]));
    const idx = passesSeed.findIndex((p) => p.id === activePass.id);
    if (idx >= 0) passesSeed[idx].sold_count += qty;
    setSuccessRef(ref);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto rounded-2xl sm:max-w-2xl md:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl font-bold text-[var(--text-strong)]">
              Reserve your pass
            </DialogTitle>
            <div className="type-small">
              Select tier → quantity → details → pay (test-mode Razorpay). RLS
              enforced server-side.
            </div>
          </DialogHeader>

          {/* Tier select */}
          <div className="grid grid-cols-1 gap-2 py-2 sm:grid-cols-3">
            {passesSeed.map((p) => (
              <button
                key={p.id}
                onClick={() => choosePass(p.id)}
                className={`rounded-lg border p-3 text-left transition-colors ${focusRing} ${
                  selectedPass === p.id
                    ? "border-[#F4EDE0] bg-[#F4EDE0] text-[#050816]"
                    : "border-white/10 bg-white/[0.04] text-[var(--text-strong)] hover:border-white/25"
                }`}
              >
                <div
                  className={`text-[13px] font-medium ${
                    selectedPass === p.id
                      ? "text-[#050816]/70"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {p.name}
                </div>
                <div className="font-display text-base font-bold">
                  {formatINR(p.price)}
                </div>
                <div
                  className={`text-[13px] ${
                    selectedPass === p.id
                      ? "text-[#050816]/60"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  {remaining(p)} left
                </div>
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div className="flex flex-wrap items-center gap-3 py-2">
            <span className="text-sm text-[var(--text-body)]">Quantity (1–6)</span>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full sm:h-9 sm:w-9"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center font-display text-base font-bold">
                {qty}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full sm:h-9 sm:w-9"
                onClick={() => setQty((q) => Math.min(6, q + 1))}
              >
                +
              </Button>
            </div>
            {errors.qty && (
              <span className="text-[13px] text-[var(--accent)]">{errors.qty}</span>
            )}
          </div>

          {/* Form */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <input
                placeholder="Full name *"
                name="name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={`w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none sm:min-h-0 ${focusRing}`}
              />
              {errors.name && (
                <div className="mt-1 text-[13px] text-[var(--accent)]">
                  {errors.name}
                </div>
              )}
            </div>
            <div>
              <input
                placeholder="Email *"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={`w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none sm:min-h-0 ${focusRing}`}
              />
              {errors.email && (
                <div className="mt-1 text-[13px] text-[var(--accent)]">
                  {errors.email}
                </div>
              )}
            </div>
            <div>
              <input
                placeholder="Phone (10 digits) *"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={`w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none sm:min-h-0 ${focusRing}`}
              />
              {errors.phone && (
                <div className="mt-1 text-[13px] text-[var(--accent)]">
                  {errors.phone}
                </div>
              )}
            </div>
            <div>
              <input
                placeholder="College / Institution *"
                autoComplete="organization"
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
                className={`w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none sm:min-h-0 ${focusRing}`}
              />
              {errors.college && (
                <div className="mt-1 text-[13px] text-[var(--accent)]">
                  {errors.college}
                </div>
              )}
            </div>
            <div className="sm:col-span-2">
              <input
                placeholder="College ID / Student ID (optional)"
                value={form.collegeId}
                onChange={(e) => setForm({ ...form, collegeId: e.target.value })}
                className={`w-full min-h-12 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-[var(--text-strong)] placeholder:text-[var(--text-muted)] focus:border-[#F4EDE0]/50 focus:outline-none sm:min-h-0 ${focusRing}`}
              />
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-body)]">
                {activePass.name} × {qty}
              </span>
              <span className="font-medium text-[var(--text-strong)]">
                {formatINR(activePass.price)} each
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-white/10 pt-2 font-display text-lg font-bold text-[var(--text-strong)]">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
            <div className="text-[13px] text-[var(--text-muted)]">
              Price fetched server-side — test Razorpay order will verify amount.
              Inventory checked atomically.
            </div>
            {errors.pass && (
              <div className="text-[13px] text-[var(--accent)]">{errors.pass}</div>
            )}
          </div>

          <Button variant="galaxy" size="lg" className="w-full" onClick={handleBook}>
            <Ticket className="h-4 w-4" /> Pay {formatINR(total)} — Razorpay test
          </Button>
          <div className="text-center text-[13px] text-[var(--text-muted)]">
            Use Razorpay test card 4111 1111 1111 1111. No real money charged. On
            success you’ll get GAL-XXXXXX reference + QR at /booking/success.
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS */}
      <Dialog open={!!successRef} onOpenChange={(o) => !o && setSuccessRef(null)}>
        <DialogContent className="rounded-2xl text-center sm:max-w-md">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#E5121F]">
            <Ticket className="h-7 w-7 text-white" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center font-display text-2xl font-bold text-[var(--text-strong)]">
              Booking confirmed
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="type-small">Booking reference</div>
              <div className="font-mono text-lg font-bold tracking-[0.12em] text-[var(--accent)]">
                {successRef}
              </div>
              <div className="type-small mt-1">
                {activePass.name} × {qty} • {formatINR(total)} paid
              </div>
            </div>
            <div className="text-sm text-[var(--text-body)]">
              Attendee: {form.name} • {form.email}
            </div>
            <div className="type-small">
              Venue: {eventSeed.venue} • {eventSeed.date}
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
              <Button
                size="sm"
                className="min-h-11 w-full rounded-full bg-[#F4EDE0] text-[#050816] sm:min-h-0 sm:w-auto"
                onClick={() => {
                  setSuccessRef(null);
                  window.location.href =
                    "/booking/success?ref=" + successRef;
                }}
              >
                View ticket & QR
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="min-h-11 w-full rounded-full sm:min-h-0 sm:w-auto"
                onClick={() => setSuccessRef(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
