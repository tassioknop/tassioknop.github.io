/*!
 * Chart Grid
 * Copyright (c) 2025 Tassio Knop
 * Licensed under MIT License
 * https://github.com/tassioknop/tassioknop.github.io/chartgrid
 */

// Configure PDF.js
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Global variables
let images = [];
let currentCols = 2;
let currentRows = 2;

// Interactive Canvas Variables
let fabricCanvas = null;
let canvasObjects = []; // Track our image objects
let gridLines = [];
let showGrid = false;

console.log('🚀 Chart Layout Tool loaded!');

// Initialize Fabric Canvas
function initializeCanvas() {
    if (fabricCanvas) {
        fabricCanvas.dispose(); // Clean up existing canvas
    }
    
    fabricCanvas = new fabric.Canvas('layoutCanvas', {
        backgroundColor: 'white',
        selection: true,
        preserveObjectStacking: true
    });
    
    // Set canvas size based on quality setting
    const quality = document.getElementById('qualitySelect')?.value || 'large';
    let canvasWidth, canvasHeight;
    
    switch (quality) {
        case 'medium': canvasWidth = 800; canvasHeight = 500; break;
        case 'large': canvasWidth = 1000; canvasHeight = 600; break;
        case 'xlarge': canvasWidth = 1200; canvasHeight = 720; break;
        case 'ultra': canvasWidth = 1400; canvasHeight = 840; break;
        default: canvasWidth = 1000; canvasHeight = 600;
    }
    
    fabricCanvas.setDimensions({
        width: canvasWidth,
        height: canvasHeight
    });
    
    // Event listeners
    fabricCanvas.on('object:modified', onObjectModified);
    fabricCanvas.on('object:moving', onObjectMoving);
    fabricCanvas.on('object:scaling', onObjectScaling);
    fabricCanvas.on('object:rotating', onObjectRotating);
    fabricCanvas.on('mouse:dblclick', onDoubleClick);
    
    console.log(`🎨 Canvas initialized: ${canvasWidth}×${canvasHeight}`);
}

// Add images to canvas automatically
function addImagesToCanvas() {
    if (!fabricCanvas || images.length === 0) return;
    
    fabricCanvas.clear();
    canvasObjects = [];
    
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    
    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(images.length));
    const rows = Math.ceil(images.length / cols);
    
    const cellWidth = canvasWidth / cols;
    const cellHeight = canvasHeight / rows;
    const padding = 20;
    
    images.forEach((img, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = (col * cellWidth) + padding;
        const y = (row * cellHeight) + padding;
        const maxWidth = cellWidth - (padding * 2);
        const maxHeight = cellHeight - (padding * 2);
        
        // Create fabric image object
        fabric.Image.fromURL(img.src, (fabricImg) => {
            // Scale to fit cell
            const scale = Math.min(
                maxWidth / fabricImg.width,
                maxHeight / fabricImg.height,
                1
            );
            
            fabricImg.set({
                left: x,
                top: y,
                scaleX: scale,
                scaleY: scale,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                cornerStyle: 'circle',
                cornerColor: '#007bff',
                borderColor: '#007bff',
                transparentCorners: false
            });
            
            // Add custom properties
            fabricImg.imageData = img;
            fabricImg.originalIndex = index;
            
            fabricCanvas.add(fabricImg);
            canvasObjects.push(fabricImg);
            
            // Add label if needed
            addLabelToImage(fabricImg);
            
            console.log(`✅ Added ${img.name} to canvas at (${x}, ${y})`);
        });
    });
    
    fabricCanvas.renderAll();
}

// Add label to image
function addLabelToImage(fabricImg) {
    const labelPosition = document.getElementById('labelPosition')?.value || 'bottom';
    if (labelPosition === 'none') return;
    
    const fontSize = parseInt(document.getElementById('fontSlider')?.value || 16);
    const label = new fabric.Text(fabricImg.imageData.name, {
        fontSize: fontSize,
        fill: 'black',
        fontFamily: 'Arial',
        selectable: false, // Labels follow their images
        evented: false
    });
    
    // Position label relative to image
    positionLabel(label, fabricImg, labelPosition);
    
    fabricImg.label = label;
    fabricCanvas.add(label);
}


// Position label relative to image
function positionLabel(label, image, position) {
    const imageLeft = image.left;
    const imageTop = image.top;
    const imageWidth = image.getScaledWidth();
    const imageHeight = image.getScaledHeight();
    
    let labelLeft, labelTop;
    
    switch (position) {
        case 'top':
            labelLeft = imageLeft + imageWidth / 2;
            labelTop = imageTop - 25;
            label.set({ 
                textAlign: 'center', 
                originX: 'center'
                // Remove textBaseline - Fabric.js handles this automatically
            });
            break;
        case 'top-left':
            labelLeft = imageLeft;
            labelTop = imageTop - 25;
            label.set({ 
                textAlign: 'left', 
                originX: 'left'
            });
            break;
        case 'top-right':
            labelLeft = imageLeft + imageWidth;
            labelTop = imageTop - 25;
            label.set({ 
                textAlign: 'right', 
                originX: 'right'
            });
            break;
        case 'bottom':
            labelLeft = imageLeft + imageWidth / 2;
            labelTop = imageTop + imageHeight + 20;
            label.set({ 
                textAlign: 'center', 
                originX: 'center'
            });
            break;
        case 'bottom-left':
            labelLeft = imageLeft;
            labelTop = imageTop + imageHeight + 20;
            label.set({ 
                textAlign: 'left', 
                originX: 'left'
            });
            break;
        case 'bottom-right':
            labelLeft = imageLeft + imageWidth;
            labelTop = imageTop + imageHeight + 20;
            label.set({ 
                textAlign: 'right', 
                originX: 'right'
            });
            break;
        case 'left':
            labelLeft = imageLeft - 10;
            labelTop = imageTop + imageHeight / 2;
            label.set({ 
                textAlign: 'right', 
                originX: 'right', 
                originY: 'center'
            });
            break;
        case 'right':
            labelLeft = imageLeft + imageWidth + 10;
            labelTop = imageTop + imageHeight / 2;
            label.set({ 
                textAlign: 'left', 
                originX: 'left', 
                originY: 'center'
            });
            break;
        case 'overlay':
            labelLeft = imageLeft + imageWidth / 2;
            labelTop = imageTop + imageHeight - 15;
            label.set({ 
                textAlign: 'center', 
                originX: 'center',
                backgroundColor: 'rgba(0,0,0,0.8)',
                fill: 'white',
                padding: 5
            });
            break;
    }
    
    label.set({ left: labelLeft, top: labelTop });
}

function autoArrangeImages() {
    if (!fabricCanvas) return;
    
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    const objects = canvasObjects;
    
    if (objects.length === 0) return;
    
    // Get current spacing setting
    const spacing = parseInt(document.getElementById('spacingSlider')?.value || 20);
    
    const cols = Math.ceil(Math.sqrt(objects.length));
    const rows = Math.ceil(objects.length / cols);
    
    const cellWidth = (canvasWidth - (spacing * (cols + 1))) / cols;
    const cellHeight = (canvasHeight - (spacing * (rows + 1))) / rows;
    
    objects.forEach((obj, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = spacing + (col * (cellWidth + spacing));
        const y = spacing + (row * (cellHeight + spacing));
        
        // Calculate max size for this cell
        const maxWidth = cellWidth - (spacing * 0.5);
        const maxHeight = cellHeight - (spacing * 0.5);
        
        // Scale to fit cell with spacing
        const scale = Math.min(
            maxWidth / obj.width,
            maxHeight / obj.height,
            1
        );
        
        obj.set({ 
            left: x, 
            top: y,
            scaleX: scale,
            scaleY: scale
        });
        
        if (obj.label) {
            const position = document.getElementById('labelPosition')?.value || 'bottom';
            positionLabel(obj.label, obj, position);
        }
    });
    
    fabricCanvas.renderAll();
    console.log(`📐 Auto-arranged with ${spacing}px spacing`);
}


// Canvas control functions
// Arrange images in specific grid layout on canvas
function autoArrangeImagesInGrid(cols, rows) {
    if (!fabricCanvas || canvasObjects.length === 0) return;
    
    const canvasWidth = fabricCanvas.getWidth();
    const canvasHeight = fabricCanvas.getHeight();
    const spacing = parseInt(document.getElementById('spacingSlider')?.value || 20);
    
    const cellWidth = (canvasWidth - (spacing * (cols + 1))) / cols;
    const cellHeight = (canvasHeight - (spacing * (rows + 1))) / rows;
    
    canvasObjects.forEach((obj, index) => {
        if (index >= cols * rows) return; // Skip excess images
        
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        const x = spacing + (col * (cellWidth + spacing));
        const y = spacing + (row * (cellHeight + spacing));
        
        // Calculate max size for this cell
        const maxWidth = cellWidth - (spacing * 0.5);
        const maxHeight = cellHeight - (spacing * 0.5);
        
        // Scale to fit cell
        const scale = Math.min(
            maxWidth / obj.width,
            maxHeight / obj.height,
            1
        );
        
        obj.set({ 
            left: x, 
            top: y,
            scaleX: scale,
            scaleY: scale
        });
        
        // Update label position
        if (obj.label) {
            const position = document.getElementById('labelPosition')?.value || 'bottom';
            positionLabel(obj.label, obj, position);
        }
    });
    
    fabricCanvas.renderAll();
    console.log(`📐 Arranged ${canvasObjects.length} images in ${cols}×${rows} grid with ${spacing}px spacing`);
}


// Update all labels when position setting changes
function updateAllCanvasLabels() {
    if (!fabricCanvas) return;
    
    const position = document.getElementById('labelPosition')?.value || 'bottom';
    console.log('🏷️ Updating all canvas labels to:', position);
    
    canvasObjects.forEach(obj => {
        if (obj.label) {
            // Remove old label
            fabricCanvas.remove(obj.label);
        }
        
        // Add new label with updated position
        if (position !== 'none') {
            addLabelToImage(obj);
        }
    });
    
    fabricCanvas.renderAll();
}


// Event handlers
function onObjectModified(e) {
    const obj = e.target;
    if (obj.label) {
        const position = document.getElementById('labelPosition')?.value || 'bottom';
        positionLabel(obj.label, obj, position);
        fabricCanvas.renderAll();
    }
}


function onObjectMoving(e) {
    // Update label position while dragging
    onObjectModified(e);
}

function onObjectScaling(e) {
    // Update label position while scaling
    const obj = e.target;
    if (obj.label) {
        const position = document.getElementById('labelPosition')?.value || 'bottom';
        positionLabel(obj.label, obj, position);
        fabricCanvas.renderAll();
    }
}

function onObjectRotating(e) {
    // Update label position while rotating
    const obj = e.target;
    if (obj.label) {
        const position = document.getElementById('labelPosition')?.value || 'bottom';
        positionLabel(obj.label, obj, position);
        fabricCanvas.renderAll();
    }
}

function onDoubleClick(e) {
    const obj = e.target;
    if (obj && obj.imageData) {
        const newName = prompt('Enter new label:', obj.imageData.name);
        if (newName && newName.trim()) {
            obj.imageData.name = newName.trim();
            if (obj.label) {
                obj.label.set('text', newName.trim());
                fabricCanvas.renderAll();
            }
        }
    }
}


function addGridLines() {
    // Toggle grid implementation
    showGrid = !showGrid;
    
    if (showGrid) {
        // Add grid lines
        const canvasWidth = fabricCanvas.getWidth();
        const canvasHeight = fabricCanvas.getHeight();
        const gridSize = 50;
        
        // Vertical lines
        for (let i = 0; i <= canvasWidth; i += gridSize) {
            const line = new fabric.Line([i, 0, i, canvasHeight], {
                stroke: '#ddd',
                strokeWidth: 1,
                selectable: false,
                evented: false
            });
            gridLines.push(line);
            fabricCanvas.add(line);
            fabricCanvas.sendToBack(line);
        }
        
        // Horizontal lines
        for (let i = 0; i <= canvasHeight; i += gridSize) {
            const line = new fabric.Line([0, i, canvasWidth, i], {
                stroke: '#ddd',
                strokeWidth: 1,
                selectable: false,
                evented: false
            });
            gridLines.push(line);
            fabricCanvas.add(line);
            fabricCanvas.sendToBack(line);
        }
    } else {
        // Remove grid lines
        gridLines.forEach(line => fabricCanvas.remove(line));
        gridLines = [];
    }
    
    fabricCanvas.renderAll();
}

function resetCanvasLayout() {
    addImagesToCanvas();
}

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM loaded!');
    
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFiles);
        console.log('✅ File input ready');
    }
    
    setupEventListeners();
    showElement('debug');

    // Check library availability
    checkLibraries();
});

function checkLibraries() {
    const libraries = [
        { name: 'PDF.js', check: () => typeof pdfjsLib !== 'undefined', required: true },
        { name: 'jsPDF', check: () => typeof window.jspdf !== 'undefined', required: true },
        { name: 'UTIF (TIFF)', check: () => typeof UTIF !== 'undefined', required: false }
        // Removed Tiff.js since we're only using UTIF now
    ];
    
    libraries.forEach(lib => {
        const available = lib.check();
        const status = available ? '✅' : (lib.required ? '❌' : '⚠️');
        console.log(`${status} ${lib.name}: ${available ? 'Available' : 'Not loaded'}`);
    });
    
    // Show warning if critical libraries missing
    const missingRequired = libraries.filter(lib => lib.required && !lib.check());
    if (missingRequired.length > 0) {
        console.warn('❌ Critical libraries missing:', missingRequired.map(lib => lib.name).join(', '));
    }
}


// Setup event listeners for controls
function setupEventListeners() {
    // Background type - show/hide color picker
    const backgroundType = document.getElementById('backgroundType');
    const customBgColor = document.getElementById('customBgColor');
    if (backgroundType && customBgColor) {
        backgroundType.addEventListener('change', (e) => {
            customBgColor.style.display = e.target.value === 'custom' ? 'inline' : 'none';
            updateCanvasBackground(); // Update canvas immediately
        });
    }
}

// Handle file uploads
function handleFiles(event) {
    const files = Array.from(event.target.files);
    console.log(`📁 Processing ${files.length} files`);
    
    updateDebug(`Processing ${files.length} files...`);
    
    let processedCount = 0;
    const totalFiles = files.length;
    
    files.forEach((file, index) => {
        const fileName = file.name.toLowerCase();
        
        console.log(`🔍 Processing: ${file.name} (${file.type})`);
        
        if (fileName.endsWith('.pdf')) {
            processPDF(file, index, () => {
                processedCount++;
                updateProgress(processedCount, totalFiles);
            });
        } else if (fileName.endsWith('.tiff') || fileName.endsWith('.tif')) {
            processTIFF(file, index, () => {
                processedCount++;
                updateProgress(processedCount, totalFiles);
            });
        } else {
            processRegularImage(file, index, () => {
                processedCount++;
                updateProgress(processedCount, totalFiles);
            });
        }
    });
}

// Update processing progress
function updateProgress(processed, total) {
    updateDebug(`Processed ${processed}/${total} files...`);
    
    if (processed === total) {
        console.log('✅ All files processed!');
        showImages();
        showControls();
        autoSetLayout();
    }
}

// Process regular image files
function processRegularImage(file, index, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            images.push({
                id: Date.now() + index,
                src: e.target.result,
                img: img,
                name: file.name.replace(/\.[^/.]+$/, ""),
                file: file.name,
                type: 'image'
            });
            
            console.log(`✅ Image processed: ${file.name}`);
            callback();
        };
        img.onerror = function() {
            console.error(`❌ Failed to load image: ${file.name}`);
            callback();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}




// Process PDF files
function processPDF(file, index, callback) {
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            console.log(`📄 Converting PDF: ${file.name}`);
            
            const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
            console.log(`📖 PDF has ${pdf.numPages} pages`);
            
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context, viewport: viewport }).promise;
            
            const img = new Image();
            img.onload = function() {
                images.push({
                    id: Date.now() + index,
                    src: canvas.toDataURL('image/png'),
                    img: img,
                    name: file.name.replace(/\.[^/.]+$/, "") + " (Page 1)",
                    file: file.name,
                    type: 'pdf',
                    pages: pdf.numPages
                });
                
                console.log(`✅ PDF processed: ${file.name} (${pdf.numPages} pages)`);
                callback();
            };
            img.src = canvas.toDataURL('image/png');
            
        } catch (error) {
            console.error(`❌ Failed to process PDF ${file.name}:`, error);
            callback();
        }
    };
    reader.readAsArrayBuffer(file);
}

// Process TIFF files using UTIF
function processTIFF(file, index, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            console.log(`🖼️ Converting TIFF: ${file.name}`);
            
            // Check if UTIF is available
            if (typeof UTIF === 'undefined') {
                throw new Error('UTIF library not available');
            }
            
            // Parse TIFF using UTIF
            const ifds = UTIF.decode(e.target.result);
            console.log(`📖 TIFF has ${ifds.length} image(s)`);
            
            // Use first image
            const firstImage = ifds[0];
            UTIF.decodeImage(e.target.result, firstImage);
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = firstImage.width;
            canvas.height = firstImage.height;
            const ctx = canvas.getContext('2d');
            
            // Create image data
            const imageData = ctx.createImageData(firstImage.width, firstImage.height);
            
            // Convert RGBA data
            const rgba = new Uint8ClampedArray(firstImage.data);
            imageData.data.set(rgba);
            
            // Put image data on canvas
            ctx.putImageData(imageData, 0, 0);
            
            // Convert to regular image
            const img = new Image();
            img.onload = function() {
                images.push({
                    id: Date.now() + index,
                    src: canvas.toDataURL('image/png'),
                    img: img,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    file: file.name,
                    type: 'tiff'
                });
                
                console.log(`✅ TIFF processed: ${file.name}`);
                callback();
            };
            
            img.onerror = function() {
                console.error(`❌ Failed to create image from TIFF: ${file.name}`);
                callback();
            };
            
            img.src = canvas.toDataURL('image/png');
            
        } catch (error) {
            console.error(`❌ Failed to process TIFF ${file.name}:`, error);
            console.log('📝 TIFF processing failed, but continuing...');
            callback(); // Continue processing other files
        }
    };
    
    reader.onerror = function() {
        console.error(`❌ Failed to read file: ${file.name}`);
        callback();
    };
    
    reader.readAsArrayBuffer(file);
}


// Display uploaded images
function showImages() {
    const section = document.getElementById('uploadedImagesSection');
    const list = document.getElementById('uploadedImagesList');
    const count = document.getElementById('imageCount');
    
    console.log('✅ Updating images list, count:', images.length);
    
    if (!section || !list) return;
    
    section.style.display = 'block';
    section.classList.add('fade-in');
    if (count) count.textContent = `(${images.length} images)`;
    
    list.innerHTML = '';
    images.forEach((img, i) => {
        const typeIcon = getTypeIcon(img.type);
        const extraInfo = img.pages ? ` • ${img.pages} pages` : '';
        
        const div = document.createElement('div');
        div.className = 'uploaded-image-card';
        div.innerHTML = `
            <img src="${img.src}" alt="${img.name}">
            <div class="image-info">
                <input type="text" value="${img.name}" onchange="renameImage(${i}, this.value)" 
                       placeholder="Enter chart label...">
                <small style="color: #666; display: block; margin-top: 8px;">
                    ${typeIcon} ${img.file}${extraInfo}
                </small>
            </div>
        `;
        list.appendChild(div);
    });
}

// Get type icon for display
function getTypeIcon(type) {
    switch (type) {
        case 'pdf': return '📄 PDF';
        case 'tiff': return '🖼️ TIFF';
        default: return '🖼️ Image';
    }
}

// Show control sections
function showControls() {
    console.log('✅ Showing sections...');
    const sections = ['layoutConfig', 'instructions', 'advancedControls', 'controls'];
    sections.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
            element.classList.add('fade-in');
        }
    });
    
    const canvasSection = document.getElementById('canvasSection');
    if (canvasSection) {
        canvasSection.style.display = 'block';
        canvasSection.classList.add('fade-in');
    }
    
    // Initialize interactive canvas
    setTimeout(() => {
        initializeCanvas();
        addImagesToCanvas();
    }, 100);
    
    updateAutoLayoutInfo();
}



// Utility function to show elements
function showElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'block';
        console.log('✅ Showed element:', id);
    }
}

// Update debug display
function updateDebug(text) {
    const debug = document.getElementById('debugText');
    if (debug) debug.textContent = text;
}

// Auto-set optimal layout
function autoSetLayout() {
    const count = images.length;
    console.log('🔧 Auto-setting layout for', count, 'images');
    
    if (count <= 1) { currentCols = 1; currentRows = 1; }
    else if (count <= 2) { currentCols = 2; currentRows = 1; }
    else if (count <= 4) { currentCols = 2; currentRows = 2; }
    else if (count <= 6) { currentCols = 3; currentRows = 2; }
    else if (count <= 9) { currentCols = 3; currentRows = 3; }
    else if (count <= 12) { currentCols = 4; currentRows = 3; }
    else { currentCols = 4; currentRows = 4; }
    
    // Use canvas instead of grid
    if (fabricCanvas) {
        addImagesToCanvas();
    }
}

// Rename image
function renameImage(index, newName) {
    if (images[index]) {
        images[index].name = newName;

        // Update canvas objects
        canvasObjects.forEach(obj => {
            if (obj.originalIndex === index) {
                obj.imageData.name = newName;
                if (obj.label) {
                    obj.label.set('text', newName);
                    fabricCanvas.renderAll();
                }
            }
        });
    }
}

// Set specific layout
function setLayout(cols, rows) {
    console.log('🔧 Setting layout:', cols, 'x', rows);
    
    // Update active button
    document.querySelectorAll('#presetLayouts button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    currentCols = cols;
    currentRows = rows;
    
    // Use canvas instead of old grid
    if (fabricCanvas) {
        autoArrangeImagesInGrid(cols, rows);
    }
}


// Layout type functions
function updateLayoutType() {
    const type = document.querySelector('input[name="layoutType"]:checked')?.value || 'auto';
    console.log('🔧 Layout type:', type);
    
    const autoInfo = document.getElementById('autoLayoutInfo');
    const presetLayouts = document.getElementById('presetLayouts');
    const customGrid = document.getElementById('customGrid');
    
    if (autoInfo) autoInfo.style.display = type === 'auto' ? 'block' : 'none';
    if (presetLayouts) presetLayouts.style.display = type === 'preset' ? 'block' : 'none';
    if (customGrid) customGrid.style.display = type === 'custom' ? 'block' : 'none';
    
    if (type === 'auto' && images.length > 0) {
        autoSetLayout();
    } else if (type === 'custom') {
        updateCustomLayout();
    }
}

function updateCustomLayout() {
    const cols = parseInt(document.getElementById('customCols')?.value) || 3;
    const rows = parseInt(document.getElementById('customRows')?.value) || 2;
    const totalSlots = cols * rows;
    
    const info = document.getElementById('customLayoutInfo');
    if (info) {
        info.textContent = `${cols} × ${rows} grid = ${totalSlots} total slots`;
    }
    
    currentCols = cols;
    currentRows = rows;
    
    // Use canvas instead of old grid
    if (fabricCanvas) {
        autoArrangeImagesInGrid(cols, rows);
    }
}

// Update font sizes when slider changes
function updateCanvasFontSizes() {
    if (!fabricCanvas) return;
    
    const fontSize = parseInt(document.getElementById('fontSlider')?.value || 16);
    
    canvasObjects.forEach(obj => {
        if (obj.label) {
            obj.label.set('fontSize', fontSize);
        }
    });
    
    fabricCanvas.renderAll();
    console.log('📝 Updated canvas font sizes to:', fontSize + 'px');
}



function updateAutoLayoutInfo() {
    const info = document.getElementById('autoLayoutDetails');
    if (info && images.length > 0) {
        info.textContent = `📐 ${currentCols} × ${currentRows} grid (${currentCols * currentRows} slots) for ${images.length} images`;
    }
}

// Generate final image - Canvas only
function generateImage() {
    console.log('🎨 Generating final image from canvas...');
    
    if (!fabricCanvas) {
        console.error('❌ Canvas not initialized!');
        return;
    }
    
    // Get quality multiplier
    const quality = document.getElementById('qualitySelect')?.value || 'large';
    let multiplier;
    switch (quality) {
        case 'medium': multiplier = 1; break;
        case 'large': multiplier = 1.5; break;
        case 'xlarge': multiplier = 2; break;
        case 'ultra': multiplier = 3; break;
        default: multiplier = 1.5;
    }
    
    // Export the canvas directly at high resolution
    const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: multiplier // High resolution based on quality setting
    });
    
    // Update the final canvas
    const finalCanvas = document.getElementById('finalCanvas');
    const ctx = finalCanvas.getContext('2d');
    
    const img = new Image();
    img.onload = function() {
        finalCanvas.width = img.width;
        finalCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Show result
        showElement('finalImagePreview');
        document.getElementById('finalImagePreview').classList.add('fade-in');
        
        console.log('✅ Image generated from canvas!');
        
        setTimeout(() => {
            document.getElementById('finalImagePreview').scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };
    
    img.src = dataURL;
}



// Draw image with label
function drawImageWithLabel(ctx, img, x, y, cellW, cellH, labelPosition, fontSize) {
    const userSpacing = parseInt(document.getElementById('spacingSlider')?.value || 20);
    const layoutStyle = document.getElementById('layoutStyle')?.value || 'normal';
    
    let padding;
    switch (layoutStyle) {
        case 'tight':
            padding = Math.max(userSpacing / 2, 5);
            break;
        case 'touching':
            padding = 2;
            break;
        default:
            padding = Math.max(userSpacing, cellW * 0.02);
    }
    
    const labelHeight = fontSize + 10;
    
    console.log(`🖼️ Drawing ${img.name} with ${fontSize}px font at ${labelPosition} (padding: ${padding}px)`);
    
    // Calculate available space based on label position
    let imageX = x + padding;
    let imageY = y + padding;
    let availableWidth = cellW - (padding * 2);
    let availableHeight = cellH - (padding * 2);
    
    // Adjust image area for top/bottom labels (they need reserved space)
    if (labelPosition.startsWith('top')) {
        imageY += labelHeight + 5;
        availableHeight -= (labelHeight + 5);
    } else if (labelPosition.startsWith('bottom') && labelPosition !== 'bottom-left' && labelPosition !== 'bottom-right') {
        availableHeight -= (labelHeight + 5);
    }
    // Left/right/overlay labels don't need reserved space - they overlap or use margins
    
    // Calculate scaling
    const scale = Math.min(
        availableWidth / img.img.width,
        availableHeight / img.img.height,
        1 // Never upscale
    );
    
    const scaledWidth = img.img.width * scale;
    const scaledHeight = img.img.height * scale;
    
    // Center the image in available space
    const centeredImageX = imageX + (availableWidth - scaledWidth) / 2;
    const centeredImageY = imageY + (availableHeight - scaledHeight) / 2;
    
    // Draw image with high quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img.img, centeredImageX, centeredImageY, scaledWidth, scaledHeight);
    
    // Draw label in the specified position
    if (labelPosition !== 'none') {
        drawLabelAtPosition(ctx, img.name, x, y, cellW, cellH, labelPosition, fontSize, padding, centeredImageX, centeredImageY, scaledWidth, scaledHeight);
    }
}

function drawLabelAtPosition(ctx, labelText, x, y, cellW, cellH, position, fontSize, padding, imageX, imageY, imageWidth, imageHeight) {
    ctx.font = `${fontSize}px Arial`;
    
    let labelX, labelY, textAlign = 'center';
    let needsBackground = false;
    
    switch (position) {
        case 'top':
            labelX = x + cellW / 2;
            labelY = y + padding + fontSize;
            textAlign = 'center';
            break;
            
        case 'top-left':
            labelX = x + padding;
            labelY = y + padding + fontSize;
            textAlign = 'left';
            break;
            
        case 'top-right':
            labelX = x + cellW - padding;
            labelY = y + padding + fontSize;
            textAlign = 'right';
            break;
            
        case 'bottom':
            labelX = x + cellW / 2;
            labelY = y + cellH - padding;
            textAlign = 'center';
            break;
            
        case 'bottom-left':
            labelX = x + padding;
            labelY = y + cellH - padding;
            textAlign = 'left';
            break;
            
        case 'bottom-right':
            labelX = x + cellW - padding;
            labelY = y + cellH - padding;
            textAlign = 'right';
            break;
            
        case 'left':
            labelX = x + padding;
            labelY = y + cellH / 2 + fontSize / 2; // Vertically centered
            textAlign = 'left';
            needsBackground = true; // Overlaps image
            break;
            
        case 'right':
            labelX = x + cellW - padding;
            labelY = y + cellH / 2 + fontSize / 2; // Vertically centered
            textAlign = 'right';
            needsBackground = true; // Overlaps image
            break;
            
        case 'overlay':
            labelX = x + cellW / 2;
            labelY = imageY + imageHeight - 10;
            textAlign = 'center';
            needsBackground = true;
            break;
            
        default:
            return; // Unknown position
    }
    
    ctx.textAlign = textAlign;
    
    // Draw background for overlapping labels
    if (needsBackground) {
        const textWidth = ctx.measureText(labelText).width;
        const backgroundPadding = 8;
        
        let bgX, bgWidth;
        if (textAlign === 'left') {
            bgX = labelX - backgroundPadding;
            bgWidth = textWidth + (backgroundPadding * 2);
        } else if (textAlign === 'right') {
            bgX = labelX - textWidth - backgroundPadding;
            bgWidth = textWidth + (backgroundPadding * 2);
        } else { // center
            bgX = labelX - textWidth/2 - backgroundPadding;
            bgWidth = textWidth + (backgroundPadding * 2);
        }
        
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(
            bgX,
            labelY - fontSize - 4,
            bgWidth,
            fontSize + 8
        );
        
        // White text on background
        ctx.fillStyle = 'white';
    } else {
        // Black text on transparent background
        ctx.fillStyle = 'black';
    }
    
    // Draw the text
    ctx.fillText(labelText, labelX, labelY);
    
    console.log(`📝 Drew label "${labelText}" at ${position} (${labelX.toFixed(0)}, ${labelY.toFixed(0)}) with ${textAlign} alignment`);
}



// Download functions
function downloadImage(format = 'png') {
    console.log('💾 Downloading image as:', format);
    
    const canvas = document.getElementById('finalCanvas');
    if (!canvas) return;
    
    const timestamp = Date.now();
    const filename = `chart-layout-${currentCols}x${currentRows}-${timestamp}`;
    
    switch (format) {
        case 'png': downloadPNG(canvas, filename); break;
        case 'jpg': downloadJPG(canvas, filename); break;
        case 'pdf': downloadPDF(canvas, filename); break;
        case 'tiff': downloadTIFF(canvas, filename); break;
        default: downloadPNG(canvas, filename);
    }
}

function downloadPNG(canvas, filename) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${filename}.png`;
    link.click();
    console.log('✅ PNG download triggered!');
}

function downloadJPG(canvas, filename) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = `${filename}.jpg`;
    link.click();
    console.log('✅ JPG download triggered!');
}

function downloadPDF(canvas, filename) {
    try {
        console.log('📄 Generating PDF...');
        
        const dpi = parseInt(document.getElementById('pdfDPI')?.value || 300);
        const pdfWidth = (canvas.width / dpi) * 25.4;
        const pdfHeight = (canvas.height / dpi) * 25.4;
        
        console.log(`📐 PDF: ${pdfWidth.toFixed(1)}×${pdfHeight.toFixed(1)}mm at ${dpi} DPI`);
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [pdfWidth, pdfHeight]
        });
        
        const imgData = canvas.toDataURL('image/png', 1.0);
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');
        
        pdf.setProperties({
            title: `Chart Layout ${currentCols}×${currentRows}`,
            subject: `Scientific Chart Grid - ${dpi} DPI`,
            author: 'Chart Layout Tool',
            creator: 'Chart Layout Tool'
        });
        
        pdf.save(`${filename}.pdf`);
        console.log('✅ PDF generated successfully!');
        
    } catch (error) {
        console.error('❌ PDF generation failed:', error);
        alert('PDF generation failed. Try PNG instead.');
    }
}

function downloadTIFF(canvas, filename) {
    try {
        console.log('🖼️ Generating TIFF...');
        
        // Check if UTIF library is available
        if (typeof UTIF === 'undefined') {
            console.error('❌ UTIF library not loaded');
            alert('TIFF export not available. The TIFF library failed to load. Try PNG instead.');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Convert ImageData to RGBA array
        const rgba = new Uint8Array(imageData.data);
        
        // Create TIFF using UTIF
        const tiffData = UTIF.encodeImage(rgba, canvas.width, canvas.height);
        
        // Create blob and download
        const blob = new Blob([tiffData], { type: 'image/tiff' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.tiff`;
        link.click();
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        
        console.log('✅ TIFF generated and downloaded!');
        
    } catch (error) {
        console.error('❌ TIFF generation failed:', error);
        alert('TIFF generation failed. This might be due to a library issue. Try PNG instead.');
    }
}


// Utility functions
function clearLayout() { 
    console.log('🗑️ Clearing canvas layout...');
    if (fabricCanvas) {
        fabricCanvas.clear();
        canvasObjects = [];
        gridLines = [];
        showGrid = false;
        fabricCanvas.renderAll();
    }
}

// Reset all - Canvas only  
function resetAll() { 
    if (confirm('🔄 This will remove all images and start over. Are you sure?')) {
        console.log('🔄 Resetting everything...');
        images = [];
        canvasObjects = [];
        if (fabricCanvas) {
            fabricCanvas.clear();
        }
        
        // Hide sections
        ['uploadedImagesSection', 'canvasSection', 'layoutConfig', 
         'instructions', 'advancedControls', 'controls', 'finalImagePreview'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Reset file input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) fileInput.value = '';
        
        updateDebug('Ready to upload new images');
    }
}

async function copyToClipboard() {
    try {
        const canvas = document.getElementById('finalCanvas');
        if (!canvas) return;
        
        canvas.toBlob(async (blob) => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                ]);
                alert('✅ Image copied to clipboard!');
            } catch (err) {
                alert('❌ Failed to copy to clipboard. Try downloading instead.');
            }
        });
    } catch (err) {
        alert('❌ Clipboard not supported in this browser. Try downloading instead.');
    }
}

// Update canvas spacing in real-time
function updateCanvasSpacing() {
    if (!fabricCanvas) return;
    
    updateCanvasWithFeedback(() => {
        const spacing = parseInt(document.getElementById('spacingSlider')?.value || 20);
        document.getElementById('spacingValue').textContent = spacing + 'px';
        autoArrangeImages();
    }, '📏 Spacing updated');
}

// Update canvas background in real-time
function updateCanvasBackground() {
    if (!fabricCanvas) return;

    updateCanvasWithFeedback(() => {
    const backgroundType = document.getElementById('backgroundType')?.value || 'white';
    const customColor = document.getElementById('customBgColor')?.value || '#ffffff';
    
    let backgroundColor = 'white';
    
    switch (backgroundType) {
        case 'white':
            backgroundColor = 'white';
            break;
        case 'transparent':
            backgroundColor = 'transparent';
            break;
        case 'light':
            backgroundColor = '#f5f5f5';
            break;
        case 'custom':
            backgroundColor = customColor;
            break;
    }
    
    fabricCanvas.setBackgroundColor(backgroundColor, fabricCanvas.renderAll.bind(fabricCanvas));
    console.log('🎨 Updated canvas background to:', backgroundColor);
    }, '🎨 Updated canvas background');
}

// Update canvas quality/size in real-time
function updateCanvasQuality() {
    if (!fabricCanvas) return;
    
    const quality = document.getElementById('qualitySelect')?.value || 'large';
    let canvasWidth, canvasHeight;
    
    switch (quality) {
        case 'medium': canvasWidth = 800; canvasHeight = 500; break;
        case 'large': canvasWidth = 1000; canvasHeight = 600; break;
        case 'xlarge': canvasWidth = 1200; canvasHeight = 720; break;
        case 'ultra': canvasWidth = 1400; canvasHeight = 840; break;
        default: canvasWidth = 1000; canvasHeight = 600;
    }
    
    // Store current objects
    const currentObjects = [...canvasObjects];
    const currentBackground = fabricCanvas.backgroundColor;
    
    // Resize canvas
    fabricCanvas.setDimensions({
        width: canvasWidth,
        height: canvasHeight
    });
    
    // Restore background
    fabricCanvas.setBackgroundColor(currentBackground, fabricCanvas.renderAll.bind(fabricCanvas));
    
    // Re-arrange objects to fit new size
    autoArrangeImages();
    
    console.log(`🔍 Updated canvas size to: ${canvasWidth}×${canvasHeight} (${quality})`);
}

function updateCanvasWithFeedback(updateFunction, message) {
    const canvas = document.getElementById('layoutCanvas');
    canvas.classList.add('canvas-updating');
    
    setTimeout(() => {
        updateFunction();
        canvas.classList.remove('canvas-updating');
        if (message) console.log(message);
    }, 50);
}



