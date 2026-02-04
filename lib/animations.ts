import { useEffect, useRef, useState, useCallback } from 'react'

// Lenis smooth scroll setup
let lenis: any = null

export const initSmoothScroll = () => {
  if (typeof window !== 'undefined' && !lenis) {
    import('lenis').then((Lenis) => {
      lenis.create({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 0.865 / t),
        direction: 'vertical', // vertical scrolling for natural feel
        smooth: true,
        smoothTouch: true,
        touchMultiplier: 2
      })
      
      lenis.on('scroll', (e: any) => {
        // Save scroll position for restoration
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('scrollPosition', e.target?.scrollingElement?.scrollTop.toString() || '0')
        }
      })

      // Handle scroll restoration
      if (typeof window !== 'undefined' && sessionStorage.getItem('scrollPosition')) {
        setTimeout(() => {
          const scrollPosition = parseFloat(sessionStorage.getItem('scrollPosition') || '0')
          window.scrollTo({ top: scrollPosition })
        }, 100)
      }

      lenis.on('resize', () => {
        lenis.resize()
      })

      return lenis
    }).catch((error) => {
      console.error('Failed to initialize Lenis:', error)
      // Fallback to simple smooth scrolling
      document.documentElement.style.scrollBehavior = 'smooth'
    })
  }
  
  return lenis
}

// Scroll to top functionality
export const scrollToTop = () => {
  if (lenis) {
    lenis.scrollTo('top', 0)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Scroll to element
export const scrollToElement = (elementId: string) => {
  const element = document.getElementById(elementId)
  if (element) {
    const offset = element.offsetTop - 100
    if (lenis) {
      lenis.scrollTo(offset, 0)
    } else {
      window.scrollTo({ top: offset, behavior: 'smooth' })
    }
  }
}

// Animate on scroll utilities
export const useScrollAnimation = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = useCallback((): void => {
      setScrollY(window.scrollY)
      
      // Show/hide elements based on scroll position
      const scrollThreshold = 100
      const currentScrollY = window.scrollY
      const wasScrollingUp = scrollY < currentScrollY
      
      setIsVisible(currentScrollY > scrollThreshold || wasScrollingUp)
    }, [scrollY])

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { isVisible, scrollY }
}

// Parallax effect for hero sections
export const useParallax = () => {
  const [offset, setOffset] = useState(0)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      setOffset(scrolled * 0.5)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { offset, elementRef }
}

// Reveal animation on scroll
export const useRevealOnScroll = () => {
  const [isRevealed, setIsRevealed] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const element = elementRef.current
      if (element) {
        const rect = element.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0
        
        if (isVisible && !isRevealed) {
          setIsRevealed(true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return { isRevealed, elementRef }
}

// Intersection Observer for animations
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {},
  threshold: number = 0.1
) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold,
        ...options
      }
    )

    observer.observe(element)
    
    return () => {
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold,
        ...options
      }
    )

    observer.observe(element)
    
    return () => {
      observer.disconnect()
    }
  }, [])

  return { isIntersecting, elementRef }
}

// Fade in animation
export const useFadeIn = (
  duration: number = 600,
  delay: number = 0
) => {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    setTimeout(() => {
      setIsVisible(true)
      element.style.opacity = '0'
      element.style.transform = 'translateY(20px)'
      
      setTimeout(() => {
        element.style.transition = `opacity ${duration}ms, transform ${duration}ms`
        element.style.opacity = '1'
        element.style.transform = 'translateY(0)'
      }, 50)
    }, delay)
  }, [])

  return { isVisible, elementRef }
}

// Scale animation
export const useScale = (
  triggerScale: number = 1.05,
  duration: number = 300
) => {
  const [scale, setScale] = useState(1)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleMouseEnter = () => {
      setScale(triggerScale)
      element.style.transition = `transform ${duration}ms`
    }

    const handleMouseLeave = () => {
      setScale(1)
      element.style.transition = `transform ${duration}ms`
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return { scale, elementRef }
}

// Slide up animation
export const useSlideUp = (
  delay: number = 0,
  distance: number = 30
) => {
  const [hasAnimated, setHasAnimated] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    setTimeout(() => {
      setHasAnimated(true)
      element.style.transition = `transform 0.6s ease-out`
      element.style.transform = 'translateY(0)'
      
      setTimeout(() => {
        element.style.transform = `translateY(-${distance}px)`
      }, 50)
      
      setTimeout(() => {
        element.style.transform = 'translateY(0)'
        setHasAnimated(false)
      }, 600)
    }, delay)
  }, [])

  return { hasAnimated, elementRef }
}

// Typewriter effect for text
export const useTypewriter = (
  text: string,
  speed: number = 50
) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (text && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentIndex(prev => prev + 1)
        setDisplayedText(text.slice(0, currentIndex + 1))
      }, speed)
    } else {
      setCurrentIndex(text.length)
      setDisplayedText(text)
    }
  }, [text, speed])

  return { displayedText }
}

export const useTypingText = (
  text: string,
  speed: number = 50
) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (text && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [text, currentIndex])

  return { displayedText }
}

// Stagger animation for multiple elements
export const useStagger = (
  itemCount: number,
  staggerDelay: number = 100
) => {
  const [visibleItems, setVisibleItems] = useState<number[]>([])

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    
    for (let i = 0; i < itemCount; i++) {
      timeouts[i] = setTimeout(() => {
        setVisibleItems(prev => [...prev, i])
      }, staggerDelay * i)
    }
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return { visibleItems }
}

// Loading skeleton animation
export const useSkeletonLoading = (isLoading: boolean) => {
  const [skeletonItems, setSkeletonItems] = useState<number[]>([])

  useEffect(() => {
    if (isLoading) {
      const items = Array.from({ length: 5 }, (_, i) => i)
      setSkeletonItems(items)
    } else {
      setSkeletonItems([])
    }
  }, [isLoading])

  return { skeletonItems }
}

// Page transition animation
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [mountAnimation, setMountAnimation] = useState(false)

  useEffect(() => {
    setIsTransitioning(true)
    
    // Mount animation
    const mountTimeout = setTimeout(() => {
      setMountAnimation(true)
    }, 100)
    
    // Complete transition
    const completeTimeout = setTimeout(() => {
      setIsTransitioning(false)
      setMountAnimation(false)
    }, 600)
    
    return () => {
      clearTimeout(mountTimeout)
      clearTimeout(completeTimeout)
    }
  }, [])

  return { isTransitioning, mountAnimation }
}