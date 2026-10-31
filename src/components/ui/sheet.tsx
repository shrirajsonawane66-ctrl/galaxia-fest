"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Side sheet built on Radix Dialog, so the focus trap, Escape handling and the
 * body scroll lock come from the primitive instead of hand-written listeners.
 */
const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title: string }
>(({ className, children, title, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="sheet-overlay fixed inset-0 z-50 bg-[#050816]/70" />
    <DialogPrimitive.Content
      ref={ref}
      // No description: the panel is a plain navigation list.
      aria-describedby={undefined}
      className={cn(
        "sheet-panel fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-[88vw] max-w-sm flex-col overflow-hidden border-l border-white/10 bg-[#06123A]/95 shadow-2xl shadow-black/40 focus:outline-none",
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pt-[env(safe-area-inset-top)]">
        {children}
      </div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = DialogPrimitive.Content.displayName;

/** 44×44 close affordance for the sheet header. */
const SheetCloseButton = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Close
    ref={ref}
    className={cn(
      "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 text-[#F4EDE0] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F4EDE0]",
      className,
    )}
    {...props}
  >
    <X className="h-5 w-5" aria-hidden />
    <span className="sr-only">Close menu</span>
  </DialogPrimitive.Close>
));
SheetCloseButton.displayName = DialogPrimitive.Close.displayName;

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetCloseButton };
