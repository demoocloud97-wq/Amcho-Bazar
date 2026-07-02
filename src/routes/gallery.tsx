import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { GALLERY } from "@/lib/dummy-data";
import { PageHeader } from "./categories";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery · Amcho Bazar Season 1" },
      { name: "description", content: "Relive Season 1 of Amcho Bazar — a photo journey through the Nawait Community's women-only festival." },
      { property: "og:title", content: "Gallery · Amcho Bazar" },
      { property: "og:description", content: "A masonry photo journey through Season 1." },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [active, setActive] = useState<null | number>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Gallery"
        title={<>Season 1, one <span className="text-festive">warm memory</span> at a time.</>}
        subtitle="Every laugh, every stall, every hug — captured. Click any frame to open the lightbox."
      />

      <section className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
          {GALLERY.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.04 }}
              onClick={() => setActive(i)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl shadow-card"
            >
              <div className="relative">
                <img src={p.src} alt={p.caption} className="w-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {p.caption}
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
            onClick={() => setActive(null)}
          >
            <button className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white backdrop-blur hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
            <motion.img
              key={active}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={GALLERY[active].src}
              alt={GALLERY[active].caption}
              className="max-h-[85vh] max-w-[90vw] rounded-3xl object-contain shadow-glow"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute inset-x-0 bottom-6 text-center text-sm font-medium text-white">
              {GALLERY[active].caption}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}