import { useInView } from "react-cool-inview";
import { useTranslation } from "react-i18next";
import TypingText from "../components/typingText"
import type { componentsRef } from "../lib/types"

type HomeProps = {
    scrollToComponents:  (ref: React.RefObject<HTMLElement | null>) => void,
    componentsRef: componentsRef
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
export default function Home({ scrollToComponents, componentsRef, ...props }: HomeProps) {
    const { t } = useTranslation();
    const { observe, inView } = useInView({
        threshold: 0.4
    });

    return (
        <section {...props} className="h-full flex justify-center items-center flex-col text-start">
            <h4 className="font-poppins text-sm sm:text-2xl "><TypingText inView={inView} duration={0.020} text={t("home.greeting")}/></h4>
            <h1 ref={observe} className="text-center font-chocolate text-[1.625rem] sm:text-[2.75rem] font-extrabold w-80 sm:w-100 break-words whitespace-normal bg-gradient-to-tr from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent">
                {t("home.title").split("&")[0].trim()}
                {t("home.title").includes("&") && (
                    <>
                        <br />
                        &amp; {t("home.title").split("&")[1].trim()}
                    </>
                )}
            </h1>
            <p className="md:w-2/4 sm:w-2/3 mt-2 break-words whitespace-normal font-sriracha text-center sm:text-sm"><TypingText inView={inView} duration={0.020} text={t("home.subtitle")}/></p>
            <div className="flex flex-wrap gap-4">
                <button onClick={() => scrollToComponents(componentsRef.projectsRef)} className="mt-7 font-action border border-yellow-500 p-2 break-words whitespace-normal bg-gradient-to-r transform hover:scale-95 hover:border-white active:border-white hover:shadow-2xl cursor-pointer active:scale-90 from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent rounded-sm transition-transform duration-200">{t("home.projects")}</button>
                {/* <button onClick={() => scrollToComponents(componentsRef.projectsRef)} className="mt-7 font-action border border-yellow-500 p-2 break-words whitespace-normal bg-gradient-to-r transform hover:scale-95 hover:border-white active:border-white hover:shadow-2xl cursor-pointer active:scale-90 from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent transition-transform duration-200">{t("home.curriculumVitae")}</button> */}
                <button className="mt-7 font-action border border-yellow-500 p-2 break-words whitespace-normal bg-gradient-to-r transform hover:scale-95 hover:border-white active:border-white hover:shadow-2xl cursor-pointer active:scale-90 from-yellow-300 via-white to-yellow-300  bg-clip-text text-transparent rounded-sm transition-transform duration-200">
                    <a href="https://blog.manu-tech.my.id/manuTech0">{t("home.blog")}</a>
                </button>
            </div>
        </section>
    )
}