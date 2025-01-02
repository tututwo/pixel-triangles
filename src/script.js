import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import gsap from "gsap";
import vertexShader from "./shader/vertexShader.glsl";
import fragmentShader from "./shader/fragmentShader.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();
const debugObject = {
  showContinents: true,
  enableDepth: false,
  sampleRate: 10,
  intensity: 1.8,
  morphProgress: 0.0,
  mixShapes: false,
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Constants
const RADIAN = Math.PI / 180;
const backgroundColor = "#020B17";

// Color palettes
const oceanColors = [
  "#5c258d",
  "#5c3590",
  "#5c4293",
  "#5a4f95",
  "#585b98",
  "#55679a",
  "#51729d",
  "#4b7ea0",
  "#4389a2",
].map((color) => new THREE.Color(color));

const continentColors = [
  "#833ab4",
  "#b3378b",
  "#ce3e6e",
  "#e04d5a",
  "#ed5f4c",
  "#f67243",
  "#fb863e",
  "#fd9b3f",
  "#fcb045",
].map((color) => new THREE.Color(color));

// Helper function to get random color from array
const getRandomColor = (colorArray) => {
  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  return [color.r, color.g, color.b];
};

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const shapeTextures = [
    textureLoader.load('/textures/circle.png'),
    textureLoader.load('/textures/rect.png'),
    textureLoader.load('/textures/star.png'),
    textureLoader.load('/textures/tri.png')
];

/**
 * Particles
 */
let particles;
let imageData;
let imageWidth;
let imageHeight;
let aspectRatio;

// Function to get pixel data
const getPixel = (x, y) => {
  if (x < 0 || x >= imageWidth || y < 0 || y >= imageHeight) return [0];
  const i = (y * imageWidth + x) * 4;
  return [imageData.data[i], imageData.data[i + 1], imageData.data[i + 2]];
};

// Function to create particle positions
const createParticlePositions = (forContinents) => {
  const positions = [];
  const colors = [];
  const opacities = [];
  const rotation = [];
  const speeds = [];
  const sizes = [];
  const shapeIndices = [];

  const sampleRate = Math.max(1, Math.floor(debugObject.sampleRate));
  const scale = 10;
  const xScale = scale * aspectRatio;
  const yScale = scale;

  const baseSize = Math.max(1, sampleRate );
  const minSize = baseSize * 0.5;
  const maxSize = baseSize * 2

  for (let y = 0; y < imageHeight; y += sampleRate) {
    for (let x = 0; x < imageWidth; x += sampleRate) {
      const i = (y * imageWidth + x) * 4;
      const brightness =
        (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;

      if (
        (forContinents && brightness < 128) ||
        (!forContinents && brightness >= 128)
      ) {
        const xPos = (x / imageWidth - 0.5) * xScale;
        const yPos = -(y / imageHeight - 0.5) * yScale;
        const zPos = debugObject.enableDepth ? (Math.random() - 0.5) * 2.0 : 0;

        positions.push(xPos, yPos, zPos);
        opacities.push(1.0);
        rotation.push(Math.random() * Math.PI * 2);
        speeds.push(Math.random() * 0.002 + 0.0001);
        
        // sizes.push(minSize + Math.random() * (maxSize - minSize));
        sizes.push(Math.random() * 3 + Math.pow(sampleRate, .6));
        
        
        const shapeIndex = debugObject.mixShapes ? Math.floor(Math.random() * 4) : 3;
        shapeIndices.push(shapeIndex);

        const [r, g, b] = getRandomColor(
          forContinents ? continentColors : oceanColors
        );
        colors.push(r, g, b);
      }
    }
  }

  return { positions, colors, opacities, rotation, speeds, sizes, shapeIndices };
};

// Function to create and setup particles
const setupParticles = () => {
  // Generate both position sets
  const continentData = createParticlePositions(true);
  const oceanData = createParticlePositions(false);

  // Use the larger set as the base and pad the smaller one
  const maxCount = Math.max(
    continentData.positions.length / 3,
    oceanData.positions.length / 3
  );

  // Pad the smaller array with repeated positions
  const padArray = (array, itemSize, targetLength) => {
    const paddedArray = new Float32Array(targetLength * itemSize);
    const originalLength = array.length / itemSize;

    for (let i = 0; i < targetLength; i++) {
      const sourceIndex = i % originalLength;
      for (let j = 0; j < itemSize; j++) {
        paddedArray[i * itemSize + j] = array[sourceIndex * itemSize + j];
      }
    }

    return paddedArray;
  };

  // Create geometry with both position sets
  const geometry = new THREE.BufferGeometry();

  // Set all attributes with padded arrays
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      padArray(continentData.positions, 3, maxCount),
      3
    )
  );
  geometry.setAttribute(
    "targetPosition",
    new THREE.Float32BufferAttribute(
      padArray(oceanData.positions, 3, maxCount),
      3
    )
  );
  geometry.setAttribute(
    "particleColor",
    new THREE.Float32BufferAttribute(
      padArray(continentData.colors, 3, maxCount),
      3
    )
  );
  geometry.setAttribute(
    "targetColor",
    new THREE.Float32BufferAttribute(
      padArray(oceanData.colors, 3, maxCount),
      3
    )
  );
  geometry.setAttribute(
    "opacity",
    new THREE.Float32BufferAttribute(
      padArray(continentData.opacities, 1, maxCount),
      1
    )
  );
  geometry.setAttribute(
    "rotation",
    new THREE.Float32BufferAttribute(
      padArray(continentData.rotation, 1, maxCount),
      1
    )
  );
  geometry.setAttribute(
    "speed",
    new THREE.Float32BufferAttribute(
      padArray(continentData.speeds, 1, maxCount),
      1
    )
  );
  geometry.setAttribute(
    "size",
    new THREE.Float32BufferAttribute(
      padArray(continentData.sizes, 1, maxCount),
      1
    )
  );
  geometry.setAttribute(
    'shapeIndex',
    new THREE.Float32BufferAttribute(
      padArray(continentData.shapeIndices, 1, maxCount),
      1
    )
  );

  // Create material with base particle size adjusted for sample rate
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      shapeTextures: { value: shapeTextures },
      particleIntencity: { value: debugObject.intensity },
      particleSize: { value: 20.0 },
      time: { value: 0.0 },
      uProgress: { value: debugObject.morphProgress },
    },
  });

  // Remove old particles if they exist
  if (particles) {
    scene.remove(particles);
    particles.geometry.dispose();
    particles.material.dispose();
  }

  // Create points
  particles = new THREE.Points(geometry, material);
  scene.add(particles);
};

// Load and process the image
const img = new Image();
img.crossOrigin = "Anonymous";
img.src = "/textures/main1_mask.jpg";
img.onload = () => {
  // Create a temporary canvas to analyze the image
  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");

  // Set canvas size to match image
  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  imageWidth = img.width;
  imageHeight = img.height;
  aspectRatio = imageWidth / imageHeight;

  // Adjust camera position based on aspect ratio
  const distance = 5;
  camera.position.z = distance;

  // Draw image to canvas
  tempContext.drawImage(img, 0, 0);

  // Get image data
  imageData = tempContext.getImageData(0, 0, img.width, img.height);

  // Setup particles
  setupParticles();

  // GUI Controls
  const particleFolder = gui.addFolder("Particles");
  particleFolder
    .add(debugObject, "showContinents")
    .name("Show Continents")
    .onChange(() => {
      const currentProgress = particles.material.uniforms.uProgress.value;
      const targetProgress = currentProgress < 0.5 ? 1.0 : 0.0;
      
      gsap.to(debugObject, {
        morphProgress: targetProgress,
        duration: 1.5,
        ease: "power1.inOut",
        onUpdate: () => {
          particles.material.uniforms.uProgress.value = debugObject.morphProgress;
        }
      });
    });
  particleFolder
    .add(debugObject, "enableDepth")
    .name("Enable Depth")
    .onChange(() => {
      setupParticles();
    });
  particleFolder
    .add(debugObject, "intensity")
    .min(0.1)
    .max(2.0)
    .step(0.1)
    .name("Intensity")
    .onChange(() => {
      if (particles) {
        particles.material.uniforms.particleIntencity.value = debugObject.intensity;
      }
    });

  particleFolder
    .add(debugObject, "sampleRate")
    .min(1)
    .max(20)
    .step(1)
    .name("Sample Rate")
    .onChange(() => {
      setupParticles();
    });

  particleFolder
    .add(debugObject, "mixShapes")
    .name("Mix Shapes")
    .onChange(() => {
      setupParticles();
    });
};

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.z = 5;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 1); // Set background to black

/**
 * Animate
 */
const clock = new THREE.Clock();

const confinement = 10;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (particles) {
    particles.material.uniforms.time.value = elapsedTime;

    const positionArray = particles.geometry.attributes.position.array;
    const targetPositionArray = particles.geometry.attributes.targetPosition.array;
    const rotationArray = particles.geometry.attributes.rotation.array;
    const speedArray = particles.geometry.attributes.speed.array;
    const progress = particles.material.uniforms.uProgress.value;

    // Pre-calculate constants for this frame
    const isInContinentMode = progress < 0.5;
    const worldToImageX = imageWidth / (10 * aspectRatio);
    const worldToImageY = imageHeight / 10;
    const halfImageWidth = imageWidth * 0.5;
    const halfImageHeight = imageHeight * 0.5;

    // Update positions and rotations
    for (let i = 0; i < positionArray.length; i += 3) {
      const index = i / 3;
      const speed = speedArray[index];
      let rotation = rotationArray[index];

      // Get current position from the active array
      const activeArray = isInContinentMode ? positionArray : targetPositionArray;
      let x = activeArray[i];
      let y = activeArray[i + 1];
      let z = activeArray[i + 2];

      // Fast world to image coordinate conversion
      const tx = (x * worldToImageX) + halfImageWidth;
      const ty = (-y * worldToImageY) + halfImageHeight;

      // Optimized boundary and collision check
      let shouldBounce = false;
      
      if (tx <= 0 || tx >= imageWidth || ty <= 0 || ty >= imageHeight) {
        shouldBounce = true;
      } else {
        const pixel = getPixel(Math.floor(tx), Math.floor(ty));
        shouldBounce = isInContinentMode ? 
          pixel[0] > 128 : // Bounce off white in continent mode
          pixel[0] < 128;  // Bounce off black in ocean mode
      }

      if (shouldBounce) {
        rotation += Math.PI;
      }

      // Update position
      const moveX = Math.cos(rotation) * speed;
      const moveY = Math.sin(rotation) * speed;
      x += moveX;
      y += moveY;

      // Optional depth effect
      if (debugObject.enableDepth) {
        z += Math.sin(elapsedTime * 0.5 + x + y) * 0.002;
        z = Math.max(-1.0, Math.min(1.0, z));
      }

      // Store in the active array
      activeArray[i] = x;
      activeArray[i + 1] = y;
      activeArray[i + 2] = z;
      rotationArray[index] = rotation;
    }

    // Update only the active attributes
    if (isInContinentMode) {
      particles.geometry.attributes.position.needsUpdate = true;
    } else {
      particles.geometry.attributes.targetPosition.needsUpdate = true;
    }
    particles.geometry.attributes.rotation.needsUpdate = true;
  }

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

// Helper function for linear interpolation
function mix(a, b, t) {
  return a * (1 - t) + b * t;
}

tick();
