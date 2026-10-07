import { BrandWatermarks } from "@/components/brand/brand-watermarks";
import { GRADES } from "@/data/site";

export function ConditionGuide() {
  return (
    <section id="etats" className="relative scroll-mt-20 border-y border-line bg-surface">
      <BrandWatermarks
        marks={[{ mark: "gucci", className: "-left-[8vw] top-[18px] w-[118vw] opacity-[0.045] md:-left-[3vw] md:bottom-[5%] md:top-auto md:w-[64vw]" }]}
      />
      <div className="relative mx-auto grid max-w-[1360px] gap-12 px-4 py-20 md:px-8 md:py-28 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
        <div>
          <p className="label text-acc-ink">Neuf ou occasion</p>
          <h2 className="mt-3 font-display text-4xl font-medium uppercase leading-[0.95] tracking-tight md:text-6xl">
            Chaque pièce a sa note.
          </h2>
          <p className="mt-6 max-w-[46ch] leading-relaxed text-muted">
            Les pièces d&apos;occasion sont nettoyées, inspectées et notées sur 10. La note est affichée sur
            chaque fiche, avant l&apos;achat.
          </p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-md border border-line bg-line">
          {GRADES.map((g) => (
            <li key={g.grade} className="grid grid-cols-[88px_1fr] items-center gap-4 bg-ground p-5 md:grid-cols-[120px_1fr_140px] md:p-6">
              <span className={`font-display text-3xl font-medium uppercase md:text-4xl ${g.score === 10 ? "text-acc-ink" : ""}`}>
                {g.grade}
              </span>
              <p className="text-sm leading-relaxed text-muted md:text-[15px]">{g.text}</p>
              <div className="col-span-2 flex gap-1 md:col-span-1" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} className={`h-1.5 flex-1 rounded-full ${i < g.score ? "bg-acc" : "bg-raised"}`} />
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
