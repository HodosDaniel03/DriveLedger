"use client"

import { useLayoutEffect, useRef, type ReactNode } from "react"
import { animate, motion, useReducedMotion, type HTMLMotionProps } from "motion/react"

export const EASE_OUT = [0.22, 1, 0.36, 1] as const

interface AnimatedNumberProps {
  value: number
  format: (n: number) => string
  className?: string
  duration?: number
}

export function AnimatedNumber({ value, format, className, duration = 0.8 }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const shown = useRef(value)
  const formatRef = useRef(format)
  formatRef.current = format
  const reduce = useReducedMotion()

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduce || shown.current === value) {
      shown.current = value
      node.textContent = formatRef.current(value)
      return
    }
    node.textContent = formatRef.current(shown.current)
    const controls = animate(shown.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        shown.current = v
        node.textContent = formatRef.current(v)
      },
    })
    return () => controls.stop()
  }, [value, duration, reduce])

  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  )
}

export function Reveal({
  children,
  delay = 0,
  y = 16,
  ...props
}: { children: ReactNode; delay?: number; y?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function InViewReveal({
  children,
  delay = 0,
  ...props
}: { children: ReactNode; delay?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
