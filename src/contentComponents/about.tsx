import TypingText from "@/components/typingText"
import { useInView } from "react-cool-inview"
import Marquee from "react-fast-marquee"

export default function About(
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
) {
    const { observe, inView } = useInView({ threshold: 0.4 })

    return (
        <section {...props} className="h-full flex flex-col justify-center">
            <div className="sm:flex items-center justify-center sm:px-20">
                <div className="flex-1 flex justify-center">
                    <div className="relative">
                        <img
                            src="/my-avatar.png"
                            alt="avatar"
                            style={{
                                background:
                                    "linear-gradient(to top, #eab308 2%, transparent 98%)",
                            }}
                            className="w-50 h-50 rounded-lg object-contain z-10 border-b-2 border-black"
                        />
                    </div>
                </div>

                <div
                    ref={observe}
                    className="flex-[2] px-2 sm:px-0 mt-4 sm:ps-3 border-t border-l border-yellow-500 p-[0.4rem] sm:p-2"
                >
                    <div className="text-[0.85em] sm:text-lg font-sriracha text-gray-200">
                        <p className="mb-2">
                            <TypingText
                                text="A Freelancer specializing in web development, APIs, and Linux-based systems. I work with Next.js, React, PostgreSQL, and Docker to build scalable and reliable applications. Beyond coding, I focus on creating solutions that are not only functional but also efficient, secure, and user-friendly."
                                inView={inView}
                                duration={0.02}
                            />
                        </p>
                        <p>
                            <TypingText
                                text="I’m open to freelance projects and collaborations where I can contribute both technical expertise and a problem-solving mindset to bring ideas into reality."
                                inView={inView}
                                duration={0.02}
                                reverse={true}
                            />
                        </p>
                    </div>
                </div>
            </div>

            <Marquee gradient={false} speed={40} className="my-4 text-yellow-500 font-semibold">
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">Next.js</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">React.js</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">GraphQL</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">PHP</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">Laravel</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">PostgreSQL</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">Docker</div>
            </Marquee>
        </section>
    )
}
