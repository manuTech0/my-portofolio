import React, { useEffect, useMemo } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type AdaptiveImageProps = HTMLMotionProps<"img"> & {
  baseName: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
};

// Helper untuk get correct source berdasarkan width
const getSourceForWidth = (width: number) => {
  if (width <= 600) return 360;
  if (width <= 1200) return 600;
  if (width <= 1440) return 1354;
  return 1440;
};

const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  baseName,
  alt,
  width = 1440,
  height = 1440,
  priority = false,
  style,
  ...rest
}) => {
  // Memoize sources object
  const sources = useMemo(() => ({
    360: `/${baseName}-360.webp`,
    600: `/${baseName}-600.webp`,
    1354: `/${baseName}-1354.webp`,
    1440: `/${baseName}-1440.webp`,
  }), [baseName]);

  // Memoize srcSet string
  const srcSet = useMemo(() => 
    `${sources[360]} 360w, ${sources[600]} 600w, ${sources[1354]} 1354w, ${sources[1440]} 1440w`,
    [sources]
  );

  // Determine initial source based on viewport
  const initialSrc = useMemo(() => {
    if (typeof window === 'undefined') return sources[1440];
    const sourceKey = getSourceForWidth(window.innerWidth);
    return sources[sourceKey];
  }, [sources]);

  // Preload image if priority - menggunakan native browser preload
  useEffect(() => {
    if (!priority) return;

    const sourceKey = getSourceForWidth(window.innerWidth);
    const preloadHref = sources[sourceKey];

    // Check if already preloaded
    const existingLink = document.querySelector(`link[rel="preload"][href="${preloadHref}"]`);
    if (existingLink) return;

    // Create preload link dengan proper attributes
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = preloadHref;
    link.type = "image/webp";
    
    // Add to head
    document.head.appendChild(link);

    // Cleanup function
    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
    };
  }, [sources, priority]);

  return (
    <motion.img
      {...rest}
      alt={alt}
      src={initialSrc}
      srcSet={srcSet}
      sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
      width={width}
      height={height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      style={{
        objectFit: "cover",
        ...style,
      }}
    />
  );
};

export default React.memo(AdaptiveImage);
