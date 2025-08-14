class ChartLayoutTool {
    constructor() {
        this.uploadedImages = [];
        this.currentLayout = '2x2';
        this.layouts = {
            '2x2': { rows: 2, cols: 2, slots: 4 },
            '1x3': { rows: 3, cols: 1, slots: 3 },
            '3x1': { rows: 1, cols: 3, slots: 3 },
            '2x3': { rows: 3, cols: 2, slots: 6 }
        };
        this.slotAssignments = {}; // Track which image is in which slot
        
        this.init();
    }
    
    init() {
        document.getElementById('imageUpload').addEventListener('change', 
            (e) => this.handleImageUpload(e));
        
        // Font size slider
        const fontSlider = document.getElementById('labelFontSize');
        const fontValue = document.getElementById('fontSizeValue');
        fontSlider.addEventListener('input', (e) => {
            fontValue.textContent = e.target.value + 'px';
        });
        
        this.createLayoutSlots();
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
                        label: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
                        originalName: file.name
                    };
                    
                    this.uploadedImages.push(imageData);
                    this.updateUploadedImagesList();
                    this.updateSlotOptions();
                    this.updateControls();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    updateUploadedImagesList() {
        const section = document.getElementById('uploadedImagesSection');
        const list = document.getElementById('uploadedImagesList');
        
        if (this.uploadedImages.length === 0) {
            section.style.display = 'none';
            return;
        }
        
        section.style.display = 'block';
        list.innerHTML = '';
        
        this.uploadedImages.forEach((img, index) => {
            const card = document.createElement('div');
            card.className = 'uploaded-image-card';
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
            list.appendChild(card);
        });
    }
    
    createLayoutSlots() {
        const preview = document.getElementById('layoutPreview');
        const layout = this.layouts[this.currentLayout];
        
        preview.innerHTML = '';
        preview.className = `layout-preview layout-grid-${this.currentLayout}`;
        
        for (let i = 0; i < layout.slots; i++) {
            const slot = document.createElement('div');
            slot.className = 'chart-slot';
            slot.dataset.slotIndex = i;
            
            this.createEmptySlot(slot, i);
            preview.appendChild(slot);
        }
        
        this.updateSlotOptions();
    }
    
    createEmptySlot(slot, index) {
        slot.innerHTML = `
            <div class="slot-content">
                <p>Chart ${index + 1}</p>
                <div class="slot-controls">
                    <select onchange="assignImageToSlot(${index}, this.value)">
                        <option value="">Select image...</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    updateSlotOptions() {
        const selects = document.querySelectorAll('.chart-slot select');
        selects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Select image...</option>';
            
            this.uploadedImages.forEach((img, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${img.label} (${img.originalName})`;
                if (currentValue == index) option.selected = true;
                select.appendChild(option);
            });
        });
    }
    
    assignImageToSlot(slotIndex, imageIndex) {
        const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
        
        if (imageIndex === '') {
            this.createEmptySlot(slot, slotIndex);
            delete this.slotAssignments[slotIndex];
        } else {
            const img = this.uploadedImages[imageIndex];
            this.slotAssignments[slotIndex] = imageIndex;
            
            slot.className = 'chart-slot has-image';
            slot.innerHTML = `
                <img src="${img.src}" alt="${img.label}">
                <div class="chart-label">${img.label}</div>
                <div class="slot-controls">
                    <select onchange="assignImageToSlot(${slotIndex}, this.value)">
                        <option value="">Remove image</option>
                        ${this.uploadedImages.map((img, idx) => 
                            `<option value="${idx}" ${idx == imageIndex ? 'selected' : ''}>${img.label}</option>`
                        ).join('')}
                    </select>
                </div>
            `;
        }
        
        this.updateControls();
    }
    
    updateControls() {
        const hasImages = this.uploadedImages.length > 0;
        const hasAssignments = Object.keys(this.slotAssignments).length > 0;
        
        document.getElementById('generateBtn').disabled = !hasAssignments;
    }
    
    generateFinalImage() {
        const canvas = document.getElementById('finalCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set high resolution canvas
        canvas.width = 1200;
        canvas.height = 800;
        
        const layout = this.layouts[this.currentLayout];
        const cellWidth = canvas.width / layout.cols;
        const cellHeight = canvas.height / layout.rows;
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Get label settings
        const fontSize = document.getElementById('labelFontSize').value;
        const labelPosition = document.getElementById('labelPosition').value;
        
        // Draw each assigned image
        Object.keys(this.slotAssignments).forEach(slotIndex => {
            const imageIndex = this.slotAssignments[slotIndex];
            const img = this.uploadedImages[imageIndex];
            
            const row = Math.floor(slotIndex / layout.cols);
            const col = slotIndex % layout.cols;
            
            const x = col * cellWidth;
            const y = row * cellHeight;
            
            this.drawImageWithLabel(ctx, img, x, y, cellWidth, cellHeight, fontSize, labelPosition);
        });
        
        // Show preview
        document.getElementById('finalImagePreview').style.display = 'block';
        document.getElementById('downloadBtn').disabled = false;
        
        // Scroll to preview
        document.getElementById('finalImagePreview').scrollIntoView({ behavior: 'smooth' });
    }
    
    drawImageWithLabel(ctx, imgData, x, y, cellWidth, cellHeight, fontSize, labelPosition) {
        const padding = 20;
        const labelHeight = parseInt(fontSize) + 10;
        
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
        ctx.fillStyle = 'black';
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        
        const labelX = x + cellWidth / 2;
        let labelY;
        
        switch (labelPosition) {
            case 'top':
                labelY = y + padding + parseInt(fontSize);
                break;
            case 'bottom':
                labelY = y + cellHeight - padding;
                break;
            case 'overlay-top':
                labelY = centeredImageY + parseInt(fontSize);
                ctx.fillStyle = 'white';
                ctx.fillRect(labelX - 100, labelY - parseInt(fontSize), 200, parseInt(fontSize) + 5);
                ctx.fillStyle = 'black';
                break;
            case 'overlay-bottom':
                labelY = centeredImageY + scaledHeight - 5;
                ctx.fillStyle = 'white';
                ctx.fillRect(labelX - 100, labelY - parseInt(fontSize), 200, parseInt(fontSize) + 5);
                ctx.fillStyle = 'black';
                break;
        }
        
        ctx.fillText(imgData.label, labelX, labelY);
    }
    
    downloadImage() {
        const canvas = document.getElementById('finalCanvas');
        const link = document.createElement('a');
        link.download = 'chart-layout.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

// Global functions
let chartTool;

function setLayout(layoutType) {
    // Update active button
    document.querySelectorAll('.layout-selection button').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    chartTool.currentLayout = layoutType;
    chartTool.slotAssignments = {}; // Clear assignments when layout changes
    chartTool.createLayoutSlots();
}

function assignImageToSlot(slotIndex, imageIndex) {
    chartTool.assignImageToSlot(slotIndex, imageIndex);
}

function updateImageLabel(imageIndex, newLabel) {
    chartTool.uploadedImages[imageIndex].label = newLabel;
    chartTool.updateSlotOptions();
    
    // Update any slots that are currently showing this image
    Object.keys(chartTool.slotAssignments).forEach(slotIndex => {
        if (chartTool.slotAssignments[slotIndex] == imageIndex) {
            const labelElement = document.querySelector(`[data-slot-index="${slotIndex}"] .chart-label`);
            if (labelElement) {
                labelElement.textContent = newLabel;
            }
        }
    });
}

function generateFinalImage() {
    chartTool.generateFinalImage();
}

function downloadImage() {
    chartTool.downloadImage();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    chartTool = new ChartLayoutTool();
});
