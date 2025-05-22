import './style.css'; // Your existing global styles
import { initCariddiSplash } from './cariddiSplash.js';

// Initialize the splash screen
initCariddiSplash({
  splashContainerSelector: '#splash-container', // The new overall splash container
  spiralContainerSelector: '#splash-top-left',  // Where the WebGL canvas should go
  siteSelector : '#site',                       // Your main site content to reveal
  spiralSVG    : '/cariddi-spiral.svg',         // Path to your SVG (ensure it's in /public)
  duration     : 5.5,                           // Overall duration of the intro animation
  pulsateScale : 0.1,                           // How much the spiral scales during pulsation (e.g., 10%)
  pulsateSpeed : 1.2                            // Seconds for one full pulsate cycle (in-out)
});