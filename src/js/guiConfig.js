import { GUI } from 'dat.gui';
import { HalfFloatType } from 'three';

export class GuiConfig {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'gui-container';
        document.body.appendChild(this.container);
                
        this.gui = new GUI({ 
            autoPlace: false,
            closed: true 
        });
        this.container.appendChild(this.gui.domElement);
        
        setTimeout(() => {
            if (this.gui.closed) {
                this.gui.close(); 
            }
        }, 0);
        
        this.config = {
            backgroundColor: '#4c90d9',
            lightColor: '#ffffff',
            lightIntensity: 44,
            ambientLightIntensity: 5,
            dropShadowColor: '#0000ff',
            modelColor: '#00EB79',
            cloneColor: '#c91515',
            modelOpacity: 0.98,
            cloneOpacity: 0.5,
            cloneDistance: 1.0,
            mixBlendMode: 'hue',
            selectedModel: 'horse',
            hideCursor: false, // Desktop-only: toggle to hide cursor
            hideUI: false // Toggle to hide UI (and cursor) - Esc to show
        };
        
        // Mobile controls (interactive toggles)
        this.mobileControls = {
            toggleAscii: false,
            toggleRotation: true,
            toggleWireframe: false
        };
        
        this.callbacks = {
            onBackgroundColorChange: null,
            onLightColorChange: null,
            onLightIntensityChange: null,
            onAmbientLightIntensityChange: null,
            onDropShadowColorChange: null,
            onModelColorChange: null,
            onCloneColorChange: null,
            onModelOpacityChange: null,
            onCloneOpacityChange: null,
            onCloneDistanceChange: null,
            onMixBlendModeChange: null,
            onModelChange: null,
            onToggleAscii: null,
            onToggleRotation: null,
            onToggleWireframe: null,
            onRandomizeColor: null
        };
        
        this.initGui();
    }
    
    initGui() {
        const colorFolder = this.gui.addFolder('Color');
        colorFolder.addColor(this.config, 'backgroundColor')
            .name('bg')
            .onChange((value) => {
                if (this.callbacks.onBackgroundColorChange) {
                    this.callbacks.onBackgroundColorChange(value);
                }
            });
            
        colorFolder.addColor(this.config, 'modelColor')
            .name('Model Color')
            .onChange((value) => {
                if (this.callbacks.onModelColorChange) {
                    this.callbacks.onModelColorChange(value);
                }
            });
            
        colorFolder.addColor(this.config, 'cloneColor')
            .name('Clone Color')
            .onChange((value) => {
                if (this.callbacks.onCloneColorChange) {
                    this.callbacks.onCloneColorChange(value);
                }
            });
        
        // Close the color folder by default
        colorFolder.close();
        
        const lightingFolder = this.gui.addFolder('Lighting');
        lightingFolder.addColor(this.config, 'lightColor')
            .name('Light Color')
            .onChange((value) => {
                if (this.callbacks.onLightColorChange) {
                    this.callbacks.onLightColorChange(value);
                }
            });
        
        lightingFolder.add(this.config, 'lightIntensity', 0, 100)
            .name('Light Intensity')
            .onChange((value) => {
                if (this.callbacks.onLightIntensityChange) {
                    this.callbacks.onLightIntensityChange(value);
                }
            });
            
        lightingFolder.add(this.config, 'ambientLightIntensity', 0, 20)
            .name('Ambient Intensity')
            .onChange((value) => {
                if (this.callbacks.onAmbientLightIntensityChange) {
                    this.callbacks.onAmbientLightIntensityChange(value);
                }
            });
            
        lightingFolder.addColor(this.config, 'dropShadowColor')
            .name('Drop Shadow')            .onChange((value) => {
                if (this.callbacks.onDropShadowColorChange) {
                    this.callbacks.onDropShadowColorChange(value);
                }
            });
        
        // Close the lighting folder by default
        lightingFolder.close();
        
        // Model controls
        const modelFolder = this.gui.addFolder('Model');
        
        // Model selector dropdown
        modelFolder.add(this.config, 'selectedModel', ['horse', 'bunny', 'hand'])
            .name('Model')
            .onChange((value) => {
                if (this.callbacks.onModelChange) {
                    this.callbacks.onModelChange(value);
                }
            });
            
        modelFolder.add(this.config, 'modelOpacity', 0, 1)
            .name('Model Opacity')
            .onChange((value) => {
                if (this.callbacks.onModelOpacityChange) {
                    this.callbacks.onModelOpacityChange(value);
                }
            });
        
        modelFolder.add(this.config, 'cloneOpacity', 0, 1)
            .name('Clone Opacity')
            .onChange((value) => {
                if (this.callbacks.onCloneOpacityChange) {
                    this.callbacks.onCloneOpacityChange(value);
                }
            });
        
        modelFolder.add(this.config, 'cloneDistance', 0, 3)
            .name('Clone Distance')
            .onChange((value) => {
                if (this.callbacks.onCloneDistanceChange) {
                    this.callbacks.onCloneDistanceChange(value);
                }
            });
        
        // Close the model folder by default
        modelFolder.close();
        
        
        const fxFolder = this.gui.addFolder('fx');
        
        fxFolder.add(this.mobileControls, 'toggleAscii')
            .name('ASCII')
            .onChange((value) => {
                if (this.callbacks.onToggleAscii) {
                    this.callbacks.onToggleAscii(value);
                }
            });
            
        fxFolder.add(this.mobileControls, 'toggleRotation')
            .name('Rotation')
            .onChange((value) => {
                if (this.callbacks.onToggleRotation) {
                    this.callbacks.onToggleRotation(value);
                }
            });
            
        fxFolder.add(this.mobileControls, 'toggleWireframe')
            .name('Wireframe')
            .onChange((value) => {
                if (this.callbacks.onToggleWireframe) {
                    this.callbacks.onToggleWireframe(value);
                }
            });

        // toggle UI option if on desktop
        if (!this.isMobileDevice()) {
            fxFolder.add(this.config, 'hideUI')
                .name('tg ui (esc)')
                .onChange((value) => {
                    if (value) {
                        document.body.classList.add('hide-cursor');
                        this.container.style.display = 'none';
                    } else {
                        document.body.classList.remove('hide-cursor');
                        this.container.style.display = '';
                    }
                });
            // Listen for Escape key to restore UI
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.config.hideUI) {
                    this.config.hideUI = false;
                    document.body.classList.remove('hide-cursor');
                    this.container.style.display = '';
                    this.gui.updateDisplay();
                }
            });
        }

        fxFolder.add(this.config, 'mixBlendMode', ['hue', 'saturation', 'exclusion', 'luminosity', 'color', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'difference'])
            .name('Blend Mode')
            .onChange((value) => {
                if (this.callbacks.onMixBlendModeChange) {
                    this.callbacks.onMixBlendModeChange(value);
                }
            });
            
        const randomColorButton = {
            randomize: () => {
                if (this.callbacks.onRandomizeColor) {
                    this.callbacks.onRandomizeColor();
                }
            }
        };
        fxFolder.add(randomColorButton, 'randomize')
            .name('Random Background Color');
        
        // Close the fx folder by default
        fxFolder.close();
        
    }
    
    // Method to register callbacks for different config changes
    setCallback(callbackName, callback) {
        if (this.callbacks.hasOwnProperty(callbackName)) {
            this.callbacks[callbackName] = callback;
        }
    }
    
    // Method to update config values programmatically
    updateConfig(key, value) {
        if (this.config.hasOwnProperty(key)) {
            this.config[key] = value;
            this.gui.updateDisplay();
        }
    }
    
    // Method to sync initial values with the visualization
    syncWithVisualization(values) {
        Object.keys(values).forEach(key => {
            if (this.config.hasOwnProperty(key)) {
                this.config[key] = values[key];
            }
            if (this.mobileControls.hasOwnProperty(key)) {
                this.mobileControls[key] = values[key];
            }
        });
        this.gui.updateDisplay();
    }
    
    toggleVisibility() {
        if (this.gui.closed) {
            this.gui.open();
        } else {
            this.gui.close();
        }
    }
    
    // Method to destroy the GUI
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.gui.destroy();
    }

    // Utility to detect mobile devices
    isMobileDevice() {
        return (typeof window !== 'undefined') && (Math.min(window.innerWidth, window.innerHeight) < 768);
    }
}
