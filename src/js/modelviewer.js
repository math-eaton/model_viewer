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
    let currentModelSize = 1.0; // Track current model size for controls
    let currentTarget = new THREE.Vector3(); // Track current target for controls

    // Helper function to apply optimized orbit controls settings
    function applyOptimizedOrbitControlSettings(controls, modelSize = 1.0, target = new THREE.Vector3(), cameraDistance = 2.0) {
        const isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;
        
        // Set the target
        controls.target.copy(target);
        
        // Calculate distance limits based on actual model bounds and camera distance
        const boundingRadius = modelSize * 0.5;
        const minDistance = Math.max(boundingRadius * 0.5, 0.1); // Can get quite close
        const maxDistance = Math.max(cameraDistance * 4.0, boundingRadius * 8.0); // Reasonable zoom out
        
        controls.minDistance = minDistance;
        controls.maxDistance = maxDistance;
        
        // Device-optimized settings
        if (isMobile) {
            controls.rotateSpeed = 0.7;
            controls.zoomSpeed = 1.2;
            controls.panSpeed = 0.8;
            controls.dampingFactor = 0.12;
            controls.enableKeys = false;
            controls.touches = {
                ONE: THREE.TOUCH.ROTATE,
                TWO: THREE.TOUCH.DOLLY_PAN
            };
        } else {
            controls.rotateSpeed = 0.6;
            controls.zoomSpeed = 1.0;
            controls.panSpeed = 1.0;
            controls.dampingFactor = 0.08;
            controls.enableKeys = true;
            controls.keys = {
                LEFT: 'ArrowLeft',
                UP: 'ArrowUp',
                RIGHT: 'ArrowRight',
                BOTTOM: 'ArrowDown'
            };
        }
        
        // Universal settings
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enablePan = true;
        
        // Polar angle constraints
        controls.maxPolarAngle = Math.PI * 0.95;
        controls.minPolarAngle = Math.PI * 0.05;
        
        // Full azimuth rotation
        controls.minAzimuthAngle = -Infinity;
        controls.maxAzimuthAngle = Infinity;
        
        // Auto-rotate settings
        controls.autoRotate = false;
        controls.autoRotateSpeed = 2.0;
        
        // Intuitive controls
        controls.screenSpacePanning = true;
        controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN
        };
        
        controls.update();
    }

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
                
                // Apply optimized settings
                const cameraDistance = camera.position.distanceTo(currentTarget);
                applyOptimizedOrbitControlSettings(controls, currentModelSize, currentTarget, cameraDistance);
                
                asciiAdded = true;
            } else if (!isAsciiEnabled && asciiAdded) {
                // Disable Ascii effect and switch back to WebGLRenderer
                container.removeChild(effect.domElement);
                container.appendChild(renderer.domElement);
                controls.dispose(); // Dispose the old controls
                controls = new OrbitControls(camera, renderer.domElement); // Reinitialize controls for WebGLRenderer
                
                // Apply optimized settings
                const cameraDistance = camera.position.distanceTo(currentTarget);
                applyOptimizedOrbitControlSettings(controls, currentModelSize, currentTarget, cameraDistance);
                
                asciiAdded = false;
            }
        }
    });

    const models = [
        { name: 'horse', url: 'obj/horse.obj', cameraPosition: { desktop: [-90, 0, 0], mobile: [-100, 5, 10000] } },
        { name: 'bunny', url: 'obj/bunny.obj', cameraPosition: { desktop: [-1, 50, 200], mobile: [-20, 15, 500] } },
        { name: 'hand', url: 'obj/hand.obj', cameraPosition: { desktop: [-120, -50, 200], mobile: [-20, 15, 500] } },
    ];

    function getRandomModel() {
        return models[Math.floor(Math.random() * models.length)];
    }
    
    function getModelByName(name) {
        return models.find(model => model.name === name) || models[0];
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
        
        // Drop shadow color callback
        guiCallbacks.setCallback('onDropShadowColorChange', (color) => {
            // Update vis-container drop shadows
            const visContainers = document.querySelectorAll('.vis-container');
            visContainers.forEach(container => {
                container.style.filter = `contrast(0.45) brightness(1.5) drop-shadow(16px 16px 20px ${color})`;
            });
            
            // Update GUI container drop shadow
            const guiContainers = document.querySelectorAll('.gui-container');
            guiContainers.forEach(container => {
                container.style.filter = `drop-shadow(16px 16px 20px ${color})`;
            });
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
        
        // Clone distance callback
        guiCallbacks.setCallback('onCloneDistanceChange', (distance) => {
            // Reposition the clone when distance changes
            if (pivot.children.length >= 2) {
                const clone = pivot.children[1]; // Clone is the second child
                const obj = pivot.children[0]; // Original is the first child
                
                // Get the current model name to determine the base positioning pattern
                const currentModel = guiCallbacks.config.selectedModel;
                
                // Recalculate clone position with new distance
                // Reuse the same logic from switchToObjModel but with current scaling
                const currentBoundingBox = new THREE.Box3().setFromObject(obj);
                const currentSize = currentBoundingBox.getSize(new THREE.Vector3());
                const currentMaxAxis = Math.max(currentSize.x, currentSize.y, currentSize.z);
                const scaleFactor = 1.0 / currentMaxAxis; // Same normalization as before
                
                // Define base positions based on model type
                let clonePos;
                if (currentModel == "horse"){
                    clonePos = { x: 0.8 * distance, y: 0.22 * distance, z: 0.55 * distance };
                } else if (currentModel == "hand"){
                    clonePos = { x: 0.3 * distance, y: -0.02 * distance, z: -0.05 * distance };
                } else if (currentModel == "bunny"){
                    clonePos = { x: 1.2 * distance, y: 0.35 * distance, z: -0.1 * distance };
                } else {
                    // Default positioning
                    clonePos = { x: 0.5 * distance, y: 0.2 * distance, z: 0.2 * distance };
                }
                
                // Apply the same scaling as the original model
                clone.position.set(
                    clonePos.x * scaleFactor,
                    clonePos.y * scaleFactor,
                    clonePos.z * scaleFactor
                );
                
                // Update camera setup with new positioning
                setupResponsiveCamera(obj, clone, currentModel);
                
                console.log(`🔄 CLONE DISTANCE UPDATED for ${currentModel}: distance=${distance}, new pos=(${clone.position.x.toFixed(3)}, ${clone.position.y.toFixed(3)}, ${clone.position.z.toFixed(3)})`);
            }
            renderer.render(scene, camera);
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
        
        // Model change callback
        guiCallbacks.setCallback('onModelChange', (modelName) => {
            const model = getModelByName(modelName);
            loadObjModel(model.url, obj => switchToObjModel(obj, model.cameraPosition, model.name, guiCallbacks), handleModelError, guiCallbacks);
        });
        
        // Mobile control callbacks
        guiCallbacks.setCallback('onToggleAscii', (enabled) => {
            // Simulate 'A' key press
            isAsciiEnabled = enabled;
            const container = document.getElementById(containerId);

            if (isAsciiEnabled && !asciiAdded) {
                container.removeChild(renderer.domElement);
                container.appendChild(effect.domElement);
                controls.dispose();
                controls = new OrbitControls(camera, effect.domElement);
                
                // Apply optimized settings
                const cameraDistance = camera.position.distanceTo(currentTarget);
                applyOptimizedOrbitControlSettings(controls, currentModelSize, currentTarget, cameraDistance);
                
                asciiAdded = true;
            } else if (!isAsciiEnabled && asciiAdded) {
                container.removeChild(effect.domElement);
                container.appendChild(renderer.domElement);
                controls.dispose();
                controls = new OrbitControls(camera, renderer.domElement);
                
                // Apply optimized settings
                const cameraDistance = camera.position.distanceTo(currentTarget);
                applyOptimizedOrbitControlSettings(controls, currentModelSize, currentTarget, cameraDistance);
                
                asciiAdded = false;
            }
        });
        
        guiCallbacks.setCallback('onToggleRotation', (enabled) => {
            isRotationEnabled = enabled;
        });
        
        guiCallbacks.setCallback('onToggleWireframe', (enabled) => {
            wireframe = enabled;
            pivot.traverse(function (child) {
                if (child.isMesh) {
                    child.material.wireframe = wireframe;
                    child.material.needsUpdate = true;
                }
            });
            renderer.render(scene, camera);
        });
        
        guiCallbacks.setCallback('onRandomizeColor', () => {
            // Trigger the same function as clicking the color wheel
            if (window.switchBackgroundColor) {
                window.switchBackgroundColor();
            }
        });
    }

    function syncInitialValues(guiCallbacks, selectedModelName = 'horse') {
        // Get current background color from body  
        const currentBgColor = document.body.style.backgroundColor || guiCallbacks.config.backgroundColor;
        
        // Sync with GUI - now using GUI config defaults instead of hardcoded values
        guiCallbacks.syncWithVisualization({
            backgroundColor: currentBgColor,
            lightColor: guiCallbacks.config.lightColor,
            lightIntensity: guiCallbacks.config.lightIntensity,
            ambientLightIntensity: guiCallbacks.config.ambientLightIntensity,
            dropShadowColor: guiCallbacks.config.dropShadowColor,
            modelColor: guiCallbacks.config.modelColor,
            cloneColor: guiCallbacks.config.cloneColor,
            modelOpacity: guiCallbacks.config.modelOpacity,
            cloneOpacity: guiCallbacks.config.cloneOpacity,
            cloneDistance: guiCallbacks.config.cloneDistance,
            mixBlendMode: guiCallbacks.config.mixBlendMode,
            selectedModel: selectedModelName, // Use the actually selected model
            toggleAscii: isAsciiEnabled,
            toggleRotation: isRotationEnabled,
            toggleWireframe: wireframe
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

        // OrbitControls (will be properly configured when model loads)
        controls = new OrbitControls(camera, renderer.domElement);
        
        // Apply basic optimized settings initially
        applyOptimizedOrbitControlSettings(controls, 1.0, new THREE.Vector3(0, 0, 0), 2.0);

        // Light
        ambientLight = new THREE.AmbientLight(0x404040, 5);
        scene.add(ambientLight);

        directionalLight = new THREE.DirectionalLight(0xffffff, 44);
        directionalLight.position.set(5, 5, 5).normalize();
        scene.add(directionalLight);
        
        // Create a pivot group
        pivot = new THREE.Group();
        scene.add(pivot);

        // Load a random model first
        const model = getRandomModel();
        
        // Setup GUI callbacks if provided
        if (guiCallbacks) {
            setupGuiCallbacks(guiCallbacks);
            
            // Apply initial drop shadow color
            const initialShadowColor = guiCallbacks.config.dropShadowColor;
            const visContainers = document.querySelectorAll('.vis-container');
            visContainers.forEach(container => {
                container.style.filter = `contrast(0.45) brightness(1.5) drop-shadow(16px 16px 20px ${initialShadowColor})`;
            });
            const guiContainers = document.querySelectorAll('.gui-container');
            guiContainers.forEach(container => {
                container.style.filter = `drop-shadow(16px 16px 20px ${initialShadowColor})`;
            });
            
            // Sync initial values with GUI - pass the selected model name
            syncInitialValues(guiCallbacks, model.name);
        }

        loadObjModel(model.url, obj => switchToObjModel(obj, model.cameraPosition, model.name, guiCallbacks), handleModelError, guiCallbacks);

        // Handle window resize
        window.addEventListener('resize', onWindowResize, false);

        // Animation loop
        animate();
    }

    function loadObjModel(url, onLoad, onError, guiConfig) {
        const loader = new OBJLoader();

    
        loader.load(url, obj => {
            obj.traverse(function (child) {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: guiConfig.config.modelColor,
                        opacity: guiConfig.config.modelOpacity,
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

    function switchToObjModel(obj, cameraPosition, name, guiConfig) {
        // Clear existing shape
        while (pivot.children.length) {
            const child = pivot.children[0];
            pivot.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        }
        

        // Center and scale the original model to a consistent size
        const boundingBox = new THREE.Box3().setFromObject(obj);
        const center = boundingBox.getCenter(new THREE.Vector3());
        const size = boundingBox.getSize(new THREE.Vector3());
        const maxAxis = Math.max(size.x, size.y, size.z);
        
        // Scale to a consistent normalized size (target max dimension of 1.0)
        const targetSize = 1.0;
        const scaleFactor = targetSize / maxAxis;
        obj.scale.multiplyScalar(scaleFactor);
        
        // Center the model at origin
        obj.position.sub(center.multiplyScalar(scaleFactor));
        
        // After scaling, verify the new size
        const scaledBoundingBox = new THREE.Box3().setFromObject(obj);
        const scaledSize = scaledBoundingBox.getSize(new THREE.Vector3());
        const scaledMaxAxis = Math.max(scaledSize.x, scaledSize.y, scaledSize.z);
        
        console.log(`✅ SCALING RESULT for ${name}:
            📏 Original max dimension: ${maxAxis.toFixed(3)}
            🎯 Target size: ${targetSize}
            📐 Scale factor applied: ${scaleFactor.toFixed(3)}
            ✨ Final max dimension: ${scaledMaxAxis.toFixed(3)}
            ${scaledMaxAxis < 1.2 && scaledMaxAxis > 0.8 ? '✅ SUCCESS: Model properly normalized!' : '⚠️ WARNING: Model may not be properly normalized'}`);

        // Clone the object
        const clone = obj.clone();

        // Define original clone positions (designed for original model scales)
        // Now using GUI cloneDistance parameter instead of hardcoded values
        const baseDistance = guiConfig.config.cloneDistance;
        let clonePos, cloneRot;
        if (name == "horse"){
            clonePos = { x: 0.8 * baseDistance, y: 0.22 * baseDistance, z: 0.55 * baseDistance };
            cloneRot = { x: Math.PI / -3, y: Math.PI / -1, z: Math.PI / -3 };
        }
        else if (name == "hand"){
            clonePos = { x: 0.3 * baseDistance, y: -0.02 * baseDistance, z: -0.05 * baseDistance };
            cloneRot = { x: Math.PI / 9, y: Math.PI / 4, z: Math.PI / 5 };
        }
        else if (name == "bunny" || name == "bunny_scaled"){
            clonePos = { x: 1.2 * baseDistance, y: 0.35 * baseDistance, z: -0.1 * baseDistance };
            cloneRot = { x: Math.PI / 9, y: Math.PI / 4, z: Math.PI / 5 };
        }
        else if (name == "door"){
            clonePos = { x: 0.5 * baseDistance, y: 0.1 * baseDistance, z: 0.3 * baseDistance };
            cloneRot = { x: Math.PI / 8, y: Math.PI / 3, z: Math.PI / 6 };
        }
        else if (name == "rabbit"){
            clonePos = { x: 0.9 * baseDistance, y: 0.3 * baseDistance, z: -0.2 * baseDistance };
            cloneRot = { x: Math.PI / 7, y: Math.PI / 5, z: Math.PI / 4 };
        }
        else {
            // Default positioning for any unspecified models
            clonePos = { x: 0.5 * baseDistance, y: 0.2 * baseDistance, z: 0.2 * baseDistance };
            cloneRot = { x: Math.PI / 6, y: Math.PI / 4, z: Math.PI / 5 };
        }

        // Scale the clone position proportionally to the model's scale factor
        // This ensures clone positioning is appropriate for normalized models
        clone.position.set(
            clonePos.x * scaleFactor,
            clonePos.y * scaleFactor,
            clonePos.z * scaleFactor
        );
        clone.rotation.set(cloneRot.x, cloneRot.y, cloneRot.z);
        
        console.log(`🔄 CLONE POSITIONING for ${name}:
            📍 Base distance multiplier: ${baseDistance}
            📐 Applied scale factor: ${scaleFactor.toFixed(3)}
            🎯 Final clone pos: (${(clonePos.x * scaleFactor).toFixed(3)}, ${(clonePos.y * scaleFactor).toFixed(3)}, ${(clonePos.z * scaleFactor).toFixed(3)})
            ${scaleFactor < 0.1 ? '⚠️ Large scaling down applied' : scaleFactor > 3 ? '⚠️ Large scaling up applied' : '✅ Moderate scaling applied'}`);

        // Apply the same blending mode to the clone
        clone.traverse(function (child) {
            if (child.isMesh) {
                child.material = new THREE.MeshPhongMaterial({
                    color: guiConfig.config.cloneColor,
                    wireframe: wireframe,
                    depthTest: false,
                    stencilWrite: true,
                    opacity: guiConfig.config.cloneOpacity,
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

        // Set up responsive camera positioning with accurate center calculation
        setupResponsiveCamera(obj, clone, name);
    }

    // Helper function to calculate the weighted center of all vertices in the model
    function calculateWeightedCenter(object) {
        let totalVertices = 0;
        let weightedCenter = new THREE.Vector3(0, 0, 0);
        let actualSize = new THREE.Vector3(0, 0, 0);
        let minBounds = new THREE.Vector3(Infinity, Infinity, Infinity);
        let maxBounds = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        object.traverse(function (child) {
            if (child.isMesh && child.geometry) {
                const geometry = child.geometry;
                const positionAttribute = geometry.attributes.position;
                
                if (positionAttribute) {
                    // Update world matrix to get accurate positions
                    child.updateMatrixWorld(true);
                    
                    // Calculate weighted center based on vertex positions
                    const vertex = new THREE.Vector3();
                    for (let i = 0; i < positionAttribute.count; i++) {
                        vertex.fromBufferAttribute(positionAttribute, i);
                        
                        // Transform vertex to world coordinates
                        vertex.applyMatrix4(child.matrixWorld);
                        
                        // Add to weighted center calculation
                        weightedCenter.add(vertex);
                        totalVertices++;
                        
                        // Track actual bounds of geometry
                        minBounds.min(vertex);
                        maxBounds.max(vertex);
                    }
                }
            }
        });

        // Calculate average position (weighted center)
        if (totalVertices > 0) {
            weightedCenter.divideScalar(totalVertices);
        }

        // Calculate actual size based on vertex positions
        actualSize.subVectors(maxBounds, minBounds);

        return {
            center: weightedCenter,
            size: actualSize,
            bounds: { min: minBounds, max: maxBounds },
            vertexCount: totalVertices
        };
    }

    function setupResponsiveCamera(obj, clone, name = 'unknown') {
        // Calculate weighted centers for both objects
        const objData = calculateWeightedCenter(obj);
        const cloneData = calculateWeightedCenter(clone);
        
        // Combine the centers with weighting based on vertex count
        const totalVertices = objData.vertexCount + cloneData.vertexCount;
        const combinedCenter = new THREE.Vector3();
        
        if (totalVertices > 0) {
            const objWeight = objData.vertexCount / totalVertices;
            const cloneWeight = cloneData.vertexCount / totalVertices;
            
            combinedCenter.addScaledVector(objData.center, objWeight);
            combinedCenter.addScaledVector(cloneData.center, cloneWeight);
        } else {
            // Fallback to simple average if no vertices found
            combinedCenter.addVectors(objData.center, cloneData.center).multiplyScalar(0.5);
        }
        
        // Calculate combined size by taking the maximum extents
        const combinedSize = new THREE.Vector3();
        combinedSize.x = Math.max(objData.size.x, cloneData.size.x);
        combinedSize.y = Math.max(objData.size.y, cloneData.size.y);
        combinedSize.z = Math.max(objData.size.z, cloneData.size.z);
        
        // Get the maximum dimension for camera distance calculation
        const maxDim = Math.max(combinedSize.x, combinedSize.y, combinedSize.z);
        
        // Calculate optimal camera distance based on viewport and actual model size
        const isMobile = Math.min(window.innerWidth, window.innerHeight) < 600;
        const aspect = window.innerWidth / window.innerHeight;
        
        // Calculate appropriate distance for normalized models (target max dimension ~1.0)
        // Since all models are now normalized to ~1.0 unit, use a simpler approach
        const boundingRadius = maxDim * 0.5;
        
        // Base distance calculation for normalized models
        let baseDistance = 2.5; // Good starting distance for 1.0 unit models
        
        // Adjust for actual model size in case normalization isn't perfect
        if (maxDim > 1.5) {
            // Model is larger than expected, increase distance proportionally
            baseDistance *= (maxDim / 1.0);
        }
        
        // Apply device and aspect ratio adjustments
        let finalDistance = baseDistance;
        if (isMobile) {
            finalDistance *= 1.3; // Mobile needs more distance
        }
        if (aspect < 1) {
            finalDistance *= 1.2; // Portrait needs more distance
        }
        
        // Set camera position relative to the weighted center
        // Use a percentage of the calculated distance for consistent framing
        const cameraOffset = new THREE.Vector3();
        
        if (isMobile) {
            // Mobile: position camera for better mobile viewing
            cameraOffset.set(
                finalDistance * 0.3,
                finalDistance * 0.25,
                finalDistance * 0.7
            );
        } else {
            // Desktop: position camera at an artistic angle
            cameraOffset.set(
                finalDistance * 0.35,
                finalDistance * 0.3,
                finalDistance * 0.6
            );
        }
        
        // Position camera relative to weighted center
        camera.position.copy(combinedCenter).add(cameraOffset);
        camera.lookAt(combinedCenter);
        
        // Configure orbit controls based on actual model size and weighted center
        setupOrbitControls(combinedCenter, maxDim, finalDistance, isMobile);
        
        console.log(`📸 CAMERA SETUP for ${name}:
            👥 Original vertices: ${objData.vertexCount} | Clone vertices: ${cloneData.vertexCount}
            🎯 Weighted center: (${combinedCenter.x.toFixed(3)}, ${combinedCenter.y.toFixed(3)}, ${combinedCenter.z.toFixed(3)})
            📏 Combined size: (${combinedSize.x.toFixed(3)}, ${combinedSize.y.toFixed(3)}, ${combinedSize.z.toFixed(3)})
            📐 Max dimension: ${maxDim.toFixed(3)}
            🔍 Bounding radius: ${(maxDim * 0.5).toFixed(3)}
            📍 Camera distance: ${finalDistance.toFixed(3)}
            📷 Camera position: (${camera.position.x.toFixed(3)}, ${camera.position.y.toFixed(3)}, ${camera.position.z.toFixed(3)})
            ${maxDim > 2.0 ? '⚠️ Model seems large - may appear zoomed out' : maxDim < 0.5 ? '⚠️ Model seems small - may appear zoomed in' : '✅ Model size looks good'}`);
    }

    function setupOrbitControls(target, modelSize, cameraDistance, isMobile) {
        // Update tracking variables
        currentTarget.copy(target);
        currentModelSize = modelSize;
        
        // Use the optimized settings helper
        applyOptimizedOrbitControlSettings(controls, modelSize, target, cameraDistance);
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        // Recalculate camera position for the current model when viewport changes
        if (pivot.children.length >= 2) {
            const obj = pivot.children[0];
            const clone = pivot.children[1];
            
            // Get the current center point
            const combinedGroup = new THREE.Group();
            combinedGroup.add(obj.clone());
            combinedGroup.add(clone.clone());
            const combinedBox = new THREE.Box3().setFromObject(combinedGroup);
            const center = combinedBox.getCenter(new THREE.Vector3());
            
            setupResponsiveCamera(obj, clone, center);
            combinedGroup.clear();
        }
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
