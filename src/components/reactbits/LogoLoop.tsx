"use client";

import React, { CSSProperties, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

// Docs-aligned logo item union
type LogoNodeItem = {
  node: ReactNode;
  title?: string;
  href?: string;
};

type LogoImageItem = {
  src: string;
  alt: string;
  title?: string;
  href?: string;
};

export type LogoItem = LogoNodeItem | LogoImageItem;

// Docs-aligned props
export interface LogoLoopProps {
  logos: LogoItem[];
  speed?: number; // px per second scrolling speed
  direction?: 'left' | 'right';
  logoHeight?: number; // px
  gap?: number; // px between logos
  pauseOnHover?: boolean;
  scaleOnHover?: boolean;
  fadeOut?: boolean;
  fadeOutColor?: string; // background color used for fade mask
  ariaLabel?: string;
  className?: string;

  // Back-compat (mapped):
  height?: number;
  speedSec?: number; // previously duration in seconds
  grayscale?: boolean; // when true, images were gray; we keep the effect
}

export default function LogoLoop(props: LogoLoopProps) {
  const {
    logos,
    // New API defaults
    speed = 100,
    direction = 'left',
    logoHeight: logoHeightProp,
    gap = 20,
    pauseOnHover = true,
    scaleOnHover = true,
    fadeOut = true,
    fadeOutColor = '#f8f8f8',
    ariaLabel = 'Our clients',
    className = '',
    // Back-compat
    height,
    speedSec,
    grayscale = false,
  } = props;

  // Back-compat mapping
  const logoHeight = logoHeightProp ?? height ?? 40;

  // Measure content width to compute duration when speedSec not provided
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);

  useEffect(() => {
    if (!trackRef.current) return;
    const el = trackRef.current;
    const measure = () => setContentWidth(el.scrollWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [logos, gap]);

  // Compute animation duration: time to move half (one track width) at given speed
  // If legacy speedSec provided, prefer that as exact duration
  const durationSec = useMemo(() => {
    if (typeof speedSec === 'number' && speedSec > 0) return speedSec;
    if (!contentWidth || speed <= 0) return 30; // sensible fallback
    // We translate by 50% (one track), which equals half of combined width
    const halfWidthPx = contentWidth / 2;
    return halfWidthPx / speed; // seconds
  }, [contentWidth, speed, speedSec]);

  const containerStyle: CSSProperties = useMemo(() => {
    return {};
  }, []);

  const trackBaseStyle: CSSProperties = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: `${gap}px`,
      paddingLeft: `${gap}px`,
      paddingRight: `${gap}px`,
      animation: `logo-loop ${durationSec}s linear infinite`,
      animationDirection: direction === 'right' ? 'reverse' : 'normal',
    }),
    [gap, durationSec, direction]
  );

  const renderItem = (item: LogoItem, key: string) => {
    const content = (
      'node' in item ? (
        <div
          className={combineClassNames(
            'rb-logo-item flex items-center justify-center',
            scaleOnHover ? 'rb-scale-hover' : undefined
          )}
          style={{ height: logoHeight }}
          title={item.title}
        >
          {item.node}
        </div>
      ) : (
        <img
          src={item.src}
          alt={item.alt}
          title={item.title}
          className={combineClassNames(
            'rb-logo-img',
            grayscale ? 'rb-grayscale' : undefined,
            scaleOnHover ? 'rb-scale-hover' : undefined
          )}
          style={{ height: logoHeight, width: 'auto', objectFit: 'contain' }}
        />
      )
    );

    if (item.href) {
      return (
        <a key={key} href={item.href} target="_blank" rel="noreferrer noopener" aria-label={item.title}>
          {content}
        </a>
      );
    }
    return React.cloneElement(<span key={key}>{content}</span>);
  };

  return (
    <div
      className={combineClassNames('relative overflow-hidden', pauseOnHover ? 'rb-pause-group' : undefined, className)}
      style={containerStyle}
      aria-label={ariaLabel}
    >
      <div className="flex" style={{ width: 'max-content' }} ref={trackRef}>
        <div className="shrink-0 rb-track" style={trackBaseStyle}>
          {logos.map((logo, idx) => renderItem(logo, `a-${idx}`))}
        </div>
        <div className="shrink-0 rb-track" style={trackBaseStyle} aria-hidden>
          {logos.map((logo, idx) => renderItem(logo, `b-${idx}`))}
        </div>
      </div>

      <style jsx>{`
        @keyframes logo-loop {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .rb-pause-group:hover .rb-track { animation-play-state: paused; }

        .rb-logo-img { transition: filter 0.2s ease, opacity 0.2s ease, transform 0.2s ease; }
        .rb-grayscale { filter: grayscale(100%); opacity: 0.85; }
        .rb-logo-img:hover, .rb-logo-img:focus-visible { filter: grayscale(0%); opacity: 1; }
        .rb-scale-hover:hover { transform: scale(1.05); }
      `}</style>
    </div>
  );
}

function combineClassNames(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}


