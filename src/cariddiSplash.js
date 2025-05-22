import * as THREE   from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { gsap }      from 'gsap';

/* -------------------------------------------------------------
   Minimal WebGL support check (no fragile imports needed)
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
   Cariddi splash – spin + sink shader
------------------------------------------------------------- */
export function initCariddiSplash({
  siteSelector = '#site',
  spiralSVG    = '/cariddi-spiral.svg',
  duration     = 3.5
} = {}){

  /* 1 — respect reduced-motion & WebGL availability */
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !webglOK()){
    document.querySelector(siteSelector).hidden = false;
    return;
  }

  /* 2 — canvas + renderer */
  const canvas = Object.assign(document.createElement('canvas'),{ id:'cariddi-webgl' });
  Object.assign(canvas.style,{position:'fixed',inset:0,zIndex:9999,background:'#218d8d'});
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setPixelRatio(devicePixelRatio);
  renderer.setSize(innerWidth,innerHeight);

  /* 3 — scene + camera */
  const scene  = new THREE.Scene();
  scene.fog    = new THREE.FogExp2(0x218d8d,1.4);
  const camera = new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.1,100);
  camera.position.set(0,0,2.6);

  addEventListener('resize',()=>{
    camera.aspect = innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });

  /* 4 — light */
  scene.add(new THREE.DirectionalLight(0xffffff,1).position.set(1,1,2));

  /* 5 — load SVG → mesh */
  new SVGLoader().load(spiralSVG,data=>{
    const shapes = data.paths.flatMap(p=>SVGLoader.createShapes(p,{tolerance:.1}));
    const g = new THREE.ExtrudeGeometry(shapes,{depth:.05,bevelEnabled:false,curveSegments:24});
    g.computeBoundingBox();
    const {min,max}=g.boundingBox;
    g.translate(-(min.x+max.x)/2,-(min.y+max.y)/2,0);

    // attach radial attr for sink shader
    const b = new THREE.BufferGeometry().copy(g);
    const r = new Float32Array(b.attributes.position.count);
    for(let i=0;i<r.length;i++){
      const x=b.attributes.position.getX(i), y=b.attributes.position.getY(i);
      r[i]=Math.hypot(x,y);
    }
    b.setAttribute('aR',new THREE.BufferAttribute(r,1));

    const mat = new THREE.ShaderMaterial({
      uniforms:{ uP:{value:0}, uD:{value:.9},uCol:{value:new THREE.Color(0xffffff)} },
      vertexShader:`
        uniform float uP; uniform float uD;
        attribute float aR; varying float vR;
        void main(){
          vR=aR;
          float t=uP*6.28318;
          vec3 p=position;
          p.xy = mat2(cos(t),-sin(t),sin(t),cos(t)) * p.xy; // spin
          p.z -= uD*uP*aR;                                // sink
          gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.);
        }`,
      fragmentShader:`uniform vec3 uCol; varying float vR;
        void main(){ float a=smoothstep(1.1,0.,vR); gl_FragColor=vec4(uCol,a);} `,
      transparent:true, depthWrite:false
    });

    const mesh=new THREE.Mesh(b,mat); scene.add(mesh);

    gsap.timeline({onUpdate:()=>mat.uniforms.uP.value=tl.progress(),
                   onComplete:fadeOut})
        .to(mesh.rotation,{z:0,duration})
        .to(camera.position,{z:.85,duration},0);
    const tl=gsap.timeline(); // dummy so .progress() works
  });

  /* 6 — render loop */
  renderer.setAnimationLoop(()=>renderer.render(scene,camera));

  /* 7 — fade + reveal */
  function fadeOut(){
    gsap.to(canvas,{opacity:0,duration:.8,onComplete:()=>{
      renderer.setAnimationLoop(null); renderer.dispose(); canvas.remove();
      document.querySelector(siteSelector).hidden=false;
    }});
  }
}
