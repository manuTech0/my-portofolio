import React, { useEffect } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

type AdaptiveImageProps = HTMLMotionProps<"img"> & {
  baseName: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
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
  const sources = {
    360: `/${baseName}-360.webp`,
    600: `/${baseName}-600.webp`,
    1354: `/${baseName}-1354.webp`,
    1440: `/${baseName}-1440.webp`,
  };

  useEffect(() => {
    const width = window.innerWidth;
    let preloadHref = sources[360];

    if (width > 600 && width <= 1200) preloadHref = sources[600];
    else if (width > 1200 && width <= 1440) preloadHref = sources[1354];
    else if (width > 1440) preloadHref = sources[1440];

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = preloadHref;
    link.type = "image/webp";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [baseName, priority]);

  return (
    <motion.img
      {...rest}
      alt={alt}
      src={sources[width <= 600 ? 600 : width <= 1354 ? 1354 : 1440]}
      srcSet={`
        ${sources[360]} 360w,
        ${sources[600]} 600w,
        ${sources[1354]} 1354w,
        ${sources[1440]} 1440w
      `}
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

export default AdaptiveImage;
