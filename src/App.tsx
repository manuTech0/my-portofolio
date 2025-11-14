import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Navbar from "./Navbar";
import { useImagePreload } from "./components/imgaePreload";
import { GithubIcon, Loader, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import type { componentsRef } from "./lib/types";
import { Toaster } from "./components/ui/sonner";
const Home = lazy(() => import("./contentComponents/home"));
const About = lazy(() => import("./contentComponents/about"));
const Projects = lazy(() => import("./contentComponents/project"));
const Contact = lazy(() => import("./contentComponents/contact"));
function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const imageLoaded = useImagePreload([
    "my-avatar-360.webp",
    "web-blog-360.webp",
    "web-todolist-360.webp",
    "my-avatar-600.webp",
    "web-blog-600.webp",
    "web-todolist-600.webp",
    "my-avatar-1354.webp",
    "web-blog-1354.webp",
    "web-todolist-1354.webp",
    "my-avatar-1440.webp",
    "web-blog-1440.webp",
    "web-todolist-1440.webp",
  ]);
  const divRef = useRef<HTMLDivElement | null>(null);
  const componentsRef: componentsRef = {
    homeRef: useRef<HTMLElement | null>(null),
    aboutRef: useRef<HTMLElement | null>(null),
    projectsRef: useRef<HTMLElement | null>(null),
    contactRef: useRef<HTMLElement | null>(null),
  };
  useEffect(() => {
    startTransition(() => {
      Promise.all([
        import("./contentComponents/home"),
        import("./contentComponents/about"),
        import("./contentComponents/project"),
        import("./contentComponents/contact"),
      ]).then(() => setIsLoaded(true));
    });
  }, []);
  const readyToShow = isLoaded && imageLoaded && !isPending;
  const scrollToComponents = (ref: React.RefObject<HTMLElement | null>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect()
    const targetY = rect.top + window.scrollY
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    window.scrollTo({
      top: targetY - 50, 
      behavior: "smooth"
    })
  };
  useLayoutEffect(() => {
    const div = divRef.current;
    console.log(div)
    if (!div || !readyToShow) return;
    const updateBodyHeight = () => {
      document.body.style.height = div.scrollHeight + 300 + "px";
    };
    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        div.scrollTop = window.scrollY;
      });
    };
    const scrollToHash = (hash: string) => {
      const el = div.querySelector(hash) as HTMLElement | null;
      if (!el) return;
      const targetY = el.offsetTop;
      const duration = 400;
      const startY = div.scrollTop;
      const diff = targetY - startY;
      let startTime: number | null = null;
      const animate = (time: number) => {
        if (!startTime) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);
        div.scrollTop = startY + diff * progress;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLAnchorElement;
      if (target.tagName === "A" && target.hash) {
        const el = div.querySelector(target.hash);
        if (!el) return;
        e.preventDefault();
        scrollToHash(target.hash);
        window.history.pushState(null, "", target.hash);
      }
    };
    let resizeTimer: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateBodyHeight();
        if (window.location.hash) scrollToHash(window.location.hash);
      }, 150);
    });
    resizeObserver.observe(div);
    const observer = new MutationObserver(updateBodyHeight);
    observer.observe(document.body, { childList: true, subtree: true });
    updateBodyHeight();
    if (window.location.hash) scrollToHash(window.location.hash);
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("click", handleAnchorClick);
    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", handleAnchorClick);
      document.body.style.height = "auto";
      if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, [readyToShow]);
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
        <meta property="og:title" content="Maulana N | Portofolio" />
        <meta property="og:description" content="Portofolio Maulana Nurfanoto, Backend Specialist and IT Consultant" />
        <meta property="og:image" content="https://www.manu-tech.my.id/my-avatar-600.webp" />
        <meta property="og:url" content="https://www.manu-tech.my.id" />
        <meta property="og:type" content="website" />
        <meta name="keywords" content="Maulana Nurfanoto, Maulana Nurfanoto, Maulana Nurpanoto, web developer, React developer, Next.js developer"></meta>
        <meta property="twitter:title" content="Maulana N | Portofolio" />
        <meta property="twitter:description" content="Portofolio Maulana Nurfanoto, Backend Specialist and IT Consultant" />
        <meta property="twitter:image" content="https://www.manu-tech.my.id/my-avatar-600.webp" />
        <meta property="twitter:card" content="https://www.manu-tech.my.id/my-avatar-1354.webp" />
        <link rel="canonical" href="https://www.manu-tech.my.id/" />
        <link
          rel="preload"
          href="/fonts/ChocolateClassicalSans.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Poppins.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/Sriracha.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/my-avatar-360.webp"
          imageSrcSet="/my-avatar-360.webp 360w, /my-avatar-600.webp 600w"
          imageSizes="(max-width: 600px) 100vw"
          type="image/webp"
          media="(max-width: 600px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-blog-360.webp"
          imageSrcSet="/web-blog-360.webp 360w, /web-blog-600.webp 600w"
          imageSizes="(max-width: 600px) 100vw"
          type="image/webp"
          media="(max-width: 600px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-todolist-360.webp"
          imageSrcSet="/web-todolist-360.webp 360w, /web-todolist-600.webp 600w"
          imageSizes="(max-width: 600px) 100vw"
          type="image/webp"
          media="(max-width: 600px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/my-avatar-1354.webp"
          imageSrcSet="/my-avatar-600.webp 600w, /my-avatar-1354.webp 1354w"
          imageSizes="(max-width: 1200px) 100vw"
          type="image/webp"
          media="(min-width: 601px) and (max-width: 1200px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-blog-1354.webp"
          imageSrcSet="/web-blog-600.webp 600w, /web-blog-1354.webp 1354w"
          imageSizes="(max-width: 1200px) 100vw"
          type="image/webp"
          media="(min-width: 601px) and (max-width: 1200px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-todolist-1354.webp"
          imageSrcSet="/web-todolist-600.webp 600w, /web-todolist-1354.webp 1354w"
          imageSizes="(max-width: 1200px) 100vw"
          type="image/webp"
          media="(min-width: 601px) and (max-width: 1200px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/my-avatar-1440.webp"
          imageSrcSet="/my-avatar-1354.webp 1354w, /my-avatar-1440.webp 1440w"
          imageSizes="(min-width: 1201px) 100vw"
          type="image/webp"
          media="(min-width: 1201px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-blog-1440.webp"
          imageSrcSet="/web-blog-1354.webp 1354w, /web-blog-1440.webp 1440w"
          imageSizes="(min-width: 1201px) 100vw"
          type="image/webp"
          media="(min-width: 1201px)"
        />
        <link 
          rel="preload" 
          as="image" 
          href="/web-todolist-1440.webp"
          imageSrcSet="/web-todolist-1354.webp 1354w, /web-todolist-1440.webp 1440w"
          imageSizes="(min-width: 1201px) 100vw"
          type="image/webp"
          media="(min-width: 1201px)"
        />
        <link
          rel="preload"
          as="image"
          href="/corner-ts.svg"
          type="image/svg+xml"
          fetchPriority="high"
          crossOrigin=""
        />
        <link
          rel="preload"
          as="image"
          href="/corner-be.svg"
          type="image/svg+xml"
          fetchPriority="high"
          crossOrigin=""
        />
      </Helmet>
      <Toaster position="top-center"/>
      <div className="lg:px-10 md:px-10 bg-color-gradient fixed top-0 left-0 w-screen min-h-dvh">
        {!readyToShow ? (
          <div className="h-dvh w-screen z-[200] bg-color-gradient absolute top-0 left-0 flex justify-center items-center flex-col">
            <div className="animate-bounce">
              <h1 className="flex">
                <Loader className="animate-spin me-2" />
                <span className="typing-dots">Loading</span>
              </h1>
            </div>
            <p>We're getting things ready. Please hold on.</p>
          </div>
        ) : (
          <motion.div
            className="h-dvh w-full px-10 pb-7 pt-5 flex flex-col"
            style={{
              backgroundImage: `url("/corner-ts.svg")`,
              backgroundRepeat: "no-repeat",
            }}
          >
            <div
              className="absolute sm:ms-10 lg:mx-10 md:mx-10 bottom-0 right-0 h-screen w-full flex justify-start items-end"
              style={{
                backgroundImage: "url('/corner-be.svg')",
                backgroundPosition: "right bottom",
                backgroundRepeat: "no-repeat",
              }}
            />
            <Navbar
              componentsRef={componentsRef}
              scrollToComponents={scrollToComponents}
            />
            <div
              ref={divRef}
              className="h-max flex-1 overflow-hidden text-white z-50"
              id="page"
            >
              <Suspense
                fallback={
                  <div className="h-dvh w-screen z-[200] bg-color-gradient absolute top-0 left-0 flex justify-center items-center flex-col">
                    <div className="animate-bounce">
                      <h1 className="flex">
                        <Loader className="animate-spin me-2" />
                        <span className="typing-dots">Loading</span>
                      </h1>
                    </div>
                    <p>We're getting things ready. Please hold on.</p>
                  </div>
                }
              >
                <Home
                  className="snap-center"
                  ref={componentsRef.homeRef}
                  scrollToComponents={scrollToComponents}
                  componentsRef={componentsRef}
                  aria-label="redirect to home section"
                />
                <About
                  className="snap-center"
                  ref={componentsRef.aboutRef}
                  aria-label="redirect to about section"
                />
                <Projects
                  className="snap-center"
                  ref={componentsRef.projectsRef}
                  aria-label="redirect to project section"
                />
                <Contact
                  className="snap-center"
                  ref={componentsRef.contactRef}
                  id="tes"
                  aria-label="redirect to contact section"
                />
              </Suspense>
            </div>
            <motion.div
              className="flex justify-start items-end"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <ul className="flex justify-around gap-4 mb-2 text-md items-center me-4 text-gray-700">
                <li className="border-gray-700 border-b-2 hover:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2">
                  <a href="https://github.com/manuTech0" target="_blank" title="redirect to github" aria-label="redirect to github">
                    <GithubIcon />
                  </a>
                </li>
                <li className="border-gray-700 border-b-2 hover:text-yellow-400 cursor-pointer transform-gpu hover:-translate-y-2">
                  <a
                    href="mailto:maulananurfanoto10@gmail.com"
                    target="_blank"
                    title="redirect to manu email"
                    aria-label="redirect to manu email"
                  >
                    <Mail />
                  </a>
                </li>
              </ul>
            </motion.div>
          </motion.div>
        )}
      </div>
    </>
  );
}
export default App;