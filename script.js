// Global variables
let uploadedImages = [];
let currentCols = 2;
let currentRows = 2;
let slotAssignments = {}; // slotIndex -> imageIndex

console.log('Script loaded!'); // Debug

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded!'); // Debug
    
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) {
        fileInput.addEventListener('change', handleImageUpload);
        console.log('File input listener added!'); // Debug
    } else {
        console.error('File input not found!');
    }
    
    // Show debug section
    document.getElementById('debug').style.display = 'block';
});

function handleImageUpload(event) {
    console.log('File upload triggered!', event.target.files.length, 'files'); // Debug
    
    const files = Array.from(event.target.files);
    document.getElementById('debugText').textContent = `Processing ${files.length} files...`;
    
    let processedCount = 0;
    
    files.forEach((file, index) => {
        console.log('Processing file:', file.name); // Debug
        
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
                
                console.log('Image processed:', imageData.label); // Debug
                document.getElementById('debugText').textContent = 
                    `Processed ${processedCount}/${files.length} images`;
                
                // Update UI after each image is processed
                updateUploadedImagesList();
                showRelevantSections();
                
                // Auto-create layout after all images are processed
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
    
    console.log('Updating images list, count:', uploadedImages.length); // Debug
    
    if (uploadedImages.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    count.textContent = `(${uploadedImages.length} images)`;
    list.innerHTML = '';
    
    uploadedImages.forEach((img, index) => {
        const card = document.createElement('div');
        card.className = 'uploaded-image-card';
        card.innerHTML = `
            <img src="${img.src}" alt="${img.label}">
            <div class="image-info">
                <input type="text" 
                       value="${img.label}" 
                       onchange="updateImageLabel(${index}, this.value)">
                <small style="color: #666; display: block; margin-top: 5px;">
                    ${img.originalName}
                </small>
            </div>
        `;
        list.appendChild(card);
    });
}

function showRelevantSections() {
    console.log('Showing sections...'); // Debug
    document.getElementById('layoutButtons').style.display = 'block';
    document.getElementById('controls').style.display = 'block';
}

function autoSetLayout() {
    console.log('Auto-setting layout for', uploadedImages.length, 'images'); // Debug
    
    // Determine best layout
    const count = uploadedImages.length;
    if (count <= 2) setLayout(2, 1);
    else if (count <= 4) setLayout(2, 2);
    else if (count <= 6) setLayout(3, 2);
    else setLayout(3, 3);
}

function setLayout(cols, rows) {
    console.log('Setting layout:', cols, 'x', rows); // Debug
    
    // Update active button
    document.querySelectorAll('#layoutButtons button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    currentCols = cols;
    currentRows = rows;
    
    createLayoutSlots();
    autoAssignImages();
}

function createLayoutSlots() {
    const preview = document.getElementById('layoutPreview');
    const totalSlots = currentCols * currentRows;
    
    console.log('Creating layout slots:', totalSlots); // Debug
    
    preview.innerHTML = '';
    preview.style.gridTemplateColumns = `repeat(${currentCols}, 1fr)`;
    preview.style.display = 'grid';
    
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'chart-slot';
        slot.dataset.slotIndex = i;
        slot.innerHTML = `
            <p>Slot ${i + 1}</p>
            <select class="slot-select" onchange="assignImageToSlot(${i}, this.value)">
                <option value="">Select image...</option>
                ${uploadedImages.map((img, idx) => 
                    `<option value="${idx}">${img.label}</option>`
                ).join('')}
            </select>
        `;
        
        preview.appendChild(slot);
    }
}

function autoAssignImages() {
    console.log('Auto-assigning images...'); // Debug
    
    // Clear existing assignments
    slotAssignments = {};
    
    // Assign images to slots
    uploadedImages.forEach((img, index) => {
        if (index < currentCols * currentRows) {
            slotAssignments[index] = index;
            assignImageToSlot(index, index, false); // false = don't log
        }
    });
}

function assignImageToSlot(slotIndex, imageIndex, shouldLog = true) {
    if (shouldLog) console.log('Assigning image', imageIndex, 'to slot', slotIndex); // Debug
    
    const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
    const select = slot.querySelector('select');
    
    if (imageIndex === '' || imageIndex === null) {
        // Clear slot
        delete slotAssignments[slotIndex];
        slot.className = 'chart-slot';
        slot.innerHTML = `
            <p>Slot ${parseInt(slotIndex) + 1}</p>
            <select class="slot-select" onchange="assignImageToSlot(${slotIndex}, this.value)">
                <option value="">Select image...</option>
                ${uploadedImages.map((img, idx) => 
                    `<option value="${idx}">${img.label}</option>`
                ).join('')}
            </select>
        `;
    } else {
        // Assign image
        const img = uploadedImages[imageIndex];
        slotAssignments[slotIndex] = parseInt(imageIndex);
        
        slot.className = 'chart-slot has-image';
        slot.innerHTML = `
            <img src="${img.src}" alt="${img.label}">
            <div class="chart-label">${img.label}</div>
            <select class="slot-select" onchange="assignImageToSlot(${slotIndex}, this.value)">
                <option value="">Remove image</option>
                ${uploadedImages.map((img, idx) => 
                    `<option value="${idx}" ${idx == imageIndex ? 'selected' : ''}>${img.label}</option>`
                ).join('')}
            </select>
        `;
    }
}

function updateImageLabel(imageIndex, newLabel) {
    console.log('Updating label for image', imageIndex, 'to:', newLabel); // Debug
    uploadedImages[imageIndex].label = newLabel;
    
    // Update any slots showing this image
    Object.keys(slotAssignments).forEach(slotIndex => {
        if (slotAssignments[slotIndex] === imageIndex) {
            assignImageToSlot(slotIndex, imageIndex, false);
        }
    });
    
    // Update all select options
    createLayoutSlots();
    Object.keys(slotAssignments).forEach(slotIndex => {
        assignImageToSlot(slotIndex, slotAssignments[slotIndex], false);
    });
}

function generateImage() {
    console.log('Generating final image...'); // Debug
    
    const canvas = document.getElementById('finalCanvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const cellWidth = 400;
    const cellHeight = 300;
    const spacing = 20;
    
    canvas.width = (cellWidth * currentCols) + (spacing * (currentCols + 1));
    canvas.height = (cellHeight * currentRows) + (spacing * (currentRows + 1));
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw each assigned image
    Object.keys(slotAssignments).forEach(slotIndex => {
        const imageIndex = slotAssignments[slotIndex];
        const img = uploadedImages[imageIndex];
        
        if (img) {
            const row = Math.floor(slotIndex / currentCols);
            const col = slotIndex % currentCols;
            
            const x = spacing + (col * (cellWidth + spacing));
            const y = spacing + (row * (cellHeight + spacing));
            
            drawImageInCell(ctx, img, x, y, cellWidth, cellHeight);
        }
    });
    
    // Show result
    document.getElementById('finalImagePreview').style.display = 'block';
    document.getElementById('downloadBtn').disabled = false;
    
    console.log('Image generated!'); // Debug
}

function drawImageInCell(ctx, imgData, x, y, cellWidth, cellHeight) {
    const padding = 20;
    const labelHeight = 30;
    
    const availableWidth = cellWidth - (padding * 2);
    const availableHeight = cellHeight - (padding * 2) - labelHeight;
    
    // Calculate scaling
    const scale = Math.min(
        availableWidth / imgData.image.width,
        availableHeight / imgData.image.height
    );
    
    const scaledWidth = imgData.image.width * scale;
    const scaledHeight = imgData.image.height * scale;
    
    // Center the image
    const imageX = x + padding + (availableWidth - scaledWidth) / 2;
    const imageY = y + padding + (availableHeight - scaledHeight) / 2;
    
    // Draw image
    ctx.drawImage(imgData.image, imageX, imageY, scaledWidth, scaledHeight);
    
    // Draw label
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(imgData.label, x + cellWidth / 2, y + cellHeight - 10);
}

function downloadImage() {
    console.log('Downloading image...'); // Debug
    
    const canvas = document.getElementById('finalCanvas');
    const link = document.createElement('a');
    link.download = `chart-layout-${currentCols}x${currentRows}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
