"use client";

import { LogOut, Plus, ShieldCheck } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { SITE } from "@/data/site";
import { useCatalog } from "@/lib/catalog/provider";

export function AnnouncementBar() {
  const { admin } = useCatalog();
  return admin ? <AdminStrip email={admin.email} /> : <Announcements />;
}

/** En mode admin, sur toutes les pages : rappel du mode et raccourcis. */
function AdminStrip({ email }: { email: string }) {
  const { setFormOpen, signOut } = useCatalog();
  const btn = "flex h-7 items-center gap-1.5 rounded-sm px-2 uppercase hover:bg-black/10";
  return (
    <div className="bg-acc text-on-acc">
      <div className="mx-auto flex h-9 max-w-[1360px] items-center justify-between gap-2 px-3 font-mono text-[11px] uppercase tracking-[0.1em] md:px-8">
        <span className="truncate">
          <strong>Mode admin</strong>
          <span className="hidden md:inline"> · {email}</span>
        </span>
        <span className="flex shrink-0 items-center">
          <button type="button" onClick={() => setFormOpen(true)} className={btn}>
            <Plus className="size-3.5" /> Ajouter
          </button>
          <Link href="/admin" className={btn}>
            <ShieldCheck className="size-3.5" /> Gérer
          </Link>
          <button type="button" onClick={signOut} className={btn}>
            <LogOut className="size-3.5" /> Quitter
          </button>
        </span>
      </div>
    </div>
  );
}

function Announcements() {
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
