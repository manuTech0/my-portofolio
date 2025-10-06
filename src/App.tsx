import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import Navbar from "./Navbar"
import { useImagePreload } from "./components/imgaePreload"
import { GithubIcon, Loader, Mail } from "lucide-react"
import type { componentsRef } from "./lib/types"
import { motion } from "framer-motion"
import { Helmet } from "react-helmet-async"

import Home from "./contentComponents/home"
import About from "./contentComponents/about"
import Projects from "./contentComponents/project"
import Contact from "./contentComponents/contact"

function App() {
  const [loadDiv, setLoadDiv] = useState(false)
  const imageLoaded = useImagePreload([
    "/corner-ts.svg",
    "/corner-be.svg",
    "/my-avatar.avif",
    "/web-todolist.webp",
    "/web-blog.webp"
  ])

  const divRef = useRef<HTMLDivElement | null>(null)
  const componentsRef: componentsRef = {
    homeRef: useRef<HTMLElement | null>(null),
    aboutRef: useRef<HTMLElement | null>(null),
    projectsRef: useRef<HTMLElement | null>(null),
    contactRef: useRef<HTMLElement | null>(null),
  }

  const scrollToComponents = (ref: React.RefObject<HTMLElement | null>) => {
    const rect = ref.current?.getBoundingClientRect()

    const targetY = (rect as DOMRect)?.top + window.scrollY
    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    })
    ref.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "center"
    })

  }

  useEffect(() => setLoadDiv(true), [])
  useLayoutEffect(() => {
    const div = divRef.current
    if (!div) return
    const updateBodyHeight = () => {
      document.body.style.height = div.scrollHeight + 300 + "px"
    }

    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        div.scrollTop = window.scrollY
      })
    }

    const scrollToHash = (hash: string) => {
      const el = div.querySelector(hash) as HTMLElement | null
      if (!el) return
      const targetY = el.offsetTop
      const duration = 400 // ms
      const startY = div.scrollTop
      const diff = targetY - startY
      let startTime: number | null = null

      const animate = (time: number) => {
        if (!startTime) startTime = time
        const progress = Math.min((time - startTime) / duration, 1)
        div.scrollTop = startY + diff * progress
        if (progress < 1) requestAnimationFrame(animate)
      }
      requestAnimationFrame(animate)
    }

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement
      if (target.tagName === "A" && target.hash) {
        const el = div.querySelector(target.hash)
        if (!el) return
        e.preventDefault()
        scrollToHash(target.hash)
        window.history.pushState(null, "", target.hash)
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updateBodyHeight()
      if (window.location.hash) scrollToHash(window.location.hash)
    })
    resizeObserver.observe(div)

    window.addEventListener("scroll", handleScroll)
    document.addEventListener("click", handleAnchorClick)

    updateBodyHeight()
    if (window.location.hash) scrollToHash(window.location.hash)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("click", handleAnchorClick)
      document.body.style.height = "auto"
    }
  }, [loadDiv, imageLoaded])

  return (
    <>
      <Helmet>
        <title>Portofolio | Maulana N</title>
        <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="todo-list" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="description" content="Portofolio Maulana Nurfanoto, Backend Specialist and IT Consultant" />
        <meta name="keywords" content="Maulana Nurfanoto, Maulana Nurfanoto, Maulana Nurpanoto, web developer, React developer, Next.js developer"></meta>
        <link rel="canonical" href="https://www.manu-tech.my.id/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Chocolate+Classical+Sans&family=Golos+Text:wght@400..900&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Sriracha&display=swap" rel="stylesheet" />
        <link rel="preload" as="image" href="/my-avatar.avif" type="image/avif" />
        <link rel="preload" as="image" href="/my-avatar.webp" type="image/webp" />
        <link rel="preload" as="image" href="/my-avatar.png" type="image/png" />
      </Helmet>

      <div className="lg:px-10 md:px-10 bg-color-gradient fixed top-0 left-0 w-screen h-dvh">
        {!imageLoaded && (
          <div className="h-dvh w-screen z-[200] bg-color-gradient absolute top-0 left-0 flex justify-center items-center flex-col">
            <div className="animate-bounce">
              <h1 className="flex">
                <Loader className="animate-spin me-2 "/> 
                <span className="typing-dots">Loading</span>
              </h1>
            </div>
            <p>We're getting things ready. Please hold on.</p>
          </div>
        )}

        {imageLoaded && (
          <motion.div 
            className="h-dvh w-full px-10 pb-7 pt-5 flex flex-col"
            style={{ backgroundImage: `url("/corner-ts.svg")`, backgroundRepeat: "no-repeat" }}
          >
            <div
              className="absolute sm:ms-10 lg:mx-10 md:mx-10 bottom-0 right-0 h-screen w-full flex justify-start items-end"
              style={{ backgroundImage: "url('/corner-be.svg')", backgroundPosition: "right bottom", backgroundRepeat: "no-repeat" }}
            />

            <Navbar componentsRef={componentsRef} scrollToComponents={scrollToComponents}/>

            <div ref={divRef} className="h-max flex-1 overflow-hidden text-white z-50" id="page">
              <Home className="snap-center" ref={componentsRef.homeRef} scrollToComponents={scrollToComponents} componentsRef={componentsRef}/>
              <About className="snap-center" ref={componentsRef.aboutRef} />
              <Projects className="snap-center" ref={componentsRef.projectsRef} />
              <Contact className="snap-center" ref={componentsRef.contactRef} id="tes"/>
            </div>

            <motion.div 
              className="flex justify-start items-end"
              initial={{ y:50, opacity: 0 }}
              animate={{ y:0, opacity: 100 }}
              transition={{ duration: 0.5 }}
            >
              <ul className="flex justify-around gap-4 mb-2 text-md items-center me-4 text-gray-700">
                <li className="border-gray-700 border-b-2 hover:text-yellow-400 active:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2 active:-translate-y-2">
                  <a href="https://github.com/manuTech0" target="_blank"><GithubIcon /></a>
                </li>
                <li className="border-gray-700 border-b-2 hover:text-yellow-400 active:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2 active:-translate-y-2">
                  <a href="mailto:maulananurfanoto10@gmail.com" target="_blank"><Mail /></a>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  )
}

export default App
