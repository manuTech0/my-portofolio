import { useEffect } from "react"
import { motion, type Variants, useAnimation } from "framer-motion"

interface TypingProps {
  text: string
  duration?: number
  inView: boolean
}

export default function TypingText({ text, duration = 0.05, inView = true }: TypingProps) {
  const letters = text.split("").map(c => (c === " " ? "\u00A0" : c))
  const controls = useAnimation()

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: duration } }
  }
  const letterVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  }

  useEffect(() => {
    controls.start(inView ? "visible" : "hidden")
  }, [inView, controls])

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate={controls}
      className="inline-block overflow-hidden"
    >
      {letters.map((letter, i) => (
        <motion.span key={i} variants={letterVariants} className="inline-block">
          {letter}
        </motion.span>
      ))}
    </motion.span>
  )
}
