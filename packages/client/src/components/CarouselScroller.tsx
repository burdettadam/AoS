import React, { useRef, useEffect, useCallback } from 'react';
import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';

console.log('CarouselScroller component initialized.');

interface CarouselScrollerProps<T> {
  items: T[];
  renderSlide: (item: T, index: number) => React.ReactNode;
  selectedIdx?: number;
  onSelect?: (index: number) => void;
  className?: string;
  centered?: boolean;
  loop?: boolean;
  slidesPerView?: number;
}

export function CarouselScroller<T>({
  items,
  renderSlide,
  selectedIdx,
  onSelect,
  className,
  centered = false,
  loop = false,
  slidesPerView = 1
}: CarouselScrollerProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const internalSelected = useRef<number>(selectedIdx ?? 0);
  if (selectedIdx !== undefined) internalSelected.current = selectedIdx; // keep in sync
  const sliderReady = useRef(false);
  const pendingSelection = useRef<number | null>(null);
  const programmaticChange = useRef(false); // Flag to prevent slideChanged interference

  const changeSelection = (next: number) => {
    console.log('changeSelection called with target index:', next);
    if (items.length === 0) {
      console.log('No items available, exiting changeSelection.');
      return;
    }
    const total = items.length;
    let target = ((next % total) + total) % total; // wrap
    console.log('Calculated target index:', target);
    
    // Set flag to prevent slideChanged from interfering
    programmaticChange.current = true;
    
    if (onSelect) {
      console.log('Calling onSelect with target index:', target);
      onSelect(target);
    } else {
      internalSelected.current = target;
      console.log('Updated internalSelected to:', internalSelected.current);
    }
    if (!sliderReady.current || !slider.current) {
      console.log('Slider not ready, queuing pending selection:', target);
      pendingSelection.current = target;
      return;
    }
    if (centered) {
      console.log('Centering on target index:', target);
      centerOn(target);
    } else {
      console.log('Moving slider to target index:', target);
      slider.current.moveToIdx(target, false);
    }
    
    // Clear the flag after a short delay to allow animation to complete
    setTimeout(() => {
      programmaticChange.current = false;
    }, 1000);
  };

  const centerOn = (target: number) => {
    console.log('centerOn called with target index:', target);
    if (!slider.current || !sliderReady.current) {
      console.log('Slider not ready, exiting centerOn.');
      return;
    }
    const offset = Math.floor(slidesPerView / 2);
    let base = target - offset;
    
    // Handle wraparound properly for loop mode
    if (loop && items.length > 0) {
      const total = items.length;
      // Ensure base is within valid range [0, total-1]
      base = ((base % total) + total) % total;
    } else if (base < 0) {
      console.log('Base index negative, clamping to 0. Previous base:', base);
      base = 0;
    }
    
    console.log('Moving slider to base index for centering:', base, 'Target:', target, 'Offset:', offset, 'Total items:', items.length);
    slider.current.moveToIdx(base, false);
  };

  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop,
    slides: {
      perView: slidesPerView,
      spacing: 16,
      // Keep origin auto; we'll manually center a chosen slide so that ANY slide can be centered
      origin: 'auto',
    },
    mode: 'free-snap',
    renderMode: 'precision',
    created() {
      console.log('Slider created.');
      sliderReady.current = true;
      // If an external selection exists or a pending one queued before ready, center it
      const target = selectedIdx !== undefined ? selectedIdx : internalSelected.current;
      pendingSelection.current = null;
      if (centered) {
        console.log('Centering on initial target index:', target);
        centerOn(target);
      }
    },
    slideChanged(s) {
      const rel = s.track.details.rel; // relative index within original set
      console.log('Slide changed, new relative index:', rel);
      
      // Don't override internalSelected during programmatic changes (keyboard navigation)
      if (selectedIdx === undefined && !programmaticChange.current) {
        internalSelected.current = rel;
        console.log('Updated internalSelected to:', internalSelected.current);
      } else if (programmaticChange.current) {
        console.log('Ignoring slide change during programmatic navigation');
      }
      // Only center if this change was not triggered by our changeSelection
      // This prevents animation loops when centering
    },
    destroyed() {
      console.log('Slider destroyed.');
      sliderReady.current = false;
    }
  });

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('KeyDown event triggered:', e.key);
      console.log('Current selectedIdx:', selectedIdx, 'Internal selected:', internalSelected.current, 'Slider ready:', sliderReady.current);
    }
    
    const current = selectedIdx !== undefined ? selectedIdx : internalSelected.current;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (process.env.NODE_ENV === 'development') {
        console.log('ArrowLeft pressed, changing selection to:', current - 1);
      }
      changeSelection(current - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (process.env.NODE_ENV === 'development') {
        console.log('ArrowRight pressed, changing selection to:', current + 1);
      }
      changeSelection(current + 1);
    }
  }, [selectedIdx, changeSelection]);

  // Center external selectedIdx when it changes
  useEffect(() => {
    if (selectedIdx === undefined) {
      console.log('Uncontrolled mode, skipping external selectedIdx handling.');
      return;
    }
    if (!slider.current || !slider.current.track?.details) {
      console.log('Slider or track details are not ready, queuing pending selection:', selectedIdx);
      pendingSelection.current = selectedIdx;
      return;
    }
    console.log('Centering on external selectedIdx:', selectedIdx);
    if (centered) centerOn(selectedIdx); else slider.current.moveToIdx(selectedIdx, false);
  }, [selectedIdx, centered]);

  // Mouse wheel scrolling with threshold accumulation for smoother feel
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !slider.current) {
      console.log('Container or slider is not ready for wheel handling.');
      return;
    }
    let accum = 0;
    const threshold = 40; // pixels needed to advance one slide

    const handleWheel = (e: WheelEvent) => {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      accum += delta;
      console.log('Wheel event delta:', delta, 'Accumulated delta:', accum);
      if (Math.abs(accum) >= threshold) {
        const dir = accum > 0 ? 1 : -1;
        // Use visible relative index (view position) for pure scrolling
        const rel = slider.current?.track?.details?.rel ?? (selectedIdx !== undefined ? selectedIdx : internalSelected.current);
        const total = items.length || 1;
        const targetViewIdx = ((rel + dir) % total + total) % total;
        console.log('Threshold reached - wheel scrolling view only.', 'Direction:', dir, 'From view index:', rel, 'To view index:', targetViewIdx);
        // Direct movement WITHOUT changeSelection => no logical selection change / centering
        slider.current?.moveToIdx(targetViewIdx, true);
        accum = 0;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      console.log('Removing wheel event listener.');
      el.removeEventListener('wheel', handleWheel);
    };
  }, [slider, selectedIdx, items.length]);

  // If a pending selection exists once ready, apply it
  useEffect(() => {
    if (sliderReady.current && pendingSelection.current !== null) {
      const target = pendingSelection.current;
      console.log('Applying pending selection:', target);
      pendingSelection.current = null;
      if (centered) centerOn(target); else slider.current?.moveToIdx(target, false);
    }
  }, [sliderReady.current]);

  // Re-initialize slider on container resize
  useEffect(() => {
    if (!containerRef.current || !slider.current) {
      console.log('Container or slider is not ready for resize observer.');
      return;
    }
    const observer = new window.ResizeObserver(() => {
      console.log('Resize observer triggered, updating slider.');
      slider.current?.update();
    });
    observer.observe(containerRef.current);
    return () => {
      console.log('Disconnecting resize observer.');
      observer.disconnect();
    };
  }, [slider]);

  // Focus carousel container on click or mouse enter for keyboard navigation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      console.log('Container is not ready for focus handling.');
      return;
    }
    const handleFocus = () => {
      console.log('Container focused.');
      el.focus();
    };
    el.addEventListener('mouseenter', handleFocus);
    el.addEventListener('click', handleFocus);
    return () => {
      console.log('Removing focus event listeners.');
      el.removeEventListener('mouseenter', handleFocus);
      el.removeEventListener('click', handleFocus);
    };
  }, []);

  return (
    <div
      className={`relative w-full focus:outline focus:outline-2 focus:outline-blue-400 ${className || ''}`}
      ref={containerRef}
      tabIndex={0}
      onMouseEnter={() => containerRef.current?.focus()}
    >
      {/* Left Arrow */}
      <button
        type="button"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/80 hover:bg-clocktower-dark/90 border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl text-gray-300 shadow-lg"
        style={{ marginLeft: '4px' }}
        onClick={() => changeSelection((selectedIdx !== undefined ? selectedIdx : internalSelected.current) - 1)}
        aria-label="Scroll left"
        disabled={!sliderReady.current}
      >
        &#8592;
      </button>

      {/* Carousel */}
            <div 
        ref={sliderRef} 
        className="keen-slider carousel-scroller"
        role="listbox"
        aria-label={`${items.length} items carousel`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {(items as any[]).map((item: any, idx: number) => {
          const isSelected = (selectedIdx !== undefined ? selectedIdx : internalSelected.current) === idx;
          return (
          <div
            className={`keen-slider__slide flex items-center justify-center ${isSelected ? 'ring-2 ring-clocktower-accent scale-[1.03]' : 'opacity-90 hover:opacity-100'}`}
            key={idx}
            tabIndex={-1}
            onClick={() => changeSelection(idx)}
            style={{ transition: 'none' }}
            role="option"
            aria-selected={(selectedIdx !== undefined ? selectedIdx : internalSelected.current) === idx}
          >
                        {renderSlide(item, idx)}
          </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      <button
        type="button"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-clocktower-dark/80 hover:bg-clocktower-dark/90 border border-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-2xl text-gray-300 shadow-lg"
        style={{ marginRight: '4px' }}
        onClick={() => changeSelection((selectedIdx !== undefined ? selectedIdx : internalSelected.current) + 1)}
        aria-label="Scroll right"
        disabled={!sliderReady.current}
      >
        &#8594;
      </button>
    </div>
  );
}
