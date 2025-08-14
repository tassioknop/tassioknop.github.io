// Global variables
let uploadedImages = [];
let currentCols = 2;
let currentRows = 2;
let slotAssignments = {}; // slotIndex -> imageIndex
let draggedImageIndex = null;
let draggedFromSlot = null;
let currentLayoutType = 'auto';

console.log('Script loaded!');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded!');
    
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
        console.log('File input listener added!');
    }
    
    // Show debug section
    const debug = document.getElementById('debug');
    if (debug) debug.style.display = 'block';
    
    // Setup event listeners for sliders
    setupEventListeners();
});

function setupEventListeners() {
    // Spacing slider
    const spacingSlider = document.getElementById('spacingSlider');
    const spacingValue = document.getElementById('spacingValue');
    if (spacingSlider && spacingValue) {
        spacingSlider.addEventListener('input', (e) => {
            spacingValue.textContent = e.target.value + 'px';
        });
    }
    
    // Font slider
    const fontSlider = document.getElementById('fontSlider');
    const fontValue = document.getElementById('fontValue');
    if (fontSlider && fontValue) {
        fontSlider.addEventListener('input', (e) => {
            fontValue.textContent = e.target.value + 'px';
        });
    }
    
    // Background type
    const backgroundType = document.getElementById('backgroundType');
    const customBgColor = document.getElementById('customBgColor');
    if (backgroundType && customBgColor) {
        backgroundType.addEventListener('change', (e) => {
            customBgColor.style.display = e.target.value === 'custom' ? 'inline' : 'none';
        });
    }
}

function handleImageUpload(event) {
    console.log('File upload triggered!', event.target.files.length, 'files');
    
    const files = Array.from(event.target.files);
    const debugText = document.getElementById('debugText');
    if (debugText) {
        debugText.textContent = `Processing ${files.length} files...`;
    }
    
    let processedCount = 0;
    
    files.forEach((file, index) => {
        console.log('Processing file:', file.name);
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const imageData = {
                    id: Date.now() + index,
                    src: e.target.result,
                    image: img,
                    label: file.name.replace(/\.[^/.]+$/, ""),
                    originalName: file.name
                };
                
                uploadedImages.push(imageData);
                processedCount++;
                
                console.log('Image processed:', imageData.label);
                if (debugText) {
                    debugText.textContent = `Processed ${processedCount}/${files.length} images`;
                }
                
                updateUploadedImagesList();
                showRelevantSections();
                
                if (processedCount === files.length) {
                    autoSetLayout();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function updateUploadedImagesList() {
    const section = document.getElementById('uploadedImagesSection');
    const list = document.getElementById('uploadedImagesList');
    const count = document.getElementById('imageCount');
    
    console.log('Updating images list, count:', uploadedImages.length);
    
    if (uploadedImages.length === 0) {
        if (section) section.style.display = 'none';
        return;
    }
    
    if (section) section.style.display = 'block';
    if (count) count.textContent = `(${uploadedImages.length} images)`;
    if (!list) return;
    
    list.innerHTML = '';
    
    uploadedImages.forEach((img, index) => {
        const card = document.createElement('div');
        card.className = 'uploaded-image-card';
        card.draggable = true;
        card.dataset.imageIndex = index;
        
        card.innerHTML = `
            <img src="${img.src}" alt="${img.label}">
            <div class="image-info">
                <input type="text" 
                       value="${img.label}" 
                       onchange="updateImageLabel(${index}, this.value)"
                       placeholder="Enter chart label...">
                <small style="color: #666; display: block; margin-top: 8px;">
                    📁 ${img.originalName}
                </small>
            </div>
        `;
        
        setupImageDragAndDrop(card, index);
        list.appendChild(card);
    });
}

function setupImageDragAndDrop(card, imageIndex) {
    card.addEventListener('dragstart', (e) => {
        console.log('Drag started for image:', imageIndex);
        draggedImageIndex = imageIndex;
        draggedFromSlot = findSlotWithImage(imageIndex);
        card.classList.add('dragging');
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    });
    
    card.addEventListener('dragend', (e) => {
        card.classList.remove('dragging');
        draggedImageIndex = null;
        draggedFromSlot = null;
    });
}

function findSlotWithImage(imageIndex) {
    for (let slotIndex in slotAssignments) {
        if (slotAssignments[slotIndex] === imageIndex) {
            return parseInt(slotIndex);
        }
    }
    return null;
}

function showRelevantSections() {
    console.log('Showing sections...');
    
    // List of section IDs to show
    const sectionIds = [
        'layoutConfig',
        'instructions',
        'advancedControls', 
        'controls'
    ];
    
    sectionIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'block';
            console.log('Showed section:', id);
        } else {
            console.log('Section not found:', id);
        }
    });
    
    // Update auto layout info
    updateAutoLayoutInfo();
}

function updateAutoLayoutInfo() {
    const info = document.getElementById('autoLayoutDetails');
    if (info && uploadedImages.length > 0) {
        const optimal = calculateOptimalGrid(uploadedImages.length);
        info.textContent = `📐 ${optimal.cols} × ${optimal.rows} grid (${optimal.cols * optimal.rows} slots) for ${uploadedImages.length} images`;
    }
}

function calculateOptimalGrid(imageCount) {
    if (imageCount <= 1) return { cols: 1, rows: 1 };
    if (imageCount <= 2) return { cols: 2, rows: 1 };
    if (imageCount <= 4) return { cols: 2, rows: 2 };
    if (imageCount <= 6) return { cols: 3, rows: 2 };
    if (imageCount <= 9) return { cols: 3, rows: 3 };
    if (imageCount <= 12) return { cols: 4, rows: 3 };
    
    const cols = Math.ceil(Math.sqrt(imageCount));
    const rows = Math.ceil(imageCount / cols);
    return { cols, rows };
}

function updateLayoutType() {
    const checked = document.querySelector('input[name="layoutType"]:checked');
    if (!checked) return;
    
    const layoutType = checked.value;
    console.log('Layout type changed to:', layoutType);
    currentLayoutType = layoutType;
    
    // Show/hide sections
    const autoInfo = document.getElementById('autoLayoutInfo');
    const presetLayouts = document.getElementById('presetLayouts');
    const customGrid = document.getElementById('customGrid');
    
    if (autoInfo) autoInfo.style.display = layoutType === 'auto' ? 'block' : 'none';
    if (presetLayouts) presetLayouts.style.display = layoutType === 'preset' ? 'block' : 'none';
    if (customGrid) customGrid.style.display = layoutType === 'custom' ? 'block' : 'none';
    
    if (layoutType === 'auto' && uploadedImages.length > 0) {
        autoSetLayout();
    } else if (layoutType === 'custom') {
        updateCustomLayout();
    }
}

function updateCustomLayout() {
    const colsInput = document.getElementById('customCols');
    const rowsInput = document.getElementById('customRows');
    const info = document.getElementById('customLayoutInfo');
    
    if (!colsInput || !rowsInput) return;
    
    const cols = parseInt(colsInput.value) || 3;
    const rows = parseInt(rowsInput.value) || 2;
    const totalSlots = cols * rows;
    
    if (info) {
        info.textContent = `${cols} × ${rows} grid = ${totalSlots} total slots`;
    }
    
    currentCols = cols;
    currentRows = rows;
    
    if (uploadedImages.length > 0) {
        createLayoutSlots();
        autoAssignImages();
    }
}

function autoSetLayout() {
    console.log('Auto-setting layout for', uploadedImages.length, 'images');
    
    const optimal = calculateOptimalGrid(uploadedImages.length);
    currentCols = optimal.cols;
    currentRows = optimal.rows;
    
    createLayoutSlots();
    autoAssignImages();
}

function setLayout(cols, rows) {
    console.log('Setting layout:', cols, 'x', rows);
    
    // Update active button
    document.querySelectorAll('#presetLayouts button').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    currentCols = cols;
    currentRows = rows;
    currentLayoutType = 'preset';
    
    createLayoutSlots();
    autoAssignImages();
}

function createLayoutSlots() {
    const preview = document.getElementById('layoutPreview');
    if (!preview) {
        console.error('Layout preview not found!');
        return;
    }
    
    const totalSlots = currentCols * currentRows;
    console.log('Creating', totalSlots, 'slots in', currentCols, 'x', currentRows, 'grid');
    
    preview.innerHTML = '';
    preview.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
    preview.style.display = 'grid';
    
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'chart-slot';
        slot.dataset.slotIndex = i;
        
        // Add slot number
        const slotNumber = document.createElement('div');
        slotNumber.className = 'slot-number';
        slotNumber.textContent = i + 1;
        slot.appendChild(slotNumber);
        
        // Add content
        const content = document.createElement('p');
        content.textContent = 'Drop image here';
        slot.appendChild(content);
        
        // Add select dropdown
        const select = document.createElement('select');
        select.className = 'slot-select';
        select.innerHTML = `
            <option value="">Select image...</option>
            ${uploadedImages.map((img, idx) => 
                `<option value="${idx}">${img.label}</option>`
            ).join('')}
        `;
        select.onchange = (e) => assignImageToSlot(i, e.target.value);
        slot.appendChild(select);
        
        setupSlotDragAndDrop(slot, i);
        preview.appendChild(slot);
    }
}

function setupSlotDragAndDrop(slot, slotIndex) {
    slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (draggedImageIndex !== null) {
            slot.classList.add('drag-over');
        }
    });
    
    slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
    });
    
    slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        
        if (draggedImageIndex !== null) {
            console.log('Dropping image', draggedImageIndex, 'onto slot', slotIndex);
            
            const currentImageInSlot = slotAssignments[slotIndex];
            
            if (draggedFromSlot !== null && currentImageInSlot !== undefined) {
                // Swap images
                slotAssignments[slotIndex] = draggedImageIndex;
                slotAssignments[draggedFromSlot] = currentImageInSlot;
            } else if (draggedFromSlot !== null) {
                // Move image
                slotAssignments[slotIndex] = draggedImageIndex;
                delete slotAssignments[draggedFromSlot];
            } else {
                // New assignment
                slotAssignments[slotIndex] = draggedImageIndex;
            }
            
            updateAllSlots();
        }
    });
    
    // Right-click to remove
    slot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        if (slotAssignments[slotIndex] !== undefined) {
            delete slotAssignments[slotIndex];
            updateSlotContent(slot, slotIndex);
        }
    });
}

function autoAssignImages() {
    console.log('Auto-assigning images...');
    slotAssignments = {};
    uploadedImages.forEach((img, index) => {
        if (index < currentCols * currentRows) {
            slotAssignments[index] = index;
        }
    });
    updateAllSlots();
}

function updateAllSlots() {
    const slots = document.querySelectorAll('.chart-slot');
    slots.forEach((slot, index) => {
        updateSlotContent(slot, index);
    });
}

function updateSlotContent(slot, slotIndex) {
    const imageIndex = slotAssignments[slotIndex];
    const slotNumber = slot.querySelector('.slot-number');
    
    // Clear and rebuild slot
    slot.innerHTML = '';
    
    // Re-add slot number
    const newSlotNumber = document.createElement('div');
    newSlotNumber.className = 'slot-number';
    newSlotNumber.textContent = parseInt(slotIndex) + 1;
    slot.appendChild(newSlotNumber);
    
    if (imageIndex !== undefined && uploadedImages[imageIndex]) {
        // Has image - show it
        const img = uploadedImages[imageIndex];
        slot.className = 'chart-slot has-image';
        
        const imgElement = document.createElement('img');
        imgElement.src = img.src;
        imgElement.alt = img.label;
        slot.appendChild(imgElement);
        
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = img.label;
        slot.appendChild(label);
        
        const select = document.createElement('select');
        select.className = 'slot-select';
        select.innerHTML = `
            <option value="">Remove image</option>
            ${uploadedImages.map((img, idx) => 
                `<option value="${idx}" ${idx == imageIndex ? 'selected' : ''}>${img.label}</option>`
            ).join('')}
        `;
        select.onchange = (e) => assignImageToSlot(slotIndex, e.target.value);
        slot.appendChild(select);
    } else {
        // Empty slot
        slot.className = 'chart-slot';
        
        const content = document.createElement('p');
        content.textContent = 'Drop image here';
        slot.appendChild(content);
        
        const select = document.createElement('select');
        select.className = 'slot-select';
        select.innerHTML = `
            <option value="">Select image...</option>
            ${uploadedImages.map((img, idx) => 
                `<option value="${idx}">${img.label}</option>`
            ).join('')}
        `;
        select.onchange = (e) => assignImageToSlot(slotIndex, e.target.value);
        slot.appendChild(select);
    }
}

function assignImageToSlot(slotIndex, imageIndex) {
    console.log('Assigning image', imageIndex, 'to slot', slotIndex);
    
    if (imageIndex === '' || imageIndex === null) {
        delete slotAssignments[slotIndex];
    } else {
        slotAssignments[slotIndex] = parseInt(imageIndex);
    }
    
    const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    if (slot) {
        updateSlotContent(slot, slotIndex);
    }
}

function updateImageLabel(imageIndex, newLabel) {
    console.log('Updating label for image', imageIndex, 'to:', newLabel);
    if (uploadedImages[imageIndex]) {
        uploadedImages[imageIndex].label = newLabel;
        updateAllSlots();
    }
}

function generateImage() {
    console.log('Generating final image...');
    
    const canvas = document.getElementById('finalCanvas');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Get settings with defaults
    const spacing = parseInt(document.getElementById('spacingSlider')?.value || 20);
    const fontSize = parseInt(document.getElementById('fontSlider')?.value || 16);
    const labelPosition = document.getElementById('labelPosition')?.value || 'bottom';
    const backgroundType = document.getElementById('backgroundType')?.value || 'white';
    
    // Set canvas size
    const cellWidth = 400;
    const cellHeight = 300;
    
    canvas.width = (cellWidth * currentCols) + (spacing * (currentCols + 1));
    canvas.height = (cellHeight * currentRows) + (spacing * (currentRows + 1));
    
    // Set background
    if (backgroundType !== 'transparent') {
        let bgColor = 'white';
        if (backgroundType === 'light') bgColor = '#f5f5f5';
        if (backgroundType === 'custom') bgColor = document.getElementById('customBgColor')?.value || 'white';
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw each assigned image
    Object.keys(slotAssignments).forEach(slotIndex => {
        const imageIndex = slotAssignments[slotIndex];
        const img = uploadedImages[imageIndex];
        
        if (img) {
            const row = Math.floor(slotIndex / currentCols);
            const col = slotIndex % currentCols;
            
            const x = spacing + (col * (cellWidth + spacing));
            const y = spacing + (row * (cellHeight + spacing));
            
            drawImageInCell(ctx, img, x, y, cellWidth, cellHeight, fontSize, labelPosition);
        }
    });
    
    // Show result
    const preview = document.getElementById('finalImagePreview');
    if (preview) {
        preview.style.display = 'block';
        
        // Enable download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) downloadBtn.disabled = false;
        
        console.log('Image generated!');
        
        // Scroll to preview
        setTimeout(() => {
            preview.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

function drawImageInCell(ctx, imgData, x, y, cellWidth, cellHeight, fontSize, labelPosition) {
    const padding = 20;
    const labelHeight = labelPosition === 'none' ? 0 : fontSize + 15;
    
    let availableWidth = cellWidth - (padding * 2);
    let availableHeight = cellHeight - (padding * 2);
    let imageY = y + padding;
    
    if (labelPosition === 'top' || labelPosition === 'bottom') {
        availableHeight -= labelHeight;
        if (labelPosition === 'top') {
            imageY += labelHeight;
        }
    }
    
    // Calculate scaling
    const scale = Math.min(
        availableWidth / imgData.image.width,
        availableHeight / imgData.image.height
    );
    
    const scaledWidth = imgData.image.width * scale;
    const scaledHeight = imgData.image.height * scale;
    
    // Center the image
    const imageX = x + padding + (availableWidth - scaledWidth) / 2;
    const centeredImageY = imageY + (availableHeight - scaledHeight) / 2;
    
    // Draw image
    ctx.drawImage(imgData.image, imageX, centeredImageY, scaledWidth, scaledHeight);
    
    // Draw label
    if (labelPosition !== 'none') {
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        
        const labelX = x + cellWidth / 2;
        let labelY;
        
        switch (labelPosition) {
            case 'top':
                labelY = y + padding + fontSize;
                break;
            case 'bottom':
                labelY = y + cellHeight - padding/2;
                break;
            case 'overlay':
                labelY = centeredImageY + scaledHeight - 10;
                const textWidth = ctx.measureText(imgData.label).width;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(labelX - textWidth/2 - 8, labelY - fontSize - 4, textWidth + 16, fontSize + 8);
                ctx.fillStyle = 'black';
                break;
        }
        
        ctx.fillText(imgData.label, labelX, labelY);
    }
}

function clearLayout() {
    console.log('Clearing layout...');
    slotAssignments = {};
    updateAllSlots();
}

function resetAll() {
    if (confirm('This will remove all images and start over. Are you sure?')) {
        uploadedImages = [];
        slotAssignments = {};
        
        // Hide sections
        const sections = ['uploadedImagesSection', 'layoutConfig', 'instructions', 
                         'layoutPreview', 'advancedControls', 'controls', 'finalImagePreview'];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
        
        // Reset file input
        const fileInput = document.getElementById('imageUpload');
        if (fileInput) fileInput.value = '';
        
        const debugText = document.getElementById('debugText');
        if (debugText) debugText.textContent = 'Ready to upload new images';
    }
}

function downloadImage(format = 'png') {
    console.log('Downloading image as:', format);
    
    const canvas = document.getElementById('finalCanvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    const quality = 0.9;
    
    if (format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg', quality);
        link.download = `chart-layout-${currentCols}x${currentRows}-${Date.now()}.jpg`;
    } else {
        link.href = canvas.toDataURL('image/png');
        link.download = `chart-layout-${currentCols}x${currentRows}-${Date.now()}.png`;
    }
    
    link.click();
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
