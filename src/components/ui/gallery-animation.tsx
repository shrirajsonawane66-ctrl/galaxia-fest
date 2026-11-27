'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface HighlightItem {
  id: string;
  image_url: string;
  artist_name: string;
  edition_year?: number | null;
  caption?: string | null;
}

interface ExpandableGalleryProps {
  items: HighlightItem[];
  className?: string;
  maxInStrip?: number;
}

export function ExpandableGallery({ items, className = '', maxInStrip = 6 }: ExpandableGalleryProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const strip = items.slice(0, maxInStrip);
  const total = items.length;

  const close = useCallback(() => setSelectedIndex(null), []);
  const next = useCallback(
    () => setSelectedIndex((i) => (i === null ? i : (i + 1) % total)),
    [total]
  );
  const prev = useCallback(
    () => setSelectedIndex((i) => (i === null ? i : (i - 1 + total) % total)),
    [total]
  );

  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedIndex, close, next, prev]);

  const dur = reduceMotion ? 0.15 : 0.5;

  const grow = (index: number) =>
    hoveredIndex === null ? 1 : hoveredIndex === index ? 3 : 0.6;

  const caption = (item: HighlightItem) => (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
      <p className="font-semibold text-[#f6ece4] leading-tight truncate">{item.artist_name}</p>
      {(item.edition_year || item.caption) && (
        <p className="text-xs text-white/70 truncate">
          {[item.edition_year, item.caption].filter(Boolean).join(' · ')}
        </p>
      )}
    </div>
  );

  if (total === 0) return null;

  return (
    <div className={className}>
      <div className="hidden md:flex gap-2 h-[28rem] w-full">
        {strip.map((item, index) => (
          <motion.div
            key={item.id}
            tabIndex={0}
            role="button"
            aria-label={`Open ${item.artist_name}`}
            className="relative min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-white/10 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            style={{ flexBasis: 0 }}
            initial={{ flexGrow: 1, opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            animate={{ flexGrow: grow(index) }}
            transition={{ duration: dur, ease: 'easeInOut', delay: 0 }}
            whileHover={{ boxShadow: '0 0 40px rgba(110,99,184,0.35)' }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => setSelectedIndex(index)}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedIndex(index)}
          >
            <img
              src={item.image_url}
              alt={item.artist_name}
              loading="lazy"
              draggable={false}
              className="h-full w-full object-cover"
            />
            <motion.div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1240]/90 via-[#0b1240]/20 to-transparent"
              animate={{ opacity: hoveredIndex === index ? 1 : 0.55 }}
              transition={{ duration: 0.3 }}
            />
            {caption(item)}
          </motion.div>
        ))}
      </div>

      <div className="md:hidden -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">
        {strip.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Open ${item.artist_name}`}
            onClick={() => setSelectedIndex(index)}
            className="relative h-80 w-[75vw] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10"
          >
            <img src={item.image_url} alt={item.artist_name} loading="lazy" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0b1240]/90 via-transparent to-transparent" />
            {caption(item)}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && items[selectedIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1240]/90 p-4 backdrop-blur-xl"
            onClick={close}
            role="dialog"
            aria-modal="true"
          >
            <button
              aria-label="Close"
              onClick={close}
              className="absolute right-4 top-4 z-10 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {total > 1 && (
              <button
                aria-label="Previous image"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 z-10 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <AnimatePresence mode="wait">
                <motion.img
                  key={items[selectedIndex].id}
                  src={items[selectedIndex].image_url}
                  alt={items[selectedIndex].artist_name}
                  className="max-h-[80vh] w-full rounded-2xl object-contain"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              <p className="mt-3 font-semibold text-[#f6ece4]">
                {items[selectedIndex].artist_name}
                {items[selectedIndex].edition_year ? ` · ${items[selectedIndex].edition_year}` : ''}
              </p>
            </div>

            {total > 1 && (
              <button
                aria-label="Next image"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 z-10 rounded-full border border-white/15 bg-white/10 p-2 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur">
              {selectedIndex + 1} / {total}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}