import * as THREE   from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { gsap }      from 'gsap';

/* -------------------------------------------------------------
   Minimal WebGL support check
------------------------------------------------------------- */
function webglOK(){
  try{
    const c = document.createElement('canvas');
    return !!window.WebGLRenderingContext && (
      c.getContext('webgl') || c.getContext('experimental-webgl')
    );
  }catch(e){ return false; }
}

/* -------------------------------------------------------------
   Cariddi splash – spin + sink + pulsate shader
------------------------------------------------------------- */
export function initCariddiSplash({
  splashContainerSelector = '#splash-container', // The whole splash screen
  spiralContainerSelector = '#splash-top-left', // Specifically where the canvas goes
  siteSelector = '#site',
  spiralSVG    = '/cariddi-spiral.svg',
  duration     = 4.5, // Increased duration for a more graceful animation
  pulsateScale = 0.08, // How much bigger/smaller it gets
  pulsateSpeed = 1.5   // How fast it pulsates (seconds per pulse cycle)
} = {}){

  const splashContainer = document.querySelector(splashContainerSelector);
  const spiralContainer = document.querySelector(spiralContainerSelector);
  const siteContent = document.querySelector(siteSelector);
  const fallbackSpiral = document.querySelector('#fallback-spiral-container');


  if (!spiralContainer || !siteContent || !splashContainer) {
    console.error('CariddiSplash: Required DOM elements not found.');
    if (siteContent) siteContent.hidden = false; // Show site if splash can't init
    if (fallbackSpiral) fallbackSpiral.style.display = 'flex'; // Show fallback
    if (splashContainer) splashContainer.style.display = 'none';
    return;
  }

  /* 1 — respect reduced-motion & WebGL availability */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !webglOK()){
    siteContent.hidden = false;
    splashContainer.style.display = 'none'; // Hide new splash container
    fallbackSpiral.style.display = 'flex'; // Show fallback simple spiral
    // Ensure the original simple spiral animation runs if JS is on but WebGL is off/reduced motion
    const originalSpiralImg = fallbackSpiral.querySelector('img');
    if (originalSpiralImg) { // Ensure it is styled to be visible and animates
        originalSpiralImg.style.display = 'block';
    }
    return;
  }
  fallbackSpiral.style.display = 'none'; // Hide fallback if WebGL is a go


  /* 2 — canvas + renderer */
  const canvas = Object.assign(document.createElement('canvas'),{ id:'cariddi-webgl-spiral' });
  // Canvas style is handled by CSS for #splash-top-left canvas
  spiralContainer.appendChild(canvas);


  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha: true }); // alpha for transparent bg if needed
  renderer.setPixelRatio(devicePixelRatio);
  // Size based on the container
  const rect = spiralContainer.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height);


  /* 3 — scene + camera */
  const scene  = new THREE.Scene();
  // scene.fog = new THREE.FogExp2(0x218d8d, 1.4); // Fog might not be needed if bg is quadrant
  const camera = new THREE.PerspectiveCamera(40, rect.width / rect.height, 0.1, 100);
  camera.position.set(0,0,2.8); // Adjusted Z for potentially smaller canvas

  addEventListener('resize',()=>{
    const r = spiralContainer.getBoundingClientRect();
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    renderer.setSize(r.width, r.height);
  });

  /* 4 — light */
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Softer ambient
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Slightly less intense
  directionalLight.position.set(1,1,2);
  scene.add(directionalLight);


  /* 5 — load SVG → mesh */
  new SVGLoader().load(spiralSVG,data=>{
    const shapes = data.paths.flatMap(p=>SVGLoader.createShapes(p,{tolerance:.1}));
    const g = new THREE.ExtrudeGeometry(shapes,{depth:.05,bevelEnabled:false,curveSegments:24});
    g.computeBoundingBox();
    const {min,max}=g.boundingBox;
    g.translate(-(min.x+max.x)/2,-(min.y+max.y)/2,0);

    const b = new THREE.BufferGeometry().copy(g);
    const r_attr = new Float32Array(b.attributes.position.count);
    for(let i=0;i<r_attr.length;i++){
      const x=b.attributes.position.getX(i), y=b.attributes.position.getY(i);
      r_attr[i]=Math.hypot(x,y);
    }
    b.setAttribute('aR',new THREE.BufferAttribute(r_attr,1));

    const mat = new THREE.ShaderMaterial({
      uniforms:{
        uP:{value:0}, // Main progress for spin/sink
        uD:{value:0.9}, // Sink depth
        uCol:{value:new THREE.Color(0xffffff)}, // Spiral color
        uPulsate:{value:0} // Pulsate progress
      },
      vertexShader:`
        uniform float uP;
        uniform float uD;
        uniform float uPulsate; // Will go from 0 to 1 and back
        attribute float aR;
        varying float vR;
        void main(){
          vR=aR;
          float t=uP*6.28318; // Spin based on main progress
          vec3 p=position;

          // Pulsate: Affects scale before spinning and sinking
          // Add a gentle inward/outward movement to the pulsation
          float pulseFactor = 1.0 + uPulsate * 0.1; // Pulsate scale (e.g. 0.1 = 10% size change)
          p.xy *= pulseFactor;

          // Spin
          p.xy = mat2(cos(t),-sin(t),sin(t),cos(t)) * p.xy;

          // Sink: make it more pronounced towards the end
          p.z -= uD * pow(uP, 2.0) * aR; // Sink accelerates with progress squared

          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
        }`,
      fragmentShader:`uniform vec3 uCol; varying float vR;
        void main(){
          float alphaFactor = smoothstep(1.1, 0.0, vR); // Fade out edges based on radial distance
          gl_FragColor=vec4(uCol, alphaFactor);
        } `,
      transparent:true,
      depthWrite:false // Good for layering transparent objects
    });

    const mesh=new THREE.Mesh(b,mat);
    // Initial scale to fit well within the quadrant
    const scale = Math.min(rect.width, rect.height) * 0.0020; // Adjust this factor as needed
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);

    // GSAP Timeline for main animation (spin, sink, camera zoom)
    const mainTl = gsap.timeline({
      onUpdate: () => {
        mat.uniforms.uP.value = mainTl.progress();
      },
      onComplete: fadeOutSplash
    });

    mainTl.to(mesh.rotation, { z: Math.PI * 2, duration: duration, ease: "power1.inOut" }, 0) // Full spin
          .to(camera.position, { z: 1.5, duration: duration, ease: "power1.inOut" }, 0); // Camera zoom in

    // GSAP Timeline for pulsation (independent and repeating)
    // This will animate the uPulsate uniform for the shader based pulsation
    gsap.to(mat.uniforms.uPulsate, {
        value: 1, // Target value for pulsation
        duration: pulsateSpeed / 2,
        ease: "sine.inOut",
        yoyo: true, // Go back and forth
        repeat: -1 // Repeat indefinitely
    });


  });

  /* 6 — render loop */
  renderer.setAnimationLoop(()=>renderer.render(scene,camera));

  /* 7 — fade + reveal */
  function fadeOutSplash(){
    gsap.to(splashContainer, { // Fade the whole splash container
        opacity:0,
        duration:0.8,
        ease: "power1.in",
        onComplete:()=>{
            renderer.setAnimationLoop(null);
            renderer.dispose();
            if (canvas.parentNode) canvas.parentNode.removeChild(canvas); // Clean up canvas
            if (splashContainer.parentNode) splashContainer.parentNode.removeChild(splashContainer); // Clean up splash container
            siteContent.hidden = false;
            document.body.style.overflow = 'auto'; // Restore scrolling
    }});
  }
}