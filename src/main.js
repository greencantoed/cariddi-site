
import './style.css'; // Imports global styles from src/style.css
import { initCariddiSplash } from './cariddiSplash.js';

// Initialize the splash screen
// You can override default parameters here if needed
initCariddiSplash({
  // Example: Make animation slightly faster and pulsation more subtle
  // animationDuration: 4.5,
  // pulsateAmplitude: 0.04,
  // pulsatePeriod: 2.0
});