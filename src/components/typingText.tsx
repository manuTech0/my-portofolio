import { useEffect } from "react"
import { motion, type Variants, useAnimation } from "framer-motion"

interface TypingProps {
  text: string
  duration?: number
  inView: boolean
  reverse?: boolean
}

export default function TypingText({
  text,
  duration = 0.05,
  inView = true,
  reverse = false,
}: TypingProps) {
  const letters = text.split("").map((c) => (c === " " ? "\u00A0" : c))
  const controls = useAnimation()

  const letterVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: reverse
          ? duration * (letters.length - i - 1)
          : duration * i,
      },
    }),
  }

  useEffect(() => {
    controls.start(inView ? "visible" : "hidden")
  }, [inView, controls])

  return (
    <motion.span
      initial="hidden"
      animate={controls}
      className="inline-block overflow-hidden"
    >
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          variants={letterVariants}
          custom={i}
          initial="hidden"
          animate={controls}
          className="inline-block"
        >
          {letter}
        </motion.span>
      ))}
    </motion.span>
  )
}
