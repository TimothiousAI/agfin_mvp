import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Gesture handler callbacks
 */
export interface GestureHandlers {
  /** Swipe left gesture */
  onSwipeLeft?: () => void;
  /** Swipe right gesture */
  onSwipeRight?: () => void;
  /** Swipe up gesture */
  onSwipeUp?: () => void;
  /** Swipe down gesture */
  onSwipeDown?: () => void;
  /** Pull to refresh (swipe down from top) */
  onPullToRefresh?: () => void;
  /** Pinch to zoom (scale change) */
  onPinchZoom?: (scale: number) => void;
  /** Long press gesture */
  onLongPress?: (x: number, y: number) => void;
  /** Tap gesture */
  onTap?: (x: number, y: number) => void;
  /** Double tap gesture */
  onDoubleTap?: (x: number, y: number) => void;
}

/**
 * Gesture configuration options
 */
export interface GestureOptions {
  /** Minimum swipe distance in pixels (default: 50) */
  swipeThreshold?: number;
  /** Minimum swipe velocity (default: 0.3) */
  swipeVelocity?: number;
  /** Long press duration in ms (default: 500) */
  longPressDuration?: number;
  /** Double tap max delay in ms (default: 300) */
  doubleTapDelay?: number;
  /** Pinch zoom sensitivity (default: 0.01) */
  pinchSensitivity?: number;
  /** Pull to refresh threshold in pixels (default: 80) */
  pullToRefreshThreshold?: number;
}

interface TouchState {
  startX: number;
  startY: number;
  startTime: number;
  lastTapTime: number;
  initialDistance: number;
  currentScale: number;
}

/**
 * Custom hook for touch gesture handling
 *
 * Supports:
 * - Swipe gestures (left, right, up, down)
 * - Pull to refresh
 * - Pinch to zoom
 * - Long press
 * - Tap and double tap
 *
 * @param elementRef - Ref to the element to attach gestures to
 * @param handlers - Gesture handler callbacks
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useGestures(ref, {
 *     onSwipeLeft: () => console.log('Swiped left'),
 *     onSwipeRight: () => console.log('Swiped right'),
 *     onLongPress: (x, y) => console.log('Long press at', x, y),
 *     onPinchZoom: (scale) => console.log('Zoom:', scale),
 *   });
 *
 *   return <div ref={ref}>Swipe me!</div>;
 * }
 * ```
 */
export function useGestures(
  elementRef: RefObject<HTMLElement>,
  handlers: GestureHandlers,
  options: GestureOptions = {}
) {
  const {
    swipeThreshold = 50,
    swipeVelocity = 0.3,
    longPressDuration = 500,
    doubleTapDelay = 300,
    pinchSensitivity = 0.01,
    pullToRefreshThreshold = 80,
  } = options;

  const touchState = useRef<TouchState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTapTime: 0,
    initialDistance: 0,
    currentScale: 1,
  });

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Calculate distance between two touch points
    const getDistance = (touches: TouchList): number => {
      if (touches.length < 2) return 0;
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    // Handle touch start
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const state = touchState.current;

      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.startTime = Date.now();

      // Handle pinch zoom start
      if (e.touches.length === 2) {
        state.initialDistance = getDistance(e.touches);
      }

      // Start long press timer
      if (handlers.onLongPress) {
        longPressTimer.current = setTimeout(() => {
          handlers.onLongPress!(touch.clientX, touch.clientY);
        }, longPressDuration);
      }
    };

    // Handle touch move
    const handleTouchMove = (e: TouchEvent) => {
      const state = touchState.current;

      // Cancel long press if moved
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Handle pinch zoom
      if (e.touches.length === 2 && handlers.onPinchZoom) {
        const currentDistance = getDistance(e.touches);
        if (state.initialDistance > 0) {
          const scale = currentDistance / state.initialDistance;
          state.currentScale = scale;
          handlers.onPinchZoom(scale);
        }
      }

      // Handle pull to refresh (only if at top of scroll)
      if (handlers.onPullToRefresh && element.scrollTop === 0) {
        const touch = e.touches[0];
        const deltaY = touch.clientY - state.startY;

        if (deltaY > pullToRefreshThreshold) {
          // Prevent default to avoid bounce effect
          e.preventDefault();
        }
      }
    };

    // Handle touch end
    const handleTouchEnd = (e: TouchEvent) => {
      const state = touchState.current;
      const touch = e.changedTouches[0];
      const endTime = Date.now();
      const duration = endTime - state.startTime;

      // Cancel long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Calculate swipe distance and velocity
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / duration;

      // Handle pull to refresh
      if (handlers.onPullToRefresh && element.scrollTop === 0 && deltaY > pullToRefreshThreshold) {
        handlers.onPullToRefresh();
        return;
      }

      // Handle swipe gestures
      if (distance >= swipeThreshold && velocity >= swipeVelocity) {
        const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

        // Determine swipe direction based on angle
        if (angle >= -45 && angle < 45) {
          // Swipe right
          handlers.onSwipeRight?.();
        } else if (angle >= 45 && angle < 135) {
          // Swipe down
          handlers.onSwipeDown?.();
        } else if (angle >= -135 && angle < -45) {
          // Swipe up
          handlers.onSwipeUp?.();
        } else {
          // Swipe left
          handlers.onSwipeLeft?.();
        }
        return;
      }

      // Handle tap and double tap
      if (distance < 10 && duration < 200) {
        const timeSinceLastTap = endTime - state.lastTapTime;

        if (timeSinceLastTap < doubleTapDelay && handlers.onDoubleTap) {
          // Double tap
          handlers.onDoubleTap(touch.clientX, touch.clientY);
          state.lastTapTime = 0; // Reset to prevent triple tap
        } else {
          // Single tap (delayed to allow for double tap detection)
          if (handlers.onTap) {
            setTimeout(() => {
              const now = Date.now();
              if (now - state.lastTapTime >= doubleTapDelay) {
                handlers.onTap!(touch.clientX, touch.clientY);
              }
            }, doubleTapDelay);
          }
          state.lastTapTime = endTime;
        }
      }

      // Reset pinch state
      state.initialDistance = 0;
      state.currentScale = 1;
    };

    // Add event listeners (passive: false to allow preventDefault)
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Cleanup
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);

      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [
    elementRef,
    handlers,
    swipeThreshold,
    swipeVelocity,
    longPressDuration,
    doubleTapDelay,
    pinchSensitivity,
    pullToRefreshThreshold,
  ]);
}

/**
 * Simplified swipe-only gesture hook
 *
 * @example
 * ```tsx
 * function Carousel() {
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useSwipeGesture(ref, {
 *     onSwipeLeft: () => nextSlide(),
 *     onSwipeRight: () => prevSlide(),
 *   });
 *
 *   return <div ref={ref}>...</div>;
 * }
 * ```
 */
export function useSwipeGesture(
  elementRef: RefObject<HTMLElement>,
  handlers: Pick<GestureHandlers, 'onSwipeLeft' | 'onSwipeRight' | 'onSwipeUp' | 'onSwipeDown'>,
  options?: Pick<GestureOptions, 'swipeThreshold' | 'swipeVelocity'>
) {
  useGestures(elementRef, handlers, options);
}

/**
 * Long press gesture hook
 *
 * @example
 * ```tsx
 * function ContextMenuTrigger() {
 *   const ref = useRef<HTMLDivElement>(null);
 *
 *   useLongPress(ref, (x, y) => {
 *     showContextMenu(x, y);
 *   });
 *
 *   return <div ref={ref}>Long press me</div>;
 * }
 * ```
 */
export function useLongPress(
  elementRef: RefObject<HTMLElement>,
  onLongPress: (x: number, y: number) => void,
  duration: number = 500
) {
  useGestures(elementRef, { onLongPress }, { longPressDuration: duration });
}
