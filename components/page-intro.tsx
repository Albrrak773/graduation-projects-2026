"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

const ease = [0.22, 1, 0.36, 1] as const

const HOLD_MS = 1400
const EXIT_DURATION = 0.75

export function PageIntro() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), HOLD_MS)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(66,133,244,0.35), transparent 50%), linear-gradient(135deg, #0d2b6b 0%, #0b4778 48%, #0097a7 100%)",
          }}
          exit={{ opacity: 0 }}
          transition={{ duration: EXIT_DURATION, ease }}
        >
          <Image
            src="/design/pattern-1-hires.png"
            alt=""
            fill
            aria-hidden
            priority
            className="pointer-events-none object-cover opacity-[0.055] mix-blend-screen"
          />

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <Image
              src="/design/logo white@4x.png"
              alt="مشاريع التخرج"
              width={320}
              height={120}
              priority
              className="w-56 sm:w-72 md:w-80"
            />

            <div className="w-48 overflow-hidden rounded-full bg-white/15 sm:w-64">
              <motion.div
                className="h-0.5 rounded-full bg-white"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: HOLD_MS / 1000, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
