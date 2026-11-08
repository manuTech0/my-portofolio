import type { ReactNode } from "react";
import type { componentsRef } from "./lib/types";
import type React from "react";
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from "./components/ui/dropdown-menu"

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
    const { t, i18n } = useTranslation()
    const lang = i18n.resolvedLanguage === "id" ? "id" : "en"

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
                <li>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                aria-label="Change language"
                                className="transform-gpu hover:scale-110 active:scale-110 hover:border-yellow-400 active:border-yellow-400 cursor-pointer border-white border-b-2 bg-transparent text-white uppercase"
                            >
                                {lang}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuRadioGroup value={lang} onValueChange={(value) => i18n.changeLanguage(value)}>
                                <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="id">Bahasa Indonesia</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </li>
            </ul>
        </motion.div>
    )
}