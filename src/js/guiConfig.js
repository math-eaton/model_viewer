import { GUI } from 'dat.gui';

export class GuiConfig {
    constructor() {
        // Create a container for the GUI to isolate it from page styling
        this.container = document.createElement('div');
        this.container.className = 'gui-container';
        document.body.appendChild(this.container);
                
        this.gui = new GUI({ 
            autoPlace: false,
            closed: true  // Initialize in closed mode
        });
        this.container.appendChild(this.gui.domElement);
        
        this.config = {
            backgroundColor: '#4c90d9',
            lightColor: '#ffffff',
            lightIntensity: 44,
            ambientLightIntensity: 5,
            modelColor: '#00EB79',
            cloneColor: '#c91515',
            modelOpacity: 0.98,
            cloneOpacity: 0.0,
            mixBlendMode: 'hue'
        };
        
        this.callbacks = {
            onBackgroundColorChange: null,
            onLightColorChange: null,
            onLightIntensityChange: null,
            onAmbientLightIntensityChange: null,
            onModelColorChange: null,
            onCloneColorChange: null,
            onModelOpacityChange: null,
            onCloneOpacityChange: null,
            onMixBlendModeChange: null
        };
        
        this.initGui();
    }
    
    initGui() {
        // Background controls
        const backgroundFolder = this.gui.addFolder('Background');
        backgroundFolder.addColor(this.config, 'backgroundColor')
            .name('Color')
            .onChange((value) => {
                if (this.callbacks.onBackgroundColorChange) {
                    this.callbacks.onBackgroundColorChange(value);
                }
            });
        
        // Lighting controls
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
        
        // Model controls
        const modelFolder = this.gui.addFolder('Model');
        modelFolder.addColor(this.config, 'modelColor')
            .name('Model Color')
            .onChange((value) => {
                if (this.callbacks.onModelColorChange) {
                    this.callbacks.onModelColorChange(value);
                }
            });
            
        modelFolder.add(this.config, 'modelOpacity', 0, 1)
            .name('Model Opacity')
            .onChange((value) => {
                if (this.callbacks.onModelOpacityChange) {
                    this.callbacks.onModelOpacityChange(value);
                }
            });
        
        modelFolder.addColor(this.config, 'cloneColor')
            .name('Clone Color')
            .onChange((value) => {
                if (this.callbacks.onCloneColorChange) {
                    this.callbacks.onCloneColorChange(value);
                }
            });
            
        modelFolder.add(this.config, 'cloneOpacity', 0, 1)
            .name('Clone Opacity')
            .onChange((value) => {
                if (this.callbacks.onCloneOpacityChange) {
                    this.callbacks.onCloneOpacityChange(value);
                }
            });
        
        // Mix-blend-mode control with radio button options
        modelFolder.add(this.config, 'mixBlendMode', ['hue', 'saturation', 'exclusion'])
            .name('Blend Mode')
            .onChange((value) => {
                if (this.callbacks.onMixBlendModeChange) {
                    this.callbacks.onMixBlendModeChange(value);
                }
            });
        
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
        });
        this.gui.updateDisplay();
    }
    
    // Method to toggle GUI using dat.gui's native functionality
    toggleVisibility() {
        // Use dat.gui's native close/open functionality
        if (this.gui.closed) {
            this.gui.open();
        } else {
            this.gui.close();
        }
        console.log(`GUI ${this.gui.closed ? 'closed' : 'opened'}`); // Debug log
    }
    
    // Method to destroy the GUI
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.gui.destroy();
    }
}
