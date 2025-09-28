import { useKeenSlider } from "keen-slider/react"
import "keen-slider/keen-slider.min.css"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useMediaQuery } from "usehooks-ts"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"
import TypingText from "@/components/typingText"

export default function Projects(
	props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
) {
	const [sliderRef, instanceRef] = useKeenSlider({
		loop: true,
		mode: "snap",
		slides: { perView: 1, spacing: 10 },
	})

	const isSm = useMediaQuery("(min-width: 640px)")

	const { observe, inView } = useInView({ threshold: 0.3 })
	const { observe: observeCard1, inView: inViewCard1 } = useInView({ threshold: 0.3 })
	const { observe: observeCard2, inView: inViewCard2 } = useInView({ threshold: 0.3 })

	return (
		<section {...props} className="h-full p-2 flex flex-col gap-6 text-white">
			<div
				ref={isSm ? undefined : sliderRef}
				className={`w-full h-full flex ${isSm ? "flex-col" : "keen-slider"}`}
			>
				<div
					ref={observeCard1}
					className={`w-full p-6 flex justify-between items-center flex-col sm:flex-row gap-6 h-1/2 ${
						isSm ? "" : "keen-slider__slide"
					}`}
				>
					<motion.img
						initial={{ y: -100, opacity: 0 }}
						{...(inViewCard1 && { animate: { y: 0, opacity: 1 } })}
						transition={{ duration: 0.6, delay: 0.4 }}
						src="/web-todolist.png"
						alt="todo list"
						className="sm:h-full sm:w-auto w-full h-auto border-2 rounded-lg border-black shadow-lg"
					/>
					<motion.div className="max-w-lg">
						<h2 className="text-yellow-500 font-semibold text-xl mb-2">
                            <a href="https://todo.manu-tech.my.id" target="_blank" rel="noopener noreferrer">
							    <TypingText text="Todo List App" duration={0.03} inView={inViewCard1} />
                            </a>
						</h2>
						<motion.p
						initial={{ x: 100, opacity: 0 }}
						{...(inViewCard1 && { animate: { x: 0, opacity: 1 } })}
						transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-sm sm:text-base leading-relaxed text-gray-200 font-sriracha">
							This task management tool is designed for both quick access and long-term use. 
							You can choose guest mode if you prefer to manage tasks without creating an account, 
							or log in to securely save your data for future sessions. Powered by a GraphQL API, 
							it supports OAuth and email-password login, offers complete CRUD features, 
							and enables multi-device sync for maximum flexibility.
						</motion.p>
					</motion.div>
				</div>

				<div
					ref={observeCard2}
					className={`w-full p-6 flex justify-between items-center flex-col sm:flex-row-reverse gap-6 h-1/2 ${
						isSm ? "" : "keen-slider__slide"
					}`}
				>
					<motion.img
						initial={{ y: -100, opacity: 0 }}
						{...(inViewCard2 && { animate: { y: 0, opacity: 1 } })}
						transition={{ duration: 0.6, delay: 0.4 }}
						src="/web-blog.png"
						alt="blog"
						className="sm:h-full sm:w-auto w-full h-auto border-2 rounded-lg border-black shadow-lg"
					/>
					<motion.div className="max-w-lg">
						<h2 className="text-yellow-500 font-semibold text-xl mb-2">
                            <a href="https://blog.manu-tech.my.id" target="_blank" rel="noopener noreferrer">
							    <TypingText text="Blog App" duration={0.03} inView={inViewCard2} />
                            </a>
						</h2>
						<motion.p
						initial={{ x: -100, opacity: 0 }}
						{...(inViewCard2 && { animate: { x: 0, opacity: 1 } })}
						transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-sm sm:text-base leading-relaxed text-gray-200 font-sriracha">
							This modern publishing platform is fully integrated with the same GraphQL API. 
							It features a role-based system from regular users to superusers, 
							an intuitive admin panel, and full markdown support, making writing and managing content effortless. 
						</motion.p>
					</motion.div>
				</div>
			</div>

			<div ref={observe} className="flex justify-between sm:hidden flex-1 gap-4">
				<motion.button
					initial={{ x: -100, opacity: 0 }}
					{...(inView && { animate: { x: 0, opacity: 1 } })}
					transition={{ duration: 0.6, delay: 0.4 }}
					onClick={() => instanceRef.current?.prev()}
					className="flex-1 bg-transparent flex justify-center items-end border-b-2 hover:bg-white hover:border-yellow-500 text-yellow-500 shadow rounded-lg px-3 py-1"
				>
					<ArrowLeft size={16} />
				</motion.button>
				<motion.button
					initial={{ x: 100, opacity: 0 }}
					{...(inView && { animate: { x: 0, opacity: 1 } })}
					transition={{ duration: 0.6, delay: 0.4 }}
					onClick={() => instanceRef.current?.next()}
					className="flex-1 bg-transparent flex justify-center items-end border-b-2 hover:bg-white hover:border-yellow-500 text-yellow-500 shadow rounded-lg px-3 py-1"
				>
					<ArrowRight size={16} />
				</motion.button>
			</div>
		</section>
	)
}
