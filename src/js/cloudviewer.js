import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader.js';

export function pointCloudLoader(containerId) {
    let scene, camera, renderer, controls, pointCloud;
    let animationFrameId;
    let isRotationEnabled = true;

    const pointClouds = [
        { name: 'model', url: 'pcd/model.pcd', cameraPosition: { desktop: [0.5, 0.5, 0.5], mobile: [0, 0, -5] } },
        
    ];

    function getRandomPointCloud() {
        return pointClouds[Math.floor(Math.random() * pointClouds.length)];
    }

    function init() {
        // Scene
        scene = new THREE.Scene();

        let isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;

        // Orthographic Camera setup (alternative to PerspectiveCamera)
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 0.5;
        camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,  // Left and right planes
            frustumSize / 2, frustumSize / -2,                    // Top and bottom planes
            0.1, 200                                              // Near and far clipping planes
        );
        camera.position.set(2, 2, 2);  // Position the orthographic camera
        camera.lookAt(0, 0, 0);        // Make it look at the center of the scene

        // Uncomment to switch back to PerspectiveCamera
        // camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
        // camera.position.z = 2;

        // Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xC0C0C0, 0); // Set background color to light gray with no opacity
        document.getElementById(containerId).appendChild(renderer.domElement);

        // OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.2;
        controls.rotateSpeed = 0.5;
        controls.minDistance = 0.001;
        controls.maxDistance = 14.5;

        // Light
        const ambientLight = new THREE.AmbientLight(0x404040, 5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);

        // Load a random point cloud
        const pointCloud = getRandomPointCloud();
        loadPointCloud(pointCloud.url, pointCloud.cameraPosition);

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Animation loop
        animate();
    }

    function loadPointCloud(url, cameraPosition) {
        const loader = new PCDLoader();

        loader.load(url, (points) => {
            // points.material.size = 0.001; // Adjust size of the points
            points.material.size = 1.25; // Adjust size of the points

            points.material.color.setHex(0x00FF00); // Set point color to green

            points.rotation.x = Math.PI;  // 180 degrees in radians
            points.rotation.y = Math.PI;  // 180 degrees in radians

            scene.add(points);

            // Adjust camera position based on the cloud's position
            let isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;
            const position = isMobile ? cameraPosition.mobile : cameraPosition.desktop;
            camera.position.set(...position);

            pointCloud = points; // Save reference to pointCloud for future manipulation
        }, undefined, (error) => {
            console.error('Error loading PCD point cloud:', error);
        });
    }

    function onWindowResize() {
        // Adjust orthographic camera frustum based on the new aspect ratio
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 2;
        camera.left = frustumSize * aspect / -2;
        camera.right = frustumSize * aspect / 2;
        camera.top = frustumSize / 2;
        camera.bottom = frustumSize / -2;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        if (isRotationEnabled && pointCloud) {
            pointCloud.rotation.y += 0;
        }
        controls.update();
        renderer.render(scene, camera);
    }

    function dispose() {
        // Clean up resources
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationFrameId);

        // Remove point cloud from the scene
        if (pointCloud) {
            scene.remove(pointCloud);
            if (pointCloud.geometry) pointCloud.geometry.dispose();
            if (pointCloud.material) pointCloud.material.dispose();
        }

        // Clear the container
        const container = document.getElementById(containerId);
        if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
        }
    }

    // Event listener for toggling rotation
    window.addEventListener('keydown', (event) => {
        if (event.key === 'R' || event.key === 'r') {
            isRotationEnabled = !isRotationEnabled; // Toggle rotation
        }
    });

    // Initialize and start the animation
    init();

    // Return an object with all functions you want to expose
    return {
        dispose
    };
}
