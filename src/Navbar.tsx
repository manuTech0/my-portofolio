import type { ReactNode } from "react";
import type { componentsRef } from "./lib/types";
import type React from "react";
import { motion } from "framer-motion"

type LiType = {
    children: ReactNode
} & React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>
function NavItem({ children, ...props }: LiType) {
    return (
        <li {...props} className="transform-gpu hover:scale-110 hover:border-yellow-400 hover:cursor-pointer border-white border-b-2">
            <a>{children}</a>
        </li>
    )
}

export default function Navbar({ componentsRef, scrollToComponents }: {
    componentsRef: componentsRef,
    scrollToComponents: (ref: React.RefObject<HTMLElement | null>) => void
}) {
    return (
        <motion.div 
            className="h-10 flex justify-end items-center mx-10 sm:mx-0"
            initial={{ y:-50, opacity: 0 }}
            animate={{ y:0, opacity: 100 }}
            transition={{ duration: 0.5 }}
        >
            <ul className="flex justify-around gap-4 text-md items-center text-white font-action">
                <NavItem onClick={() => scrollToComponents(componentsRef.homeRef)}>Home</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.aboutRef)}>About</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.projectsRef)}>Projects</NavItem>
                <NavItem onClick={() => scrollToComponents(componentsRef.contactRef)}>Contact</NavItem>
            </ul>
        </motion.div>
    )
}