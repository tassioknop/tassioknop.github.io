// Chart Layout Tool - Complete Fixed Version
let images = [];
let currentCols = 2;
let currentRows = 2;
let slots = {};

console.log('🚀 Script loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM loaded!');
    
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleFiles);
        console.log('✅ File input ready');
    }
    
    showElement('debug');
});

function handleFiles(event) {
    const files = Array.from(event.target.files);
    console.log(`📁 Processing ${files.length} files`);
    
    updateDebug(`Processing ${files.length} files...`);
    
    let count = 0;
    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                images.push({
                    id: Date.now() + index,
                    src: e.target.result,
                    img: img,
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    file: file.name
                });
                
                count++;
                console.log(`✅ Image processed: ${file.name}`);
                updateDebug(`Processed ${count}/${files.length} images`);
                
                showImages();
                showControls();
                
                if (count === files.length) {
                    autoSetLayout();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function showImages() {
    const section = document.getElementById('uploadedImagesSection');
    const list = document.getElementById('uploadedImagesList');
    const count = document.getElementById('imageCount');
    
    console.log('✅ Updating images list, count:', images.length);
    
    if (!section || !list) return;
    
    section.style.display = 'block';
    if (count) count.textContent = `(${images.length} images)`;
    
    list.innerHTML = '';
    images.forEach((img, i) => {
        const div = document.createElement('div');
        div.className = 'uploaded-image-card';
        div.innerHTML = `
            <img src="${img.src}" alt="${img.name}" style="width: 80px; height: 60px; object-fit: cover; margin-right: 15px;">
            <div style="flex: 1;">
                <input type="text" value="${img.name}" onchange="renameImage(${i}, this.value)" 
                       style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <small style="color: #666; display: block; margin-top: 5px;">📁 ${img.file}</small>
            </div>
        `;
        list.appendChild(div);
    });
}

function showControls() {
    console.log('✅ Showing sections...');
    showElement('layoutConfig');
    showElement('instructions'); 
    showElement('advancedControls');
    showElement('controls');
}

function showElement(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'block';
        console.log('✅ Showed section:', id);
    } else {
        console.log('❌ Section not found:', id);
    }
}

function updateDebug(text) {
    const debug = document.getElementById('debugText');
    if (debug) debug.textContent = text;
}

function autoSetLayout() {
    // Auto-calculate grid size
    const count = images.length;
    console.log('🔧 Auto-setting layout for', count, 'images');
    
    if (count <= 1) { currentCols = 1; currentRows = 1; }
    else if (count <= 2) { currentCols = 2; currentRows = 1; }
    else if (count <= 4) { currentCols = 2; currentRows = 2; }
    else if (count <= 6) { currentCols = 3; currentRows = 2; }
    else if (count <= 9) { currentCols = 3; currentRows = 3; }
    else { currentCols = 4; currentRows = 3; }
    
    createGrid();
}

function createGrid() {
    console.log(`🔧 Creating ${currentCols}x${currentRows} grid`);
    
    const preview = document.getElementById('layoutPreview');
    if (!preview) return;
    
    preview.style.display = 'grid';
    preview.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
    preview.style.gap = '20px';
    preview.style.padding = '20px';
    preview.innerHTML = '';
    
    const totalSlots = currentCols * currentRows;
    console.log(`📐 Creating ${totalSlots} slots in ${currentCols} x ${currentRows} grid`);
    
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'chart-slot';
        slot.dataset.slot = i;
        slot.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; background: #007bff; color: white; 
                        width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-size: 12px; font-weight: bold;">${i + 1}</div>
            <p>Slot ${i + 1}</p>
            <select onchange="assignImage(${i}, this.value)" style="margin-top: 10px; padding: 5px;">
                <option value="">Select image...</option>
                ${images.map((img, idx) => `<option value="${idx}">${img.name}</option>`).join('')}
            </select>
        `;
        preview.appendChild(slot);
    }
    
    // Auto-assign images
    console.log('🎯 Auto-assigning images...');
    images.forEach((img, i) => {
        if (i < totalSlots) {
            slots[i] = i;
            assignImage(i, i);
        }
    });
}

function assignImage(slotIndex, imageIndex) {
    const slot = document.querySelector(`[data-slot="${slotIndex}"]`);
    if (!slot) return;
    
    if (imageIndex === '' || imageIndex < 0) {
        // Clear slot
        delete slots[slotIndex];
        slot.className = 'chart-slot';
        slot.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; background: #007bff; color: white; 
                        width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-size: 12px; font-weight: bold;">${parseInt(slotIndex) + 1}</div>
            <p>Slot ${parseInt(slotIndex) + 1}</p>
            <select onchange="assignImage(${slotIndex}, this.value)" style="margin-top: 10px; padding: 5px;">
                <option value="">Select image...</option>
                ${images.map((img, idx) => `<option value="${idx}">${img.name}</option>`).join('')}
            </select>
        `;
    } else {
        // Assign image
        const img = images[imageIndex];
        slots[slotIndex] = parseInt(imageIndex);
        slot.className = 'chart-slot has-image';
        slot.innerHTML = `
            <div style="position: absolute; top: 5px; left: 5px; background: #007bff; color: white; 
                        width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; 
                        justify-content: center; font-size: 12px; font-weight: bold;">${parseInt(slotIndex) + 1}</div>
            <img src="${img.src}" alt="${img.name}" style="max-width: calc(100% - 20px); max-height: calc(100% - 60px); object-fit: contain;">
            <div style="position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%); 
                        background: rgba(0,0,0,0.8); color: white; padding: 4px 8px; border-radius: 4px; 
                        font-size: 12px; max-width: calc(100% - 10px); text-align: center;">${img.name}</div>
            <select onchange="assignImage(${slotIndex}, this.value)" style="margin-top: 10px; padding: 5px;">
                <option value="">Remove image</option>
                ${images.map((img, idx) => `<option value="${idx}" ${idx == imageIndex ? 'selected' : ''}>${img.name}</option>`).join('')}
            </select>
        `;
    }
}

function renameImage(index, newName) {
    if (images[index]) {
        images[index].name = newName;
        createGrid(); // Refresh grid to show new names
    }
}

function setLayout(cols, rows) {
    currentCols = cols;
    currentRows = rows;
    slots = {}; // Clear assignments
    createGrid();
}

function generateImage() {
    console.log('🎨 Generating final image...');
    
    const canvas = document.getElementById('finalCanvas');
    if (!canvas) {
        console.error('❌ Canvas not found!');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Get quality setting
    const quality = document.getElementById('qualitySelect')?.value || 'large';
    
    let cellW, cellH, spacing;
    switch (quality) {
        case 'small':  cellW = 400;  cellH = 300;  spacing = 20; break;
        case 'medium': cellW = 800;  cellH = 600;  spacing = 25; break;
        case 'large':  cellW = 1200; cellH = 900;  spacing = 30; break;
        case 'xlarge': cellW = 1600; cellH = 1200; spacing = 40; break;
        case 'ultra':  cellW = 2400; cellH = 1800; spacing = 50; break;
        default:       cellW = 1200; cellH = 900;  spacing = 30;
    }
    
    console.log(`📐 Using ${cellW}×${cellH} per cell (${quality} quality)`);
    
    // Set canvas size
    canvas.width = (cellW * currentCols) + (spacing * (currentCols + 1));
    canvas.height = (cellH * currentRows) + (spacing * (currentRows + 1));
    
    console.log(`🖼️ Final canvas: ${canvas.width}×${canvas.height} pixels`);
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each image
    Object.keys(slots).forEach(slotIndex => {
        const imageIndex = slots[slotIndex];
        const img = images[imageIndex];
        if (!img) return;
        
        const row = Math.floor(slotIndex / currentCols);
        const col = slotIndex % currentCols;
        const x = spacing + (col * (cellW + spacing));
        const y = spacing + (row * (cellH + spacing));
        
        // Draw image with better scaling
        const padding = Math.max(20, cellW * 0.05); // Responsive padding
        const fontSize = Math.max(16, cellW * 0.04); // Responsive font
        const labelH = fontSize + 20;
        const availW = cellW - (padding * 2);
        const availH = cellH - (padding * 2) - labelH;
        
        // Calculate scale - this preserves original quality when possible
        const scale = Math.min(availW / img.img.width, availH / img.img.height, 1); // Max scale = 1 (no upscaling)
        const scaledW = img.img.width * scale;
        const scaledH = img.img.height * scale;
        
        const imgX = x + padding + (availW - scaledW) / 2;
        const imgY = y + padding + (availH - scaledH) / 2;
        
        // Use high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img.img, imgX, imgY, scaledW, scaledH);
        
        // Draw label with responsive font
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(img.name, x + cellW / 2, y + cellH - padding/2);
        
        console.log(`✅ Drew ${img.name}: ${scaledW.toFixed(0)}×${scaledH.toFixed(0)} (scale: ${scale.toFixed(2)})`);
    });
    
    // Show result
    showElement('finalImagePreview');
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    
    console.log('✅ Image generated!');
    
    // Scroll to result
    setTimeout(() => {
        const preview = document.getElementById('finalImagePreview');
        if (preview) preview.scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function downloadImage(format = 'png') {
    console.log('💾 Downloading image as:', format);
    
    const canvas = document.getElementById('finalCanvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    const quality = 0.95;
    
    if (format === 'jpg') {
        link.href = canvas.toDataURL('image/jpeg', quality);
        link.download = `chart-layout-${currentCols}x${currentRows}-${Date.now()}.jpg`;
    } else {
        link.href = canvas.toDataURL('image/png');
        link.download = `chart-layout-${currentCols}x${currentRows}-${Date.now()}.png`;
    }
    
    link.click();
    console.log('✅ Download triggered!');
}

// Layout type functions (for HTML compatibility)
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
    }
}

function updateCustomLayout() {
    const cols = parseInt(document.getElementById('customCols')?.value) || 3;
    const rows = parseInt(document.getElementById('customRows')?.value) || 2;
    console.log(`🔧 Custom layout: ${cols}x${rows}`);
    setLayout(cols, rows);
}

function clearLayout() { 
    console.log('🗑️ Clearing layout...');
    slots = {}; 
    createGrid(); 
}

function resetAll() { 
    if (confirm('🔄 This will remove all images and start over. Are you sure?')) {
        console.log('🔄 Resetting everything...');
        location.reload(); 
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
