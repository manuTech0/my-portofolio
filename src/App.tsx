import React, {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  useMemo,
  useCallback
} from "react";
import Navbar from "./Navbar";
import { GithubIcon, Loader, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import type { componentsRef } from "./lib/types";
import { Toaster } from "./components/ui/sonner";

// Lazy load components
const Home = lazy(() => import("./contentComponents/home"));
const About = lazy(() => import("./contentComponents/about"));
const Projects = lazy(() => import("./contentComponents/project"));
const Contact = lazy(() => import("./contentComponents/contact"));

// Loading component untuk reuse
const LoadingScreen = () => (
  <div className="h-dvh w-screen z-[200] bg-color-gradient absolute top-0 left-0 flex justify-center items-center flex-col">
    <div className="animate-bounce">
      <h1 className="flex">
        <Loader className="animate-spin me-2" />
        <span className="typing-dots">Loading</span>
      </h1>
    </div>
    <p>We're getting things ready. Please hold on.</p>
  </div>
);

function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const divRef = useRef<HTMLDivElement | null>(null);
  
  // Refs harus di top level, bukan di dalam useMemo
  const homeRef = useRef<HTMLElement | null>(null);
  const aboutRef = useRef<HTMLElement | null>(null);
  const projectsRef = useRef<HTMLElement | null>(null);
  const contactRef = useRef<HTMLElement | null>(null);
  
  // Memoize object refs
  const componentsRef: componentsRef = useMemo(() => ({
    homeRef,
    aboutRef,
    projectsRef,
    contactRef,
  }), []);

  // Preload components
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

  const readyToShow = isLoaded && !isPending;

  // Scroll to component - memoize dengan useCallback
  const scrollToComponents = useCallback((ref: React.RefObject<HTMLElement | null>) => {
    if (!ref.current) return;
    const targetY = ref.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: targetY - 50,
      behavior: "smooth"
    });
  }, []);

  // Optimized scroll sync
  useLayoutEffect(() => {
    const div = divRef.current;
    if (!div || !readyToShow) return;

    let rafId: number | null = null;
    let resizeTimer: number | null = null;

    // Update body height
    const updateBodyHeight = () => {
      document.body.style.height = `${div.scrollHeight + 300}px`;
    };

    // Sync scroll dengan RAF throttling
    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        div.scrollTop = window.scrollY;
        rafId = null;
      });
    };

    // Smooth scroll dengan easing
    const scrollToHash = (hash: string) => {
      const el = div.querySelector(hash) as HTMLElement | null;
      if (!el) return;

      const startY = div.scrollTop;
      const targetY = el.offsetTop;
      const diff = targetY - startY;
      const startTime = performance.now();
      const duration = 400;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease in-out quad
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        div.scrollTop = startY + diff * easeProgress;
        
        if (progress < 1) requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    };

    // Event delegation untuk anchor clicks
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a[href^="#"]') as HTMLAnchorElement;
      if (!anchor?.hash) return;
      
      const el = div.querySelector(anchor.hash);
      if (!el) return;

      e.preventDefault();
      scrollToHash(anchor.hash);
      history.pushState(null, '', anchor.hash);
    };

    // Debounced resize handler
    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateBodyHeight();
        if (location.hash) scrollToHash(location.hash);
      }, 150);
    };

    // Setup observers
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(div);

    const mutationObserver = new MutationObserver(updateBodyHeight);
    mutationObserver.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Initial setup
    updateBodyHeight();
    if (location.hash) {
      requestAnimationFrame(() => scrollToHash(location.hash));
    }

    // Event listeners dengan passive
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleAnchorClick);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleAnchorClick);
      document.body.style.height = 'auto';
      if (resizeTimer) clearTimeout(resizeTimer);
      if (rafId) cancelAnimationFrame(rafId);
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
        <meta name="keywords" content="Maulana Nurfanoto, web developer, React developer, Next.js developer" />
        <meta property="twitter:title" content="Maulana N | Portofolio" />
        <meta property="twitter:description" content="Portofolio Maulana Nurfanoto, Backend Specialist and IT Consultant" />
        <meta property="twitter:image" content="https://www.manu-tech.my.id/my-avatar-600.webp" />
        <meta property="twitter:card" content="https://www.manu-tech.my.id/my-avatar-1354.webp" />
        <link rel="canonical" href="https://www.manu-tech.my.id/" />
        
        {/* Font preloads */}
        <link rel="preload" href="/fonts/ChocolateClassicalSans.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/Poppins.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/Sriracha.woff2" as="font" type="font/woff2" crossOrigin="" />
        
        {/* Critical images preload */}
        <link rel="preload" as="image" href="/corner-ts.svg" type="image/svg+xml" fetchPriority="high" />
        <link rel="preload" as="image" href="/corner-be.svg" type="image/svg+xml" fetchPriority="high" />
      </Helmet>

      <Toaster position="top-center" />

      <div className="lg:px-10 md:px-10 bg-color-gradient fixed top-0 left-0 w-screen min-h-dvh">
        {!readyToShow ? (
          <LoadingScreen />
        ) : (
          <motion.div
            className="h-dvh w-full px-10 pb-7 pt-5 flex flex-col"
            style={{ backgroundImage: `url("/corner-ts.svg")`, backgroundRepeat: "no-repeat" }}
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
              <Suspense fallback={<LoadingScreen />}>
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
                  <a href="mailto:maulananurfanoto10@gmail.com" target="_blank" title="redirect to manu email" aria-label="redirect to manu email">
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
