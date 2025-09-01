import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import Navbar from "./Navbar"
import { useImagePreload } from "./components/imgaePreload"
import { GithubIcon, Loader, Mail } from "lucide-react"
import Home from "./contentComponents/home"
import About from "./contentComponents/about"
import Projects from "./contentComponents/project"
import Contact from "./contentComponents/contact"
import type { componentsRef } from "./lib/types"
import { motion } from "framer-motion"

function App() {
  const [loadDiv, setLoadDiv] = useState(false)
  const imageLoaded = useImagePreload(["/corner-ts.svg", "/corner-be.svg"])
  const divRef = useRef<HTMLDivElement | null>(null)
  const componentsRef: componentsRef = {
    homeRef: useRef<HTMLElement | null>(null),
    aboutRef: useRef<HTMLElement | null>(null),
    projectsRef: useRef<HTMLElement | null>(null),
    contactRef: useRef<HTMLElement | null>(null),
  }

  const scrollToComponents = (ref: React.RefObject<HTMLElement | null>) => {
    if(ref.current) {
      ref.current.scrollIntoView({ 
        behavior: "smooth",
        block: "center"
      })
    }
  }
  useEffect(() => {
    setLoadDiv(true)
  }, [])

  useLayoutEffect(() => {
    setTimeout(() => {
      if(!divRef.current) {
        console.log("div is null")
        return
      };
      const div = divRef.current
      const heightDiv = div.scrollHeight
      document.body.style.height = heightDiv + 200 + "px"
      const handleScroll = () => {
        const scrollY = window.scrollY
        div.scrollTop = scrollY
      }
      window.addEventListener("scroll", handleScroll)
      return () => {
        window.removeEventListener("scroll", handleScroll)
        document.body.style.height = "auto"
      }
    }, 200)
  }, [loadDiv])

  return (
    <div className="lg:px-10 md:px-10 bg-color-gradient fixed top-0 left-0 w-screen h-screen">
      {!imageLoaded && (
      <div className="h-screen w-screen z-10 absolute top-0 left-0 flex justify-center items-center">
        <Loader /> Loading 
      </div>
      )}
      {imageLoaded && (
        <motion.div 
          className="h-screen w-full px-10 pb-7 pt-5 flex flex-col"
          style={{
            backgroundImage: `url("/corner-ts.svg")`,
            backgroundRepeat: "no-repeat"
          }}
        >
          <div
            className="absolute sm:ms-10 lg:mx-10 md:mx-10 bottom-0 right-0 h-screen w-full flex justify-start items-end"
            style={{
              backgroundImage: "url('/corner-be.svg')",
              backgroundPosition: "right bottom",
              backgroundRepeat: "no-repeat",
            }}
          >
          </div>
          <Navbar componentsRef={componentsRef} scrollToComponents={scrollToComponents}/>
          <div ref={divRef} className="h-max flex-1 overflow-hidden text-white z-50" id="page">
            <Home className="snap-center" ref={componentsRef.homeRef} scrollToComponents={scrollToComponents} componentsRef={componentsRef}/>
            <About className="snap-center" ref={componentsRef.aboutRef} />
            <Projects className="snap-center" ref={componentsRef.projectsRef} />
            <Contact className="snap-center" ref={componentsRef.contactRef} />
          </div>
          <motion.div 
            className="flex justify-start items-end"
            initial={{ y:50, opacity: 0 }}
            animate={{ y:0, opacity: 100 }}
            transition={{ duration: 0.5 }}
          >
            <ul className="flex justify-around gap-4 mb-2 text-md items-center me-4 text-gray-700">
                <li className=" border-gray-700 border-b-2 hover:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2">
                  <a href="https://github.com/manuTech0" target="_blank"><GithubIcon /></a>
                </li>
                <li className=" border-gray-700 border-b-2 hover:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2">
                  <a href="mailto:maulananurfanoto10@gmail.com" target="_blank"><Mail /></a>
                </li>
            </ul>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default App
