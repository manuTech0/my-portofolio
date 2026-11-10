import type { ReactNode } from "react";
import type { componentsRef } from "./lib/types";
import type React from "react";
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import LanguageToggle from "./components/LanguageToggle"

type LiType = {
    children: ReactNode
} & React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>
function NavItem({ children, ...props }: LiType) {
    return (
        <li {...props} className="transform-gpu hover:scale-110 hover:border-yellow-400 active:scale-110 active:border-yellow-400 cursor-pointer border-white border-b-2">
            {children}
        </li>
    )
}

export default function Navbar({ componentsRef, scrollToComponents }: {
    componentsRef: componentsRef,
    scrollToComponents: (ref: React.RefObject<HTMLElement | null>) => void
}) {
    const { t } = useTranslation()

    return (
        <motion.div 
            className="h-10 flex justify-end items-center md:mx-10 sm:mx-0"
            initial={{ y:-50, opacity: 0 }}
            animate={{ y:0, opacity: 100 }}
            transition={{ duration: 0.5 }}
        >
            <ul className="flex justify-around gap-4 text-md items-center text-white font-action">
                <NavItem onClick={() => scrollToComponents(componentsRef.homeRef)}>{t("nav.home")}</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.aboutRef)}>{t("nav.about")}</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.projectsRef)}>{t("nav.projects")}</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.contactRef)}>{t("nav.contact")}</NavItem>
                <li className="hidden md:block">
                    <LanguageToggle />
                </li>
            </ul>
        </motion.div>
    )
}