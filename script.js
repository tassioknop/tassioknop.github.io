class ChartLayoutTool {
    constructor() {
        this.uploadedImages = [];
        this.currentLayout = 'auto';
        this.gridCols = 3;
        this.gridRows = 2;
        this.slotAssignments = {}; // slotIndex -> imageIndex
        this.draggedElement = null;
        this.draggedImageIndex = null;
        
        this.init();
    }
    
    init() {
        document.getElementById('imageUpload').addEventListener('change', 
            (e) => this.handleImageUpload(e));
        
        // Settings event listeners
        this.setupSettingsListeners();
        
        // Initialize layout
        this.updateLayout();
    }
    
    setupSettingsListeners() {
        // Font size slider
        const fontSlider = document.getElementById('labelFontSize');
        const fontValue = document.getElementById('fontSizeValue');
        fontSlider.addEventListener('input', (e) => {
            fontValue.textContent = e.target.value + 'px';
        });
        
        // Spacing slider
        const spacingSlider = document.getElementById('gridSpacing');
        const spacingValue = document.getElementById('spacingValue');
        spacingSlider.addEventListener('input', (e) => {
            spacingValue.textContent = e.target.value + 'px';
            document.documentElement.style.setProperty('--grid-spacing', e.target.value + 'px');
        });
        
        // Background color
        const bgSelect = document.getElementById('backgroundColor');
        const customBgColor = document.getElementById('customBgColor');
        bgSelect.addEventListener('change', (e) => {
            customBgColor.style.display = e.target.value === 'custom' ? 'inline' : 'none';
        });
    }
    
    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const imageData = {
                        id: Date.now() + index,
                        src: e.target.result,
                        image: img,
                        label: file.name.replace(/\.[^/.]+$/, ""),
                        originalName: file.name
                    };
                    
                    this.uploadedImages.push(imageData);
                    this.updateUploadedImagesList();
                    this.updateLayout();
                    this.showRelevantSections();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    updateUploadedImagesList() {
        const section = document.getElementById('uploadedImagesSection');
        const list = document.getElementById('uploadedImagesList');
        const count = document.getElementById('imageCount');
        
        if (this.uploadedImages.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        count.textContent = `(${this.uploadedImages.length} images)`;
        list.innerHTML = '';
        
        this.uploadedImages.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'uploaded-image-card';
            card.draggable = true;
            card.dataset.imageIndex = index;
            
            card.innerHTML = `
                <img src="${img.src}" alt="${img.label}">
                <div class="image-info">
                    <input type="text" 
                           value="${img.label}" 
                           placeholder="Enter label for this chart"
                           onchange="updateImageLabel(${index}, this.value)">
                    <small style="color: #666; display: block; margin-top: 5px;">
                        File: ${img.originalName}
                    </small>
                </div>
            `;
            
            this.setupDragAndDrop(card, index);
            list.appendChild(card);
        });
    }
    
    setupDragAndDrop(card, imageIndex) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            this.draggedImageIndex = imageIndex;
            card.classList.add('dragging');
            
            // Set drag image
            e.dataTransfer.setData('text/plain', '');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        card.addEventListener('dragend', (e) => {
            card.classList.remove('dragging');
            this.draggedElement = null;
            this.draggedImageIndex = null;
        });
    }
    
    calculateOptimalGrid(imageCount) {
        if (imageCount <= 1) return { cols: 1, rows: 1 };
        if (imageCount <= 2) return { cols: 2, rows: 1 };
        if (imageCount <= 4) return { cols: 2, rows: 2 };
        if (imageCount <= 6) return { cols: 3, rows: 2 };
        if (imageCount <= 9) return { cols: 3, rows: 3 };
        if (imageCount <= 12) return { cols: 4, rows: 3 };
        
        // For larger numbers, try to keep it roughly square
        const cols = Math.ceil(Math.sqrt(imageCount));
        const rows = Math.ceil(imageCount / cols);
        return { cols, rows };
    }
    
    updateLayout() {
        if (this.uploadedImages.length === 0) return;
        
        // Determine grid dimensions
        if (this.currentLayout === 'auto') {
            const optimal = this.calculateOptimalGrid(this.uploadedImages.length);
            this.gridCols = optimal.cols;
            this.gridRows = optimal.rows;
        }
        
        this.createLayoutSlots();
        this.updateAutoLayoutInfo();
    }
    
    updateAutoLayoutInfo() {
        const info = document.getElementById('autoLayoutDetails');
        if (this.currentLayout === 'auto' && info) {
            const totalSlots = this.gridCols * this.gridRows;
            info.textContent = `${this.gridCols}×${this.gridRows} grid (${totalSlots} slots) for ${this.uploadedImages.length} images`;
        }
    }
    
    createLayoutSlots() {
        const preview = document.getElementById('layoutPreview');
        const totalSlots = this.gridCols * this.gridRows;
        
        preview.innerHTML = '';
        preview.style.gridTemplateColumns = `repeat(${this.gridCols}, 1fr)`;
        preview.style.display = 'grid';
        
        for (let i = 0; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'chart-slot empty';
            slot.dataset.slotIndex = i;
            
            // Add slot number
            const slotNumber = document.createElement('div');
            slotNumber.className = 'slot-number';
            slotNumber.textContent = i + 1;
            slot.appendChild(slotNumber);
            
            this.createEmptySlot(slot, i);
            this.setupSlotDropZone(slot, i);
            preview.appendChild(slot);
        }
        
        // Auto-assign images to slots if in auto mode
        if (this.currentLayout === 'auto') {
            this.autoAssignImages();
        }
    }
    
    createEmptySlot(slot, index) {
        const existingContent = slot.querySelector('.empty-slot-content');
        if (existingContent) return;
        
        const content = document.createElement('div');
        content.className = 'empty-slot-content';
        content.innerHTML = `<p>Drop image here</p>`;
        slot.appendChild(content);
    }
    
    setupSlotDropZone(slot, slotIndex) {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (this.draggedImageIndex !== null) {
                slot.classList.add('drag-over');
            }
        });
        
        slot.addEventListener('dragleave', (e) => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            
            if (this.draggedImageIndex !== null) {
                // Check if dragging from another slot
                const sourceSlot = this.findSlotWithImage(this.draggedImageIndex);
                if (sourceSlot !== null && sourceSlot !== slotIndex) {
                    // Swap images
                    const targetImageIndex = this.slotAssignments[slotIndex];
                    this.slotAssignments[slotIndex] = this.draggedImageIndex;
                    if (targetImageIndex !== undefined) {
                        this.slotAssignments[sourceSlot] = targetImageIndex;
                    } else {
                        delete this.slotAssignments[sourceSlot];
                    }
                } else {
                    // Assign image to slot
                    this.slotAssignments[slotIndex] = this.draggedImageIndex;
                }
                
                this.updateAllSlots();
            }
        });
        
        // Right-click to remove
        slot.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.slotAssignments[slotIndex] !== undefined) {
                delete this.slotAssignments[slotIndex];
                this.updateSlotContent(slot, slotIndex);
            }
        });
    }
    
    findSlotWithImage(imageIndex) {
        for (let slotIndex in this.slotAssignments) {
            if (this.slotAssignments[slotIndex] === imageIndex) {
                return parseInt(slotIndex);
            }
        }
        return null;
    }
    
    autoAssignImages() {
        // Clear existing assignments
        this.slotAssignments = {};
        
        // Assign images to slots in order
        this.uploadedImages.forEach((img, index) => {
            if (index < this.gridCols * this.gridRows) {
                this.slotAssignments[index] = index;
            }
        });
        
        this.updateAllSlots();
    }
    
    updateAllSlots() {
        const slots = document.querySelectorAll('.chart-slot');
        slots.forEach((slot, index) => {
            this.updateSlotContent(slot, index);
        });
    }
    
    updateSlotContent(slot, slotIndex) {
        const imageIndex = this.slotAssignments[slotIndex];
        
        // Clear existing content (except slot number)
        const slotNumber = slot.querySelector('.slot-number');
        slot.innerHTML = '';
        slot.appendChild(slotNumber);
        
        if (imageIndex !== undefined && this.uploadedImages[imageIndex]) {
            const img = this.uploadedImages[imageIndex];
            slot.className = 'chart-slot has-image';
            
            const imgElement = document.createElement('img');
            imgElement.src = img.src;
            imgElement.alt = img.label;
            slot.appendChild(imgElement);
            
            const label = document.createElement('div');
            label.className = 'chart-label';
            label.textContent = img.label;
            slot.appendChild(label);
            
        } else {
            slot.className = 'chart-slot empty';
            this.createEmptySlot(slot, slotIndex);
        }
    }
    
    showRelevantSections() {
        document.getElementById('layoutConfig').style.display = 'block';
        document.getElementById('dragInstructions').style.display = 'block';
        document.getElementById('layoutPreview').style.display = 'grid';
        document.getElementById('labelSettings').style.display = 'block';
        document.getElementById('controls').style.display = 'block';
    }
    
    generateFinalImage() {
        const canvas = document.getElementById('finalCanvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate canvas size based on grid
        const cellWidth = 400;
        const cellHeight = 300;
        const spacing = parseInt(document.getElementById('gridSpacing').value);
        
        canvas.width = (cellWidth * this.gridCols) + (spacing * (this.gridCols + 1));
        canvas.height = (cellHeight * this.gridRows) + (spacing * (this.gridRows + 1));
        
        // Set background
        this.setCanvasBackground(ctx, canvas.width, canvas.height);
        
        // Get label settings
        const fontSize = document.getElementById('labelFontSize').value;
        const labelPosition = document.getElementById('labelPosition').value;
        
        // Draw each assigned image
        Object.keys(this.slotAssignments).forEach(slotIndex => {
            const imageIndex = this.slotAssignments[slotIndex];
            const img = this.uploadedImages[imageIndex];
            
            if (img) {
                const row = Math.floor(slotIndex / this.gridCols);
                const col = slotIndex % this.gridCols;
                
                const x = spacing + (col * (cellWidth + spacing));
                const y = spacing + (row * (cellHeight + spacing));
                
                this.drawImageWithLabel(ctx, img, x, y, cellWidth, cellHeight, fontSize, labelPosition);
            }
        });
        
        // Show preview
        document.getElementById('finalImagePreview').style.display = 'block';
        document.getElementById('downloadBtn').disabled = false;
        
        // Scroll to preview
        document.getElementById('finalImagePreview').scrollIntoView({ behavior: 'smooth' });
    }
    
    setCanvasBackground(ctx, width, height) {
        const bgType = document.getElementById('backgroundColor').value;
        
        if (bgType !== 'transparent') {
            let bgColor = 'white';
            
            switch (bgType) {
                case 'light-gray':
                    bgColor = '#f5f5f5';
                    break;
                case 'custom':
                    bgColor = document.getElementById('customBgColor').value;
                    break;
            }
            
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    drawImageWithLabel(ctx, imgData, x, y, cellWidth, cellHeight, fontSize, labelPosition) {
        const padding = 15;
        const labelHeight = labelPosition === 'none' ? 0 : parseInt(fontSize) + 10;
        
        let availableWidth = cellWidth - (padding * 2);
        let availableHeight = cellHeight - (padding * 2);
        let imageY = y + padding;
        
        // Adjust for label position
        if (labelPosition === 'top' || labelPosition === 'bottom') {
            availableHeight -= labelHeight;
            if (labelPosition === 'top') {
                imageY += labelHeight;
            }
        }
        
        // Calculate image scaling
        const scale = Math.min(
            availableWidth / imgData.image.width,
            availableHeight / imgData.image.height
        );
        
        const scaledWidth = imgData.image.width * scale;
        const scaledHeight = imgData.image.height * scale;
        
        // Center the image
        const imageX = x + padding + (availableWidth - scaledWidth) / 2;
        const centeredImageY = imageY + (availableHeight - scaledHeight) / 2;
        
        // Draw the image
        ctx.drawImage(
            imgData.image,
            imageX,
            centeredImageY,
            scaledWidth,
            scaledHeight
        );
        
        // Draw the label
        if (labelPosition !== 'none') {
            this.drawLabel(ctx, imgData.label, x, y, cellWidth, cellHeight, imageX, centeredImageY, scaledWidth, scaledHeight, fontSize, labelPosition);
        }
    }
    
    drawLabel(ctx, label, x, y, cellWidth, cellHeight, imageX, imageY, imageWidth, imageHeight, fontSize, position) {
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        
        const labelX = x + cellWidth / 2;
        let labelY;
        
        switch (position) {
            case 'top':
                labelY = y + 15 + parseInt(fontSize);
                break;
            case 'bottom':
                labelY = y + cellHeight - 10;
                break;
            case 'overlay-top':
                labelY = imageY + parseInt(fontSize) + 5;
                this.drawLabelBackground(ctx, labelX, labelY - parseInt(fontSize), label, fontSize);
                break;
            case 'overlay-bottom':
                labelY = imageY + imageHeight - 5;
                this.drawLabelBackground(ctx, labelX, labelY - parseInt(fontSize), label, fontSize);
                break;
        }
        
        ctx.fillText(label, labelX, labelY);
    }
    
    drawLabelBackground(ctx, centerX, topY, text, fontSize) {
        ctx.font = `${fontSize}px Arial`;
        const textWidth = ctx.measureText(text).width;
        const padding = 6;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(
            centerX - textWidth/2 - padding,
            topY - padding,
            textWidth + padding * 2,
            parseInt(fontSize) + padding * 2
        );
        
        ctx.fillStyle = 'black';
    }
    
    downloadImage() {
        const canvas = document.getElementById('finalCanvas');
        const link = document.createElement('a');
        link.download = `chart-layout-${this.gridCols}x${this.gridRows}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
    
    clearLayout() {
        this.slotAssignments = {};
        this.updateAllSlots();
    }
}

// Global functions
let chartTool;

function updateLayoutType() {
    const layoutType = document.querySelector('input[name="layoutType"]:checked').value;
    
    // Show/hide relevant sections
    document.getElementById('autoLayoutInfo').style.display = layoutType === 'auto' ? 'block' : 'none';
    document.getElementById('presetLayouts').style.display = layoutType === 'preset' ? 'block' : 'none';
    document.getElementById('customGrid').style.display = layoutType === 'custom' ? 'block' : 'none';
    
    chartTool.currentLayout = layoutType;
    
    if (layoutType === 'auto') {
        chartTool.updateLayout();
    } else if (layoutType === 'custom') {
        updateCustomLayout();
    }
}

function setLayout(layoutString) {
    // Remove active class from all buttons
    document.querySelectorAll('#presetLayouts button').forEach(btn => {
        btn.classList.remove('active');
    });
    // Add active class to clicked button
    event.target.classList.add('active');
    
    const [cols, rows] = layoutString.split('x').map(Number);
    chartTool.currentLayout = 'preset';
    chartTool.gridCols = cols;
    chartTool.gridRows = rows;
    chartTool.createLayoutSlots();
}

function updateCustomLayout() {
    const cols = parseInt(document.getElementById('customCols').value);
    const rows = parseInt(document.getElementById('customRows').value);
    const totalSlots = cols * rows;
    
    document.getElementById('customLayoutInfo').textContent = 
        `${cols}×${rows} grid (${totalSlots} slots total)`;
    
    chartTool.currentLayout = 'custom';
    chartTool.gridCols = cols;
    chartTool.gridRows = rows;
    chartTool.createLayoutSlots();
}

function updateImageLabel(imageIndex, newLabel) {
    chartTool.uploadedImages[imageIndex].label = newLabel;
    chartTool.updateAllSlots();
}

function generateFinalImage() {
    chartTool.generateFinalImage();
}

function downloadImage() {
    chartTool.downloadImage();
}

function clearLayout() {
    chartTool.clearLayout();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    chartTool = new ChartLayoutTool();
});
