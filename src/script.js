import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";
import vertexShader from "./shader/vertexShader.glsl";
import fragmentShader from "./shader/fragmentShader.glsl";

/**
 * Base
 */
// Debug
const gui = new GUI();
const debugObject = {
    showContinents: true,
    enableDepth: true
};

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

// Constants
const RADIAN = Math.PI / 180;

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const particleTexture = textureLoader.load("/textures/tri.png");

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

// Function to create particles
const createParticles = (showContinents) => {
    // Clear previous arrays
    const positions = [];
    const colors = [];
    const opacities = [];
    const rotation = [];
    const speeds = [];
    const particleSize = [];

    // Sample rate (adjust for performance)
    const sampleRate = 5;

    // Calculate scaling factors to maintain aspect ratio
    const scale = 10;
    const xScale = scale * aspectRatio;
    const yScale = scale;

    for (let y = 0; y < imageHeight; y += sampleRate) {
        for (let x = 0; x < imageWidth; x += sampleRate) {
            const i = (y * imageWidth + x) * 4;
            const brightness = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;

            // Check if pixel should be included based on debug setting
            if ((showContinents && brightness < 128) || (!showContinents && brightness >= 128)) {
                const xPos = (x / imageWidth - 0.5) * xScale;
                const yPos = -(y / imageHeight - 0.5) * yScale;
                const zPos = debugObject.enableDepth ? (Math.random() - 0.5) * 2.0 : 0;

                positions.push(xPos, yPos, zPos);
                opacities.push(1.0);
                particleSize.push(Math.random() * 100 + 80);
                rotation.push(Math.random() * Math.PI * 2);
                speeds.push(Math.random() * 0.002 + 0.001);

                // Different color schemes for continents and oceans
                if (showContinents) {
                    if (Math.random() > 0.5) {
                        colors.push(0.1, 0.4, 0.8); // Light blue
                    } else {
                        colors.push(0.05, 0.3, 0.6); // Darker blue
                    }
                } else {
                    if (Math.random() > 0.5) {
                        colors.push(0.8, 0.8, 1.0); // Light cyan
                    } else {
                        colors.push(0.6, 0.8, 0.9); // Sky blue
                    }
                }
            }
        }
    }

    // Create geometry
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    particlesGeometry.setAttribute("particleColor", new THREE.Float32BufferAttribute(colors, 3));
    particlesGeometry.setAttribute("opacity", new THREE.Float32BufferAttribute(opacities, 1));
    particlesGeometry.setAttribute("rotation", new THREE.Float32BufferAttribute(rotation, 1));
    particlesGeometry.setAttribute("speed", new THREE.Float32BufferAttribute(speeds, 1));
    particlesGeometry.setAttribute("particleSize", new THREE.Float32BufferAttribute(particleSize, 1));

    // Create material
    const particlesMaterial = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
            particleTexture: { value: particleTexture },
            particleIntencity: { value: 1.0 },
            time: { value: 0.0 },
        },
    });

    // Remove old particles if they exist
    if (particles) {
        scene.remove(particles);
        particles.geometry.dispose();
        particles.material.dispose();
    }

    // Create new points
    particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    console.log(`Created ${positions.length / 3} particles in ${showContinents ? 'continent' : 'ocean'} mode`);
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

    // Create initial particles
    createParticles(debugObject.showContinents);

    // GUI Controls
    const particleFolder = gui.addFolder("Particles");
    particleFolder.add(debugObject, 'showContinents')
        .name('Show Continents')
        .onChange(() => {
            createParticles(debugObject.showContinents);
        });
    particleFolder.add(debugObject, 'enableDepth')
        .name('Enable Depth')
        .onChange(() => {
            createParticles(debugObject.showContinents);
        });
    particleFolder.add(particles.material.uniforms.particleIntencity, "value")
        .min(0.1).max(2.0).step(0.1).name("Intensity");
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

const confinement = 10
const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    if (particles) {
        particles.material.uniforms.time.value = elapsedTime;

        const positionArray = particles.geometry.attributes.position.array;
        const rotationArray = particles.geometry.attributes.rotation.array;
        const speedArray = particles.geometry.attributes.speed.array;

        // Update positions and rotations
        for (let i = 0; i < positionArray.length; i += 3) {
            const index = i / 3;
            const speed = speedArray[index];
            let rotation = rotationArray[index];

            // Current position
            let x = positionArray[i];
            let y = positionArray[i + 1];
            let z = positionArray[i + 2];

            // Convert world position to image coordinates
            const tx = (x / (10 * aspectRatio) + 0.5) * imageWidth;
            const ty = (-y / 10 + 0.5) * imageHeight;

            // Check boundaries and image data
            if (tx <= 0 || tx >= imageWidth || ty <= 0 || ty >= imageHeight) {
                rotation += Math.PI;
            } else {
                const pixel = getPixel(Math.floor(tx), Math.floor(ty));
                // Adjust collision based on current mode
                const shouldBounce = debugObject.showContinents ? 
                    pixel[0] > 128 :  // In continent mode, bounce off white areas
                    pixel[0] < 128;   // In ocean mode, bounce off black areas
                
                if (shouldBounce) {
                    rotation += Math.PI;
                }
            }

            // Update position based on rotation and speed
            x += Math.cos(rotation) * speed;
            y += Math.sin(rotation) * speed;
            
            // Z oscillation only if depth is enabled
            if (debugObject.enableDepth) {
                z = positionArray[i + 2] + Math.sin(elapsedTime * 0.5 + x + y) * 0.002;
                
                // Constrain Z depth
                if (z > 1.0 || z < -1.0) {
                    z = Math.sign(z) * 1.0;
                }
            } else {
                z = 0;
            }

            // Store updated values
            positionArray[i] = x;
            positionArray[i + 1] = y;
            positionArray[i + 2] = z;
            rotationArray[index] = rotation;
        }

        // Mark attributes as needing update
        particles.geometry.attributes.position.needsUpdate = true;
        particles.geometry.attributes.rotation.needsUpdate = true;
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
};

tick();
