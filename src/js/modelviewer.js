import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';

export function horseLoader(containerId, guiCallbacks = null) {
    let scene, camera, renderer, controls, pivot, effect;
    let animationFrameId;
    let isRotationEnabled = true;
    let wireframe = false;
    let isAsciiEnabled = false; // Start with regular renderer
    let asciiAdded = false; // Track whether the AsciiEffect DOM element is added
    let directionalLight, ambientLight; // Store light references for GUI control

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
        { name: 'horse', url: 'obj/horse.obj', cameraPosition: { desktop: [-90, 0, 0], mobile: [-100, 5, 10000] } },
        // { name: 'hand', url: '/obj/hand.obj', cameraPosition: { desktop: [-120, -50, 200], mobile: [-20, 15, 500] } },
        // { name: 'bunny', url: '/model_viewer/obj/bunny_scaled.obj', cameraPosition: { desktop: [-1, 50, 200], mobile: [-20, 15, 500] } }
        // { name: 'door', url: '/model_viewer/obj/door.obj', cameraPosition: { desktop: [-1, 50, 200], mobile: [-20, 15, 500] } }


    ];

    function getRandomModel() {
        return models[Math.floor(Math.random() * models.length)];
    }

    function setupGuiCallbacks(guiCallbacks) {
        // Background color callback
        guiCallbacks.setCallback('onBackgroundColorChange', (color) => {
            document.body.style.backgroundColor = color;
        });
        
        // Light color callback
        guiCallbacks.setCallback('onLightColorChange', (color) => {
            directionalLight.color.setHex(color.replace('#', '0x'));
        });
        
        // Light intensity callback
        guiCallbacks.setCallback('onLightIntensityChange', (intensity) => {
            directionalLight.intensity = intensity;
        });
        
        // Ambient light intensity callback
        guiCallbacks.setCallback('onAmbientLightIntensityChange', (intensity) => {
            ambientLight.intensity = intensity;
        });
        
        // Model color callback
        guiCallbacks.setCallback('onModelColorChange', (color) => {
            if (pivot.children.length > 0 && pivot.children[0].children) {
                pivot.children[0].traverse(function (child) {
                    if (child.isMesh) {
                        child.material.color.setHex(color.replace('#', '0x'));
                    }
                });
            }
        });
        
        // Model opacity callback
        guiCallbacks.setCallback('onModelOpacityChange', (opacity) => {
            if (pivot.children.length > 0 && pivot.children[0].children) {
                pivot.children[0].traverse(function (child) {
                    if (child.isMesh) {
                        child.material.opacity = opacity;
                    }
                });
            }
        });
        
        // Clone color callback
        guiCallbacks.setCallback('onCloneColorChange', (color) => {
            if (pivot.children.length > 1 && pivot.children[1].children) {
                pivot.children[1].traverse(function (child) {
                    if (child.isMesh) {
                        child.material.color.setHex(color.replace('#', '0x'));
                    }
                });
            }
        });
        
        // Clone opacity callback
        guiCallbacks.setCallback('onCloneOpacityChange', (opacity) => {
            if (pivot.children.length > 1 && pivot.children[1].children) {
                pivot.children[1].traverse(function (child) {
                    if (child.isMesh) {
                        child.material.opacity = opacity;
                    }
                });
            }
        });
        
        // Mix-blend-mode callback
        guiCallbacks.setCallback('onMixBlendModeChange', (mode) => {
            // Apply the mix-blend-mode to .figure elements
            const figureElements = document.querySelectorAll('.figure');
            figureElements.forEach(element => {
                element.style.mixBlendMode = mode;
            });
            
            // Also update the .hue-blend class dynamically
            const hueBlendElements = document.querySelectorAll('.hue-blend');
            hueBlendElements.forEach(element => {
                element.style.mixBlendMode = mode;
            });
        });
    }

    function syncInitialValues(guiCallbacks) {
        // Get current background color from body
        const currentBgColor = document.body.style.backgroundColor || '#4c90d9';
        
        // Sync with GUI
        guiCallbacks.syncWithVisualization({
            backgroundColor: currentBgColor,
            lightColor: '#ffffff',
            lightIntensity: 44,
            ambientLightIntensity: 5,
            modelColor: '#00EB79',
            cloneColor: '#c91515',
            modelOpacity: 0.98,
            cloneOpacity: 0.0,
            mixBlendMode: 'hue'
        });
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
        const customCharSet = ' g❣♥cx6☹%!&*m☺☻  ';
        effect = new AsciiEffect(renderer, customCharSet, { invert: true, resolution: 0.4, scale: 1.0, color: false });
        effect.setSize(window.innerWidth, window.innerHeight);
        effect.domElement.style.color = 'blue';
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
        ambientLight = new THREE.AmbientLight(0x404040, 5);
        scene.add(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 44);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);
        
        // Setup GUI callbacks if provided
        if (guiCallbacks) {
            setupGuiCallbacks(guiCallbacks);
            // Sync initial values with GUI
            syncInitialValues(guiCallbacks);
        }

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
                        color: 0x00EB79,
                        opacity: 0.98,
                        wireframe: wireframe,
                        depthWrite: false,
                        stencilWrite: true,
                        shininess: 100,
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
            clone.position.set(1.2, 0.35, -0.1);
            clone.rotation.x = Math.PI / 9;
            clone.rotation.y = Math.PI / 4;
            clone.rotation.z = Math.PI / 5;    
        }



        // Apply the same blending mode to the clone
        clone.traverse(function (child) {
            if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                    color: 0xc91515,
                    wireframe: wireframe,
                    depthTest: false,
                    stencilWrite: true,
                    // opacity: 0.98,
                    opacity: 0,
                    alphaHash: false,
                    shininess: 100,
                    specular: 0x0000ff,
                    stencilFunc: THREE.EqualStencilFunc,
                    stencilRef: 0,                
                    blending: THREE.CustomBlending,
                    blendEquation: THREE.MaxEquation,
                    blendSrc: THREE.OneMinusSrcColorFactor,
                    blendDst: THREE.OneMinusConstantColorFactor
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
                pivot.children[0].rotation.y += 0.003; // Rotate the original object
                pivot.children[0].rotation.x -= 0.0002; // Rotate the original object
                pivot.children[1].rotation.z += 0.002; // Rotate the clone object in the opposite direction
                // pivot.children[0].rotation.x += 0.0008; // og
                pivot.children[1].rotation.x -= 0.0002;  // clone
            }
        }
        else if (!isRotationEnabled) {
            pivot.rotation.y += 0.0;
            if (pivot.children.length > 0) {
                pivot.children[0].rotation.y += 0.00035; // Rotate the original object
                pivot.children[1].rotation.y -= 0.0005; // Rotate the clone object in the opposite direction
                // pivot.children[0].rotation.x += 0.0008; // og
                pivot.children[1].rotation.x -= 0.0006;  // clone
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
