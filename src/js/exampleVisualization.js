// Example: How to add GUI support to a new visualization
// This shows the pattern for making any Three.js visualization GUI-compatible

import * as THREE from 'three';

export function exampleVisualization(containerId, guiCallbacks = null) {
    let scene, camera, renderer;
    let mesh, light;
    
    function init() {
        // Standard Three.js setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ alpha: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById(containerId).appendChild(renderer.domElement);
        
        // Create some geometry
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        
        // Add lighting
        light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        scene.add(light);
        
        camera.position.z = 5;
        
        // Setup GUI callbacks if provided
        if (guiCallbacks) {
            setupGuiCallbacks(guiCallbacks);
            syncInitialValues(guiCallbacks);
        }
        
        animate();
    }
    
    function setupGuiCallbacks(guiCallbacks) {
        // Background color callback
        guiCallbacks.setCallback('onBackgroundColorChange', (color) => {
            document.body.style.backgroundColor = color;
        });
        
        // Light color callback
        guiCallbacks.setCallback('onLightColorChange', (color) => {
            light.color.setHex(color.replace('#', '0x'));
        });
        
        // Light intensity callback
        guiCallbacks.setCallback('onLightIntensityChange', (intensity) => {
            light.intensity = intensity / 44; // Normalize to reasonable range
        });
        
        // Model color callback
        guiCallbacks.setCallback('onModelColorChange', (color) => {
            mesh.material.color.setHex(color.replace('#', '0x'));
        });
        
        // Model opacity callback
        guiCallbacks.setCallback('onModelOpacityChange', (opacity) => {
            mesh.material.opacity = opacity;
            mesh.material.transparent = opacity < 1;
        });
        
        // Note: You can ignore callbacks you don't need
        // For example, if your visualization doesn't have a clone object,
        // just don't set the clone-related callbacks
    }
    
    function syncInitialValues(guiCallbacks) {
        // Sync current visualization state with GUI
        const currentBgColor = document.body.style.backgroundColor || '#4c90d9';
        
        guiCallbacks.syncWithVisualization({
            backgroundColor: currentBgColor,
            lightColor: '#ffffff',
            lightIntensity: 44,
            modelColor: '#00ff00',
            modelOpacity: 1.0
            // Only include the properties your visualization uses
        });
    }
    
    function animate() {
        requestAnimationFrame(animate);
        
        // Rotate the cube
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.01;
        
        renderer.render(scene, camera);
    }
    
    function dispose() {
        // Cleanup function
        if (renderer && renderer.domElement) {
            const container = document.getElementById(containerId);
            if (container && container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        }
        
        // Dispose of geometries, materials, etc.
        if (mesh) {
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        }
    }
    
    init();
    
    return { dispose };
}

/*
To use this pattern in main.js, add to your visualizations array:

{
    func: exampleVisualization,
    container: "exampleContainer",
    supportsGui: true
}

The GUI will automatically work with your visualization!
*/
