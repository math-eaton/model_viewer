import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

export function horseLoader(containerId) {
    let scene, camera, renderer, controls, pivot, effect;
    let animationFrameId;
    let isRotationEnabled = true;
    let wireframe = false;
    let isAsciiEnabled = false; // Start with regular renderer
    let asciiAdded = false; // Track whether the AsciiEffect DOM element is added

    // Event listener to toggle the Ascii effect on/off with the "A" key
    window.addEventListener('keydown', (event) => {
        if (event.key === 'A' || event.key === 'a') {  // Toggle the Ascii effect
            isAsciiEnabled = !isAsciiEnabled;

            const container = document.getElementById(containerId);

            if (isAsciiEnabled && !asciiAdded) {
                // Enable Ascii effect
                container.removeChild(renderer.domElement);
                container.appendChild(effect.domElement);
                controls.dispose(); // Dispose the old controls
                controls = new OrbitControls(camera, effect.domElement); // Reinitialize controls for Ascii effect
                controls.enableDamping = true;
                controls.dampingFactor = 0.25;
                controls.enableZoom = true;
                controls.zoomSpeed = 0.2;
                controls.rotateSpeed = 0.5;
                controls.minDistance = 0.5;
                controls.maxDistance = 4.5;
                asciiAdded = true;
            } else if (!isAsciiEnabled && asciiAdded) {
                // Disable Ascii effect and switch back to WebGLRenderer
                container.removeChild(effect.domElement);
                container.appendChild(renderer.domElement);
                controls.dispose(); // Dispose the old controls
                controls = new OrbitControls(camera, renderer.domElement); // Reinitialize controls for WebGLRenderer
                controls.enableDamping = true;
                controls.dampingFactor = 0.25;
                controls.enableZoom = true;
                controls.zoomSpeed = 0.2;
                controls.rotateSpeed = 0.5;
                controls.minDistance = 0.5;
                controls.maxDistance = 4.5;
                asciiAdded = false;
            }
        }
    });

    const models = [
        // { name: 'horse', url: '/obj/horse.obj', cameraPosition: { desktop: [-90, 0, 0], mobile: [-100, 5, 10000] } },
        // { name: 'hand', url: '/obj/hand.obj', cameraPosition: { desktop: [-120, -50, 200], mobile: [-20, 15, 500] } },
        { name: 'bunny', url: '/model_viewer/obj/bunny_scaled.obj', cameraPosition: { desktop: [-1, 50, 200], mobile: [-20, 15, 500] } }

    ];

    function getRandomModel() {
        return models[Math.floor(Math.random() * models.length)];
    }

    function init() {
        // Scene
        scene = new THREE.Scene();

        let isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;

        // Camera setup
        camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 2;

        // Renderer
        renderer = new THREE.WebGLRenderer({ alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xC0C0C0, 0);
        document.getElementById(containerId).appendChild(renderer.domElement); // Append renderer at the start

        // AsciiEffect
        const customCharSet = ' ♡❣♥☺x6☹%&*⛆@#❤☺☻  ';
        effect = new AsciiEffect(renderer, customCharSet, { invert: false, resolution: 0.25, scale: 1.0, color: false });
        effect.setSize(window.innerWidth, window.innerHeight);
        effect.domElement.style.color = 'black';
        effect.domElement.style.backgroundColor = 'white';

        // OrbitControls
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.enableZoom = true;
        controls.zoomSpeed = 0.2;
        controls.rotateSpeed = 0.5;
        controls.minDistance = 0.5;
        controls.maxDistance = 4.5;

        // Light
        const ambientLight = new THREE.AmbientLight(0x404040, 150);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
        directionalLight.position.set(1, 1, 1).normalize();
        scene.add(directionalLight);

        // Create a pivot group
        pivot = new THREE.Group();
        scene.add(pivot);

        // Load a random model
        const model = getRandomModel();
        loadObjModel(model.url, obj => switchToObjModel(obj, model.cameraPosition, model.name), handleModelError);

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Animation loop
        animate();
    }

    function loadObjModel(url, onLoad, onError) {
        const loader = new OBJLoader();

    
        loader.load(url, obj => {
            obj.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: 0x0000ff,
                        opacity: 0.95,
                        wireframe: wireframe,
                        depthWrite: false,
                        stencilWrite: true,
                        shininess: 250,
                        specular: 0xffffff,
                        stencilZPass: THREE.InvertStencilOp,
                        alphaHash: false,                
                        blending: THREE.CustomBlending,
                        blendEquation: THREE.MaxEquation,
                        blendSrc: THREE.OneMinusSrcColorFactor,
                        blendDst: THREE.OneMinusConstantColorFactor
                        
                    });

                }
            });
            onLoad(obj);
        }, undefined, onError);
    }

    function handleModelError(error) {
        console.error('Error loading OBJ model:', error);
    }

    function switchToObjModel(obj, cameraPosition, name) {
        // Clear existing shape
        while (pivot.children.length) {
            const child = pivot.children[0];
            pivot.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        

        // Center and scale the original model
        const boundingBox = new THREE.Box3().setFromObject(obj);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        obj.scale.multiplyScalar(1.0 / maxAxis);
        obj.position.sub(center.multiplyScalar(1.0 / maxAxis));

        // Clone the object
        const clone = obj.clone();

        // Position the clone slightly offset from the original
        if (name == "horse"){
            clone.position.set(0.8, 0.22, 0.55);
            clone.rotation.x = Math.PI / -3;
            clone.rotation.y = Math.PI / -1;
            clone.rotation.z = Math.PI / -3;    

        }
        else if (name == "hand"){
            clone.position.set(0.3, -0.02, -0.05);
            clone.rotation.x = Math.PI / 9;
            clone.rotation.y = Math.PI / 4;
            clone.rotation.z = Math.PI / 5;    
        }
        else if (name == "bunny"){
            clone.position.set(1.2, 0.35, -1.1);
            clone.rotation.x = Math.PI / 9;
            clone.rotation.y = Math.PI / 4;
            clone.rotation.z = Math.PI / 5;    
        }



        // Apply the same blending mode to the clone
        clone.traverse(function (child) {
            if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    wireframe: wireframe,
                    depthTest: false,
                    stencilWrite: true,
                    opacity: 0.9,
                    alphaHash: false,
                    shininess: 100,
                    specular: 0xffffff,
                    stencilFunc: THREE.EqualStencilFunc,
                    stencilRef: 0,                
                    blending: THREE.CustomBlending,
                    blendEquation: THREE.AddEquation,
                    blendSrc: THREE.OneFactor,
                    blendDst: THREE.OneFactor
                });
            }
        });

        pivot.add(obj);
        pivot.add(clone);


        camera.lookAt(center);

        let isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;
        const position = isMobile ? cameraPosition.mobile : cameraPosition.desktop;

        camera.position.set(...position);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        if (isRotationEnabled) {
            pivot.rotation.y += 0.0002;
            if (pivot.children.length > 0) {
                pivot.children[0].rotation.y += 0.0002; // Rotate the original object
                pivot.children[1].rotation.y -= 0.0003; // Rotate the clone object in the opposite direction
                // pivot.children[0].rotation.x += 0.0008; // og
                pivot.children[1].rotation.z -= 0.0001;  // clone
            }
        }
        else if (!isRotationEnabled) {
            pivot.rotation.y += 0.0;
            if (pivot.children.length > 0) {
                pivot.children[0].rotation.y += 0.0035; // Rotate the original object
                pivot.children[1].rotation.y -= 0.005; // Rotate the clone object in the opposite direction
                // pivot.children[0].rotation.x += 0.0008; // og
                pivot.children[1].rotation.z -= 0.0006;  // clone
            }
        }
        controls.update();

        // Render based on whether ASCII effect is enabled
        if (isAsciiEnabled) {
            effect.render(scene, camera); // Render with ASCII
        } else {
            renderer.render(scene, camera); // Render with regular WebGLRenderer
        }
    }

    function dispose() {
        // Clean up resources
        window.removeEventListener('resize', onWindowResize);
        cancelAnimationFrame(animationFrameId);

        while (pivot.children.length) {
            const child = pivot.children[0];
            pivot.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }

        // Clear the container
        const container = document.getElementById(containerId);
        if (container && renderer.domElement) {
            container.removeChild(renderer.domElement);
        }
    }

    // Event listener for toggling rotation
    window.addEventListener('keydown', (event) => {
        if (event.key === 'R' || event.key === 'r') { // 'R' key toggles rotation
            isRotationEnabled = !isRotationEnabled;
        }
    });


    window.addEventListener('keydown', (event) => {
        if (event.key === 'W' || event.key === 'w') {
            wireframe = !wireframe; // Toggle wireframe state
            console.log(wireframe);
    
            // Update the wireframe state for all meshes in the pivot group
            pivot.traverse(function (child) {
                if (child.isMesh) {
                    child.material.wireframe = wireframe; // Apply the new wireframe state
                    child.material.needsUpdate = true; // Ensure the material gets updated
                }
            });
    
            // Re-render the scene
            renderer.render(scene, camera);
        }
    });
        
    // Initialize and start the animation
    init();

    // Return an object with all functions you want to expose
    return {
        dispose
    };
}
