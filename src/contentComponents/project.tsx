import { useKeenSlider } from "keen-slider/react"
import "keen-slider/keen-slider.min.css"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useMediaQuery } from "usehooks-ts"
import { motion } from "framer-motion"
import { useInView } from "react-cool-inview"
import TypingText from "@/components/typingText"
import AdaptiveImage from "@/components/adaptiveImage"

export default function Projects(
	props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
) {
	const isSm = useMediaQuery("(min-width: 640px)")

	const [sliderRef, instanceRef] = useKeenSlider(
		{
			loop: true,
			mode: "snap",
			slides: { perView: isSm ? 2 : 1, spacing: 10 },
		},
		[
		]
	)

	const { observe, inView } = useInView({ threshold: 0.3 })
	const { observe: observeCard1, inView: inViewCard1 } = useInView({ threshold: 0.3 })
	const { observe: observeCard2, inView: inViewCard2 } = useInView({ threshold: 0.3 })

	const projectsData = [
		{
			ref: observeCard1,
			inView: inViewCard1,
			imagePosition: "left",
			image: {
				baseName: "web-todolist",
				alt: "todo list project"
			},
			title: "Todo List App",
			url: "https://todo.manu-tech.my.id",
			description: "This task management tool is designed for both quick access and long-term use. You can choose guest mode if you prefer to manage tasks without creating an account, or log in to securely save your data for future sessions. Powered by a GraphQL API, it supports OAuth and email-password login, offers complete CRUD features, and enables multi-device sync for maximum flexibility.",
			textAnimation: { x: 100 }
		},
		{
			ref: observeCard2,
			inView: inViewCard2,
			imagePosition: "right",
			image: {
				baseName: "web-blog",
				alt: "blog app project"
			},
			title: "Blog App",
			url: "https://blog.manu-tech.my.id",
			description: "This modern publishing platform is fully integrated with the same GraphQL API. It features a role-based system from regular users to superusers, an intuitive admin panel, and full markdown support, making writing and managing content effortless.",
			textAnimation: { x: -100 }
		},
	]

	return (
		<section {...props} className="min-h-full p-2 flex flex-col gap-6 text-white">
			<div
				ref={isSm ? undefined : sliderRef}
				className={`w-full h-full flex ${isSm ? "flex-col" : "keen-slider"}`}
			>
				{projectsData.map((project, index) => (
					<div
						key={index}
						ref={project.ref}
						className={`w-full p-6 flex justify-between items-center flex-col ${
							isSm 
								? project.imagePosition === "left" 
									? "sm:flex-row" 
									: "sm:flex-row-reverse"
								: ""
						} gap-6 ${isSm ? "h-1/2" : "keen-slider__slide"}`}
					>
						<AdaptiveImage 
							initial={{ y: -100, opacity: 0 }}
							{...(project.inView && { animate: { y: 0, opacity: 1 } })}
							transition={{ duration: 0.6, delay: 0.4 }}
							className="lg:h-full lg:w-auto w-full h-auto border-2 rounded-lg border-black shadow-lg"
							alt={project.image.alt}
							baseName={project.image.baseName}
						/>
						<motion.div className="max-w-lg">
							<h2 className="text-yellow-500 font-semibold text-xl mb-2">
								<a href={project.url} target="_blank" rel="noopener noreferrer">
									<TypingText text={project.title} duration={0.03} inView={project.inView} />
								</a>
							</h2>
							<motion.p
								initial={{ ...project.textAnimation, opacity: 0 }}
								{...(project.inView && { animate: { x: 0, opacity: 1 } })}
								transition={{ duration: 0.6, delay: 0.4 }}
								className="md:text-[0.9rem] text-sm lg:text-md md:text-base leading-relaxed text-gray-200 font-sriracha"
							>
								{project.description}
							</motion.p>
						</motion.div>
					</div>
				))}
			</div>

			<div ref={observe} className="flex justify-between sm:hidden flex-1 gap-4">
				<motion.button
					initial={{ x: -100, opacity: 0 }}
					{...(inView && { animate: { x: 0, opacity: 1 } })}
					transition={{ duration: 0.6, delay: 0.4 }}
					onClick={() => instanceRef.current?.prev()}
					aria-label="Previous page"
					className="flex-1 bg-transparent flex justify-center items-end border-b-2 hover:bg-white hover:border-yellow-500 text-yellow-500 shadow rounded-lg px-3 py-1"
				>
					<ArrowLeft size={16} />
				</motion.button>
				<motion.button
					initial={{ x: 100, opacity: 0 }}
					{...(inView && { animate: { x: 0, opacity: 1 } })}
					transition={{ duration: 0.6, delay: 0.4 }}
					onClick={() => instanceRef.current?.next()}
					aria-label="Next page"
					className="flex-1 bg-transparent flex justify-center items-end border-b-2 hover:bg-white hover:border-yellow-500 text-yellow-500 shadow rounded-lg px-3 py-1"
				>
					<ArrowRight size={16} />
				</motion.button>
			</div>
		</section>
	)
}
