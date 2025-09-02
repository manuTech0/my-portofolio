import { useInView } from "react-cool-inview";
import TypingText from "../components/typingText"
import type { componentsRef } from "../lib/types"

type HomeProps = {
    scrollToComponents:  (ref: React.RefObject<HTMLElement | null>) => void,
    componentsRef: componentsRef
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
export default function Home({ scrollToComponents, componentsRef, ...props }: HomeProps) {
    const { observe, inView } = useInView({
        threshold: 0.4
    });

    return (
        <section {...props} className="h-full flex justify-center items-center flex-col text-start">
            <h4 className="font-poppins text-sm sm:text-2xl "><TypingText inView={inView} duration={0.020} text="Hi, I'm Maulanan Nurfanoto"/></h4>
            <h1 ref={observe} className="text-center font-chocolate text-3xl sm:text-5xl font-extrabold w-80 sm:w-100 break-words whitespace-normal bg-gradient-to-tr from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent">Backend Developer and IT Consultant</h1>
            <p className="md:w-2/4 sm:w-2/3 mt-2 break-words whitespace-normal font-sriracha text-center sm:text-sm"><TypingText inView={inView} duration={0.020} text="Transforming business ideas into high-performance web systems with secure, scalable, and strategic backend solutions."/></p>
            <button onClick={() => scrollToComponents(componentsRef.projectsRef)} className="mt-7 font-action border border-yellow-500 p-2 break-words whitespace-normal bg-gradient-to-r transform-gpu hover:-translate-y-2 hover:border-white active:border-white hover:shadow-2xl cursor-pointer active:-translate-y-2 from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent">My Projects</button>
        </section>
    )
}