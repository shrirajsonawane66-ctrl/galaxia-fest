"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function NebulaBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#06123a]"
    >
      <motion.div
        className="absolute inset-[-4%]"
        animate={
          reduceMotion
            ? undefined
            : {
                scale: [1, 1.05, 1],
                x: [0, 14, 0],
                y: [0, -10, 0],
              }
        }
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/bg-nebula.svg"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      {/* Readability overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/15" />

      {/* Fine film grain */}
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}

export default NebulaBackground;
