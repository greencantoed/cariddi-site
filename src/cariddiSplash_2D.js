// src/cariddiSplash_2D.js (Two-Phase Animation - Finalized Large Spiral Loop)

import { gsap } from 'gsap';

console.log("CariddiSplash_2D.js: Script loaded (Two-Phase - Finalized Large Spiral Loop)");

export function initCariddiSplash2D({
  splashScreenSelector = '#splash-screen',
  initialContentSelector = '#initial-splash-content', 
  svgImageSelector = '#splash-svg-image',
  textOverlaySelector = '#splash-text-overlay', // Original text
  rightPaneSelector = '#right-pane-content', 

  phaseOneDuration = 5, 
  
  spinDuration = 12, 
  pulsateAmplitude = 0.1, // Pulsation relative to current scale
  pulsatePeriod = 1.8, 
  
  textFadeInDelay = 1.0, 
  textFadeInDuration = 1.5,

  transitionDuration = 3.0 
} = {}) {

  console.log("CariddiSplash_2D.js: initCariddiSplash2D (Finalized Large Spiral Loop) called");

  const splashScreen = document.querySelector(splashScreenSelector);
  const initialContent = document.querySelector(initialContentSelector);
  const svgImage = document.querySelector(svgImageSelector);
  const textOverlay = document.querySelector(textOverlaySelector); // Original "CARIDDI PRODUCTIONS" text
  const rightPane = document.querySelector(rightPaneSelector);

  if (!splashScreen || !initialContent || !svgImage || !textOverlay || !rightPane) {
    console.error('CariddiSplash_2D.js: Critical DOM elements not found for two-phase animation.');
    if (splashScreen) {
        splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: Splash elements missing.</p>";
    }
    return;
  }
  console.log("CariddiSplash_2D.js: All critical DOM elements found.");

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.warn('CariddiSplash_2D.js: Reduced motion preferred. Static display (Phase 1 only).');
    gsap.set(svgImage, { opacity: 1, scale: 1 }); 
    gsap.set(textOverlay, { opacity: 1 });
    gsap.set(initialContent, { x: 0, width: "100%"}); 
    gsap.set(rightPane, { opacity: 0, width: "0%" }); 
    return;
  }
  console.log("CariddiSplash_2D.js: Proceeding with 2D animations.");

  gsap.set(svgImage, { transformOrigin: "center center", filter: "brightness(100%) saturate(100%)" }); 

  // Phase 1: Initial centered animation 
  // Continuous Spin Animation (will persist)
  gsap.to(svgImage, {
    rotation: "+=360", 
    duration: spinDuration,
    ease: "none",
    repeat: -1,
    id: "initialSpin" // Give it an ID to potentially kill later if needed (not necessary here)
  });

  // Initial Pulsate Animation (will be killed and replaced in Phase 2)
  let initialPulsateTween = gsap.to(svgImage, {
    scale: 1 + pulsateAmplitude, // Relative to its current scale (which is 1 initially)
    duration: pulsatePeriod / 2,
    ease: "sine.inOut",
    yoyo: true, 
    repeat: -1,
    id: "initialPulsate"
  });

  // Fade in original text overlay
  if (textOverlay) {
    const companyNameEl = textOverlay.querySelector('.company-name');
    const locationEl = textOverlay.querySelector('.location');
    const initialTextTl = gsap.timeline();
    if (companyNameEl) {
      initialTextTl.fromTo(companyNameEl, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: textFadeInDuration, ease: "power2.out" },
        textFadeInDelay
      );
    }
    if (locationEl) {
      initialTextTl.fromTo(locationEl, 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: textFadeInDuration, ease: "power2.out" },
        textFadeInDelay + 0.3 
      );
    }
  }
  console.log("CariddiSplash_2D.js: Phase 1 animations configured.");

  // Phase 2: Transition after phaseOneDuration
  gsap.delayedCall(phaseOneDuration, () => {
    console.log("CariddiSplash_2D.js: Initiating Phase 2 - Transition to split screen.");
    
    // Kill the initial pulsation before starting new scale animations
    if (initialPulsateTween) {
      initialPulsateTween.kill();
      console.log("CariddiSplash_2D.js: Initial pulsation tween killed.");
    }
    
    const tlPhase2 = gsap.timeline({
      defaults: { duration: transitionDuration, ease: "power3.inOut" } 
    });

    gsap.set(splashScreen, { display: 'flex', justifyContent: 'flex-start', alignItems: 'stretch' });
    gsap.set(initialContent, { position: 'relative', width: '100%', height: '100%', x: '0%' }); 
    gsap.set(rightPane, { position: 'relative', width: '0%', height: '100%', opacity: 0, x: '0%' }); 

    const targetSpiralScale = 3.0; // The new base scale for the spiral

    tlPhase2
      .to(initialContent, { 
        width: "35%", 
      }, 0)
      .to(svgImage, { 
        scale: targetSpiralScale, // Zoom to the new target base scale
        filter: "brightness(130%) saturate(60%) opacity(90%)", 
        ease: "power2.out" 
      }, 0)
      .to(textOverlay, { // Original "CARIDDI PRODUCTIONS" text
        opacity: 0, // Fade out completely
        scale: 0.5, // Shrink it as it fades
        y: "-=20", 
        ease: "power2.inOut",
        onComplete: () => {
          gsap.set(textOverlay, { display: "none" }); // Hide it completely after fading
          console.log("CariddiSplash_2D.js: Original text overlay hidden.");
        }
      }, 0) // Start fading out original text immediately with the transition
      .to(rightPane, { 
        width: "65%", 
        opacity: 1,
      }, 0);

    // After the transition, re-initialize pulsation based on the new targetSpiralScale
    tlPhase2.call(() => {
      console.log("CariddiSplash_2D.js: Re-initializing pulsation for enlarged spiral.");
      gsap.to(svgImage, {
        // Pulsate relative to the new targetSpiralScale
        scale: () => targetSpiralScale * (1 + pulsateAmplitude), 
        duration: pulsatePeriod / 2,
        ease: "sine.inOut",
        yoyo: true, 
        repeat: -1,
        id: "enlargedPulsate"
      });
    }, [], `+=${transitionDuration * 0.1}`); // Call this slightly after transition starts, or at its end: `transitionDuration`

    console.log("CariddiSplash_2D.js: Phase 2 transition animations configured.");
  });
  
  console.log("CariddiSplash_2D.js: initCariddiSplash2D (Finalized Large Spiral Loop) finished setup.");
}
