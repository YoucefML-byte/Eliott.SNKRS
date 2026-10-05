"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type Side = "right" | "left" | "bottom" | "top";

const OFFSCREEN: Record<Side, { x?: string; y?: string }> = {
  right: { x: "100%" },
  left: { x: "-100%" },
  bottom: { y: "100%" },
  top: { y: "-100%" },
};

const PLACE: Record<Side, string> = {
  right: "inset-y-0 right-0 w-full max-w-[440px] border-l",
  left: "inset-y-0 left-0 w-full max-w-[420px] border-r",
  bottom: "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-xl border-t",
  top: "inset-x-0 top-0 border-b",
};

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  side?: Side;
  label: string;
  className?: string;
  children: ReactNode;
}

/** Slide-in panel with a scrim; Escape and the scrim close it. */
export function Sheet({ open, onClose, side = "right", label, className, children }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panel.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60]">
          <motion.div
            className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            className={cn(
              "absolute flex flex-col border-line bg-surface outline-none",
              PLACE[side],
              className,
            )}
            initial={OFFSCREEN[side]}
            animate={{ x: 0, y: 0 }}
            exit={OFFSCREEN[side]}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
