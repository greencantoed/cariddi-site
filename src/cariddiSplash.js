// src/cariddiSplash.js (v6.1 - Infinite Loop & Debug Visibility)

import * as THREE   from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { gsap }      from 'gsap';

console.log("CariddiSplash.js: Script loaded (v6.1 - Infinite Loop - Debug Visibility)");

// Minimal WebGL support check
function webglOK(){
  try {
    const canvas = document.createElement('canvas');
    const result = !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    console.log("CariddiSplash.js: WebGL OK check result:", result);
    return result;
  } catch(e) {
    console.error("CariddiSplash.js: WebGL check failed:", e);
    return false;
  }
}

export function initCariddiSplash({
  splashScreenSelector = '#splash-screen',
  canvasContainerSelector = '#splash-canvas-container',
  textOverlaySelector = '#splash-text-overlay',
  spiralSVG    = '/cariddi-spiral.svg', 
  animationDuration = 7.5, 
  textFadeInDelay = animationDuration * 0.3, 
  pulsateAmplitude = 0.12, 
  pulsatePeriod = 1.7 
} = {}) {

  console.log("CariddiSplash.js: initCariddiSplash called (Infinite Loop - Debug Visibility) with params:", 
    { splashScreenSelector, canvasContainerSelector, textOverlaySelector, spiralSVG });

  // --- DOM Element Checks ---
  const splashScreen = document.querySelector(splashScreenSelector);
  const canvasContainer = document.querySelector(canvasContainerSelector);
  const textOverlay = document.querySelector(textOverlaySelector);

  if (!splashScreen || !canvasContainer || !textOverlay ) { 
    console.error('CariddiSplash.js: Critical DOM elements for splash screen not found.');
    if (splashScreen && splashScreen.parentNode) splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: Splash elements missing.</p>";
    return;
  }
  console.log("CariddiSplash.js: All critical DOM elements found.");

  // --- Fallback for reduced motion or no WebGL ---
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const webGLAvailable = webglOK();
  console.log("CariddiSplash.js: Prefers Reduced Motion:", prefersReducedMotion);

  if (prefersReducedMotion || !webGLAvailable) {
    console.warn('CariddiSplash.js: Reduced motion preferred or WebGL not available. Displaying static text.');
    if(textOverlay) {
        gsap.set(textOverlay, { opacity: 1 }); 
        if (canvasContainer) canvasContainer.style.display = 'none';
    }
    return;
  }
  console.log("CariddiSplash.js: WebGL available and no reduced motion preference detected. Proceeding with animation.");

  // --- Three.js Setup ---
  let renderer, scene, camera, spiralMesh;

  try {
    console.log("CariddiSplash.js: Initializing Three.js renderer...");
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Alpha true for transparent background if needed
    renderer.setPixelRatio(window.devicePixelRatio);
    let containerWidth = canvasContainer.clientWidth;
    let containerHeight = canvasContainer.clientHeight;
    if (!containerWidth || !containerHeight) {
        console.warn("CariddiSplash.js: Canvas container has zero dimensions initially. Using window dimensions.");
        containerWidth = window.innerWidth;
        containerHeight = window.innerHeight;
    }
    console.log(`CariddiSplash.js: Canvas container dimensions: ${containerWidth}x${containerHeight}`);
    renderer.setSize(containerWidth, containerHeight);
    canvasContainer.appendChild(renderer.domElement);
    console.log("CariddiSplash.js: Renderer initialized and canvas appended.");

    console.log("CariddiSplash.js: Initializing Three.js scene and camera...");
    scene = new THREE.Scene();
    // --- DEBUG: Ensure background is not the same as spiral if it's a solid color ---
    // scene.background = new THREE.Color(0x000022); // Dark blue, different from spiral

    camera = new THREE.PerspectiveCamera(50, containerWidth / containerHeight, 0.1, 100); 
    // --- DEBUG: Pull camera back significantly to ensure spiral is in view ---
    camera.position.set(0, 0, 7.0); 
    camera.lookAt(0,0,0); // Ensure it's looking at the origin
    console.log("CariddiSplash.js: Scene and camera initialized. Camera at Z=7");

    console.log("CariddiSplash.js: Adding lights...");
    scene.add(new THREE.AmbientLight(0xffffff, 1.0)); // --- DEBUG: Very bright ambient light ---
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // --- DEBUG: Bright directional ---
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
    console.log("CariddiSplash.js: Lights added (brightened for debug).");

  } catch (error) {
    console.error("CariddiSplash.js: Error initializing Three.js:", error);
    if (splashScreen) splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: Could not initialize 3D graphics.</p>";
    return;
  }

  // --- Load SVG and Create Mesh ---
  console.log("CariddiSplash.js: Attempting to load SVG:", spiralSVG);
  const svgLoader = new SVGLoader();
  svgLoader.load(spiralSVG, (data) => {
    console.log("CariddiSplash.js: SVG data loaded successfully.");
    try {
      console.log("CariddiSplash.js: Processing SVG data into shapes...");
      const shapes = data.paths.flatMap(path => SVGLoader.createShapes(path, { tolerance: 0.05 })); 
      if (shapes.length === 0) {
        console.error("CariddiSplash.js: No shapes extracted from SVG! SVG might be empty or malformed.");
        if (splashScreen) splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: SVG visual is empty.</p>";
        return;
      }
      console.log(`CariddiSplash.js: ${shapes.length} shapes created. Creating ExtrudeGeometry...`);
      const geometry = new THREE.ExtrudeGeometry(shapes, {
        depth: 0.1, // --- DEBUG: Make it thicker ---
        bevelEnabled: false, // --- DEBUG: Disable bevels temporarily ---
        // bevelThickness: 0.01,
        // bevelSize: 0.01,
        // bevelSegments: 2,
        curveSegments: 8 // --- DEBUG: Lower curve segments for simplicity ---
      });
      geometry.computeBoundingBox();
      geometry.center(); 
      console.log("CariddiSplash.js: Geometry created and centered.");

      // Radial attribute for shader (can be removed if shader is simplified for debug)
      // const radialDistances = new Float32Array(geometry.attributes.position.count);
      // for (let i = 0; i < radialDistances.length; i++) {
      //   const x = geometry.attributes.position.getX(i);
      //   const y = geometry.attributes.position.getY(i);
      //   radialDistances[i] = Math.hypot(x, y);
      // }
      // geometry.setAttribute('aR', new THREE.BufferAttribute(radialDistances, 1));
      // console.log("CariddiSplash.js: Radial attributes 'aR' added to geometry.");

      console.log("CariddiSplash.js: Creating ShaderMaterial (DEBUG Simple Opaque)...");
      // --- DEBUG: Use a very simple, bright, opaque material first ---
      const material = new THREE.MeshStandardMaterial({ 
          color: 0x00ff00, // Bright Green
          emissive: 0x003300, // Slight green glow
          roughness: 0.5,
          metalness: 0.1,
          // wireframe: true // Enable to see geometry structure
      }); 
      // const material = new THREE.ShaderMaterial({ // Keep original shader for when debug material works
      //   uniforms: { /* ... */ }, vertexShader: `...`, fragmentShader: `...`
      // });
      console.log("CariddiSplash.js: DEBUG Material created.");

      spiralMesh = new THREE.Mesh(geometry, material);
      const aspect = (canvasContainer.clientWidth || window.innerWidth) / (canvasContainer.clientHeight || window.innerHeight);
      // --- DEBUG: Make initial scale larger and fixed for now ---
      const initialScale = 1.0; // Adjust this value if it's too big/small
      spiralMesh.scale.set(initialScale, initialScale, initialScale);
      scene.add(spiralMesh);
      console.log("CariddiSplash.js: Spiral mesh created, scaled (DEBUG fixed scale), and added to scene.");

      startAnimations();
    } catch (error) {
      console.error("CariddiSplash.js: Error processing SVG or creating mesh:", error);
      if (splashScreen) splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: Could not create 3D spiral.</p>";
    }
  },
  (xhr) => { /* onProgress */ },
  (error) => { 
    console.error('CariddiSplash.js: SVGLoader - Failed to load SVG. Error object:', error);
    if (splashScreen) splashScreen.innerHTML = `<p style='color:white; text-align:center;'>Error: Could not load SVG visual (${spiralSVG}). Check path and file.</p>`;
  });

  // --- GSAP Animations ---
  function startAnimations() {
    console.log("CariddiSplash.js: startAnimations called.");
    if (!spiralMesh) {
      console.error("CariddiSplash.js: startAnimations called but spiralMesh is not ready.");
      if (splashScreen) splashScreen.innerHTML = "<p style='color:white; text-align:center;'>Error: Animation target not ready.</p>";
      return;
    }
    console.log("CariddiSplash.js: spiralMesh is ready. Setting up GSAP timelines.");

    // --- DEBUG: Simplify introTl for visibility testing ---
    const introTl = gsap.timeline({
      // onUpdate: () => { // Not needed if not using uProgress with debug material
      //   if (spiralMesh && spiralMesh.material.uniforms && spiralMesh.material.uniforms.uProgress) { 
      //        spiralMesh.material.uniforms.uProgress.value = introTl.progress();
      //   }
      // },
      repeat: -1, 
      yoyo: true,   
      onRepeat: () => { 
        console.log("CariddiSplash.js: Main animation loop repeated/reversed (DEBUG simple spin).");
      }
    });

    // --- DEBUG: Simple rotation on Z-axis for introTl ---
    introTl.to(spiralMesh.rotation, { 
        z: Math.PI * 2, // One full spin
        duration: animationDuration / 2, // Make it spin over half the "animationDuration"
        ease: "none" 
    });
    // Remove complex camera and scale animations from introTl for now
    // introTl
    //   .fromTo(camera.position, /* ... */ )
    //   .fromTo(camera.rotation, /* ... */ ) 
    //   .fromTo(spiralMesh.rotation, /* ... */ )
    //   .fromTo(spiralMesh.scale, /* ... */ )
    //   .to(spiralMesh.scale, /* ... */ );

    console.log("CariddiSplash.js: GSAP introTl (DEBUG simple spin) configured.");

    // Text fade-in (happens once during the first loop cycle)
    if (textOverlay) { 
        const companyNameEl = textOverlay.querySelector('.company-name');
        const locationEl = textOverlay.querySelector('.location');
        const textTl = gsap.timeline();
        if (companyNameEl) {
            textTl.fromTo(companyNameEl, 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 1.5, ease: "power2.out"},
                textFadeInDelay 
            );
        }
        if (locationEl) {
            textTl.fromTo(locationEl, 
                { opacity: 0, y: 30 }, 
                { opacity: 1, y: 0, duration: 1.5, ease: "power2.out"},
                textFadeInDelay + 0.4 
            );
        }
        console.log("CariddiSplash.js: GSAP text fade-in configured (one-time).");
    } else {
        console.warn("CariddiSplash.js: textOverlay not found for GSAP animation.");
    }

    // Pulsating Animation for the Spiral Mesh (continuous and independent)
    const baseScale = spiralMesh.scale.x; // Assuming uniform scale initially
    gsap.to(spiralMesh.scale, {
      x: () => baseScale * (1 + pulsateAmplitude), 
      y: () => baseScale * (1 + pulsateAmplitude),
      duration: pulsatePeriod / 2,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      delay: 1.0 // --- DEBUG: Start pulsation sooner ---
    });
    console.log("CariddiSplash.js: GSAP spiralMesh.scale (pulsation) configured.");
    console.log("CariddiSplash.js: All animations set up for infinite loop (DEBUG VISIBILITY MODE).");
  }

  // --- Render Loop ---
  function animate() {
    if (!renderer || !scene || !camera) return; 
    
    // uTime update not needed if using MeshStandardMaterial for debug
    // if (spiralMesh && spiralMesh.material.uniforms && spiralMesh.material.uniforms.uTime) {
    //     spiralMesh.material.uniforms.uTime.value = performance.now() / 1000; 
    // }

    renderer.render(scene, camera);
  }
  if (renderer) {
    console.log("CariddiSplash.js: Setting animation loop.");
    renderer.setAnimationLoop(animate);
  } else {
    console.error("CariddiSplash.js: Renderer not initialized, cannot set animation loop.");
  }


  // --- Handle Window Resize ---
  function onWindowResize() {
    if (!camera || !renderer || !canvasContainer) {
        return;
    }
    
    let newWidth = canvasContainer.clientWidth;
    let newHeight = canvasContainer.clientHeight;
    if(!newWidth || !newHeight){ // Fallback if container is hidden or has no size
        newWidth = window.innerWidth;
        newHeight = window.innerHeight;
    }

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    console.log(`CariddiSplash.js: Resized to ${newWidth}x${newHeight}`);
  }
  window.addEventListener('resize', onWindowResize);
  console.log("CariddiSplash.js: Resize event listener added.");

  function initialResize() {
    console.log("CariddiSplash.js: Attempting initial resize.");
    onWindowResize(); // Call it directly, onWindowResize now has fallbacks
    console.log("CariddiSplash.js: Initial resize performed / scheduled.");
  }
  setTimeout(initialResize, 50); 

  console.log("CariddiSplash.js: initCariddiSplash finished setup for infinite loop (DEBUG VISIBILITY MODE - async SVG load pending).");
}

