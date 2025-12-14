// --- 1. CONFIGURATION & THREE.JS SETUP ---

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

camera.position.z = 5;
scene.background = new THREE.Color(0x000011); // Dark blue background

const PARTICLE_COUNT = 50000;
let particles, geometry, material;
let initialPositions = new Float32Array(PARTICLE_COUNT * 3);
let currentTemplate = 'heart';
let particleSpeed = 0.005;

// --- GESTURE SIMULATION (Replace with actual Mediapipe Integration) ---
// In a real app, these would be updated by the Hand Tracking logic
let gestureSpreadFactor = 0.5; // Controls explosion/attraction (0.0 to 1.0)
let handScreenPosition = new THREE.Vector3(0, 0, 0); // Normalized hand center

// Simulate gesture change for demonstration
document.addEventListener('mousemove', (e) => {
    // Map mouse X to gesture factor
    gestureSpreadFactor = e.clientX / window.innerWidth;
    // Map mouse Y to hand position (Y is inverted in screen space)
    handScreenPosition.x = (e.clientX / window.innerWidth) * 10 - 5;
    handScreenPosition.y = -(e.clientY / window.innerHeight) * 10 + 5;
    document.getElementById('gesture-factor').innerText = gestureSpreadFactor.toFixed(2);
});

document.addEventListener('click', () => {
    currentTemplate = (currentTemplate === 'heart') ? 'saturn' : 'heart';
    document.getElementById('template-name').innerText = currentTemplate.charAt(0).toUpperCase() + currentTemplate.slice(1);
    createParticleSystem(currentTemplate);
});

// --- 2. PARTICLE TEMPLATE FUNCTIONS ---

/** Generates positions for a 3D Heart shape */
function getHeartPositions(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = Math.random() * 2 * Math.PI; // Parameter t for the curve
        const scale = 0.3 * (Math.random() + 0.5);

        // Parametric Heart Curve (rotated)
        positions[i * 3 + 0] = 16 * Math.pow(Math.sin(t), 3) * scale;
        positions[i * 3 + 1] = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // Add Z depth variation
    }
    return positions;
}

/** Generates positions for a flat Saturn-like ring */
function getSaturnPositions(count) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.5 + 1.5; // Radius between 1.5 and 4.0
        
        positions[i * 3 + 0] = Math.cos(angle) * radius; // X
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.1; // Small Y for flatness
        positions[i * 3 + 2] = Math.sin(angle) * radius; // Z
    }
    return positions;
}

/** Generates random colors */
function getColors(count, hue = 0.6) {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const saturation = 0.8 + Math.random() * 0.2;
        const lightness = 0.5 + Math.random() * 0.3;
        const color = new THREE.Color().setHSL(hue, saturation, lightness);
        colors[i * 3 + 0] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    return colors;
}

// --- 3. SYSTEM INITIALIZATION ---

function createParticleSystem(template) {
    if (particles) scene.remove(particles);

    const positionsData = (template === 'heart') ? getHeartPositions(PARTICLE_COUNT) : getSaturnPositions(PARTICLE_COUNT);
    const colorsData = getColors(PARTICLE_COUNT, (template === 'heart') ? 0.9 : 0.6); // Red/Pink for Heart, Blue for Saturn

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positionsData, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorsData, 3));
    
    // Store initial positions for attraction/explosion logic
    initialPositions.set(positionsData);
    geometry.setAttribute('initialPosition', new THREE.BufferAttribute(initialPositions, 3));

    material = new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
    });

    particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Initialize on load
createParticleSystem(currentTemplate);

// --- 4. REAL-TIME INTERACTIVE UPDATE LOOP ---

function animate() {
    requestAnimationFrame(animate);

    if (particles) {
        const positions = particles.geometry.attributes.position.array;
        const initial = particles.geometry.attributes.initialPosition.array;
        
        // Hand position in 3D space (using the simulated position)
        const handPos = handScreenPosition; 

        // Rotation speed depends on the template
        const rotationSpeed = (currentTemplate === 'heart') ? 0.005 : 0.01;
        particles.rotation.y += rotationSpeed * (1 - gestureSpreadFactor); // Slower rotation when spread is high

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const i3 = i * 3;
            
            // Current position vector
            let px = positions[i3];
            let py = positions[i3 + 1];
            let pz = positions[i3 + 2];
            
            // Initial position vector
            const ix = initial[i3];
            const iy = initial[i3 + 1];
            const iz = initial[i3 + 2];
            
            // 1. **INTERACTION LOGIC (Attraction/Explosion)**
            
            const toHandX = handPos.x - px;
            const toHandY = handPos.y - py;
            const toHandZ = handPos.z - pz;
            const distSq = toHandX*toHandX + toHandY*toHandY + toHandZ*toHandZ;
            
            // Attraction factor: higher when the gesture factor is low (clenched)
            const attractionFactor = 1.0 - gestureSpreadFactor; 
            // Explosion factor: higher when the gesture factor is high (open palm)
            const explosionFactor = gestureSpreadFactor; 
            
            // Calculate direction vector back to the initial position (for attraction)
            const backToIX = ix - px;
            const backToIY = iy - py;
            const backToIZ = iz - pz;
            
            // Apply Attraction (pull particles back to shape)
            px += backToIX * attractionFactor * 0.005;
            py += backToIY * attractionFactor * 0.005;
            pz += backToIZ * attractionFactor * 0.005;

            // Apply Explosion/Dispersion (push particles away from the hand)
            // This applies only when the gesture factor is high (e.g., open palm gesture)
            if (explosionFactor > 0.5) {
                // Scale the hand-to-particle vector by the explosion strength
                const force = (0.5 * explosionFactor) / (distSq + 0.1); 
                px -= toHandX * force;
                py -= toHandY * force;
                pz -= toHandZ * force;
            }
            
            // 2. **Jitter/Animation**
            // Add slight perpetual motion for a "live" feel
            px += Math.sin(Date.now() * particleSpeed + i) * 0.001;
            py += Math.cos(Date.now() * particleSpeed * 0.5 + i) * 0.001;

            positions[i3] = px;
            positions[i3 + 1] = py;
            positions[i3 + 2] = pz;
        }

        particles.geometry.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
}
animate();

// --- 5. WINDOW RESIZE HANDLER ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Note: For actual Mediapipe hand tracking, you would:
// 1. Initialize the Mediapipe Hands model.
// 2. Setup the camera video stream.
// 3. In the animate loop (or a separate handler), process the landmarks:
//    - Determine the hand's center (e.g., landmark 9).
//    - Map the normalized screen coordinates (0 to 1) to Three.js coordinates (-5 to 5).
//    - Calculate gestureSpreadFactor based on the distance between key landmarks (e.g., thumb tip and pinky tip).
