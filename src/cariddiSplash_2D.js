// src/cariddiSplash_2D.js (Guidelines Redesign - Autopsy Fixes with Improved Error Logging)

import { gsap } from 'gsap';

console.log("CariddiSplash_2D.js: Script loaded (Guidelines Redesign - Autopsy Fixes v2)");

export function initCariddiSplash2D({
  heroSelector = '#hero-section',
  leftPaneSelector = '#left-hero-pane',
  rightPaneSelector = '#right-hero-pane',
  svgImageSelector = '#splash-svg-image',
  
  // Specific elements for staggered animation in left pane
  logoSelector = '.logo-hero', 
  primaryNavSelector = '#primary-nav', 
  headlineSelector = '.headline-h1', 
  taglineSelector = '.tagline',
  ctaButtonSelector = '#cta-button',
  
  entryAnimationDuration = 1.8, 
  staggerAmount = 0.15, 

  spinDuration = 18, 
  pulsateAmplitude = 0.06, 
  pulsatePeriod = 2.2, 
} = {}) {

  console.log("CariddiSplash_2D.js: initCariddiSplash2D (Guidelines Autopsy Fixes v2) called");

  // Store selectors for easier logging
  const selectors = {
    heroSection: heroSelector,
    leftPane: leftPaneSelector,
    rightPane: rightPaneSelector,
    svgImage: svgImageSelector,
    logo: logoSelector,
    primaryNav: primaryNavSelector,
    headline: headlineSelector,
    tagline: taglineSelector,
    ctaButton: ctaButtonSelector
  };

  // Select all elements
  const elements = {
    heroSection: document.querySelector(selectors.heroSection),
    leftPane: document.querySelector(selectors.leftPane),
    rightPane: document.querySelector(selectors.rightPane),
    svgImage: document.querySelector(selectors.svgImage),
    logo: document.querySelector(selectors.logo),
    primaryNav: document.querySelector(selectors.primaryNav),
    headline: document.querySelector(selectors.headline),
    tagline: document.querySelector(selectors.tagline),
    ctaButton: document.querySelector(selectors.ctaButton)
  };
  
  let allElementsFound = true;
  for (const key in elements) {
    if (!elements[key]) {
      console.error(`CariddiSplash_2D.js: CRITICAL ERROR - Element with selector '${selectors[key]}' (for key: ${key}) not found in the DOM.`);
      allElementsFound = false;
    }
  }

  if (!allElementsFound) {
    // Try to display an error message on the page if possible
    const hero = elements.heroSection || document.body; // Fallback to body if heroSection itself is missing
    if (hero) {
        hero.innerHTML = "<p style='color:var(--sand); text-align:center; padding: 20vh 20px; font-size: 1.2em;'>Error: A critical page element is missing. Please check the browser console (F12) for details (look for 'CRITICAL ERROR').</p>";
    }
    return; // Stop execution
  }

  console.log("CariddiSplash_2D.js: All critical DOM elements successfully found.");


  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.warn('CariddiSplash_2D.js: Reduced motion preferred. Static display.');
    // Set opacity for all found elements directly
    Object.values(elements).forEach(el => gsap.set(el, { opacity: 1, y: 0, x:0 }));
    // Ensure panes are visible if they were initially set to x: "-100%" etc.
    gsap.set(elements.leftPane, { x: "0%" });
    gsap.set(elements.rightPane, { x: "0%" });
    return;
  }
  console.log("CariddiSplash_2D.js: Proceeding with animations.");

  // Initial states for animation
  gsap.set(elements.svgImage, { transformOrigin: "center center", scale: 0.7, opacity:0 });
  gsap.set(elements.leftPane, {opacity: 1, x: "-100%"}); // Opacity 1 so it's visible once x is 0
  gsap.set(elements.rightPane, {opacity: 1, x: "100%"}); // Opacity 1 so it's visible once x is 0
  
  // Staggered elements within left pane
  gsap.set([elements.logo, elements.primaryNav, elements.headline, elements.tagline, elements.ctaButton], { opacity: 0, y: 40 });


  // Entrance Animation Timeline
  const entryTl = gsap.timeline({
    defaults: { duration: entryAnimationDuration, ease: "power3.out" }
  });

  entryTl
    .to(elements.leftPane, { x: "0%" }, 0)
    .to(elements.rightPane, { x: "0%" }, 0.1) 
    .to(elements.svgImage, { 
        scale: 1, 
        opacity: 1, 
        duration: entryAnimationDuration * 0.8, 
        ease: "elastic.out(1, 0.6)" 
    }, staggerAmount * 1.5) 
    .to(elements.logo, { opacity: 1, y: 0 }, staggerAmount * 2)
    .to(elements.primaryNav, { opacity: 1, y: 0 }, staggerAmount * 2.5)
    .to(elements.headline, { opacity: 1, y: 0 }, staggerAmount * 3)
    .to(elements.tagline, { opacity: 1, y: 0 }, staggerAmount * 3.5)
    .to(elements.ctaButton, { opacity: 1, y: 0 }, staggerAmount * 4);

  console.log("CariddiSplash_2D.js: Entrance animations configured.");

  // Continuous animations for the spiral
  gsap.to(elements.svgImage, {
    rotation: "+=360", 
    duration: spinDuration,
    ease: "none",
    repeat: -1,
    delay: entryAnimationDuration * 0.5 
  });

  gsap.to(elements.svgImage, {
    scale: `+=${pulsateAmplitude}`, 
    transformOrigin: "center center",
    duration: pulsatePeriod / 2,
    ease: "sine.inOut",
    yoyo: true, 
    repeat: -1,
    delay: entryAnimationDuration * 0.5 
  });
  
  console.log("CariddiSplash_2D.js: Continuous spiral animations configured.");
  console.log("CariddiSplash_2D.js: initCariddiSplash2D (Guidelines Autopsy Fixes v2) finished setup.");
}
