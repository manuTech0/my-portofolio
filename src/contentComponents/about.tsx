import AdaptiveImage from "@/components/adaptiveImage"
import TypingText from "@/components/typingText"
import { useInView } from "react-cool-inview"
import Marquee from "react-fast-marquee"
import { useTranslation } from "react-i18next"

export default function About(
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
) {
    const { t } = useTranslation()
    const { observe, inView } = useInView({ threshold: 0.4 })

    return (
        <section {...props} className="h-full flex flex-col justify-center">
            <div className="sm:flex items-center justify-center sm:px-20">
                <div className="flex-1 flex justify-center">
                    <div className="relative">
                        <AdaptiveImage 
                            className="w-50 h-50 rounded-lg object-contain z-10 border-b-2 border-black"
                            alt={t("about.avatarAlt")}
                            style={{
                                background:
                                    "linear-gradient(to top, #eab308 2%, transparent 98%)",
                            }}
                            baseName="my-avatar"
                            priority={true}
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
                                text={t("about.bio1")}
                                inView={inView}
                                duration={0.02}
                            />
                        </p>
                        <p>
                            <TypingText
                                text={t("about.bio2")}
                                inView={inView}
                                duration={0.02}
                                delay={0.5}
                            />
                        </p>
                    </div>
                </div>
            </div>

            <Marquee gradient={false} speed={40} className="my-4 text-yellow-500 font-semibold">
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.typescript")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.laravel")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.rust")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.postgresql")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.authentication")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.api")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.linux")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.docker")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.virtualization")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.server")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.networking")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.ssh")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.windows")}</div>
                <div className="border-e-2 border-yellow-500 px-3 sm:px-14">{t("tech.hardware")}</div>
            </Marquee>
        </section>
    )
}
