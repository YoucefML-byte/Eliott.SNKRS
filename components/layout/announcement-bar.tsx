"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { SITE } from "@/data/site";

export function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % SITE.announcements.length), 4000);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="border-b border-line bg-ground">
      {/* desktop: all messages */}
      <ul className="label mx-auto hidden h-9 max-w-[1360px] items-center justify-center gap-10 px-8 text-muted md:flex">
        {SITE.announcements.map((a) => (
          <li key={a} className="flex items-center gap-2">
            <span className="size-1 rounded-full bg-acc" />
            {a}
          </li>
        ))}
      </ul>
      {/* mobile: one at a time */}
      <div className="label relative flex h-9 items-center justify-center overflow-hidden text-muted md:hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={i}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {SITE.announcements[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
