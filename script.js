class ChartLayoutTool {
    constructor() {
        this.uploadedImages = [];
        this.currentLayout = '2x2';
        this.layouts = {
            '2x2': { rows: 2, cols: 2, slots: 4 },
            '1x3': { rows: 3, cols: 1, slots: 3 },
            '3x1': { rows: 1, cols: 3, slots: 3 },
            'custom': { rows: 2, cols: 3, slots: 6 }
        };
        
        this.init();
    }
    
    init() {
        document.getElementById('imageUpload').addEventListener('change', 
            (e) => this.handleImageUpload(e));
        this.createLayoutSlots();
    }
    
    handleImageUpload(event) {
        const files = Array.from(event.target.files);
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.uploadedImages.push({
                        id: Date.now() + index,
                        src: e.target.result,
                        image: img,
                        label: file.name.replace(/\.[^/.]+$/, "")
                    });
                    this.updatePreview();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
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
            slot.innerHTML = `
                <div class="slot-content">
                    <p>Drop chart ${i + 1} here</p>
                    <select onchange="assignImageToSlot(${i}, this.value)">
                        <option value="">Select image...</option>
                    </select>
                </div>
            `;
            
            // Make slots draggable/droppable
            this.makeSlotInteractive(slot);
            preview.appendChild(slot);
        }
    }
    
    makeSlotInteractive(slot) {
        slot.addEventListener('dragover', (e) => {
            e.preventDefault();
            slot.classList.add('drag-over');
        });
        
        slot.addEventListener('dragleave', () => {
            slot.classList.remove('drag-over');
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault();
            slot.classList.remove('drag-over');
            // Handle image assignment logic here
        });
    }
    
    updatePreview() {
        // Update dropdown options in slots
        const selects = document.querySelectorAll('.chart-slot select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select image...</option>';
            this.uploadedImages.forEach((img, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = img.label;
                select.appendChild(option);
            });
        });
    }
    
    generateFinalImage() {
        const canvas = document.getElementById('finalCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size (e.g., 1200x800 for high quality)
        canvas.width = 1200;
        canvas.height = 800;
        
        const layout = this.layouts[this.currentLayout];
        const cellWidth = canvas.width / layout.cols;
        const cellHeight = canvas.height / layout.rows;
        
        // Clear canvas
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw each image in its assigned slot
        const slots = document.querySelectorAll('.chart-slot');
        slots.forEach((slot, index) => {
            const select = slot.querySelector('select');
            const imageIndex = select.value;
            
            if (imageIndex !== '' && this.uploadedImages[imageIndex]) {
                const img = this.uploadedImages[imageIndex];
                const row = Math.floor(index / layout.cols);
                const col = index % layout.cols;
                
                const x = col * cellWidth;
                const y = row * cellHeight;
                
                // Draw image with proper scaling and centering
                this.drawImageInCell(ctx, img.image, x, y, cellWidth, cellHeight);
                
                // Add label
                ctx.fillStyle = 'black';
                ctx.font = '16px Arial';
                ctx.fillText(img.label, x + 10, y + 25);
            }
        });
    }
    
    drawImageInCell(ctx, img, x, y, cellWidth, cellHeight) {
        const padding = 20;
        const availableWidth = cellWidth - (padding * 2);
        const availableHeight = cellHeight - (padding * 2);
        
        // Calculate scaling to fit within cell
        const scale = Math.min(
            availableWidth / img.width,
            availableHeight / img.height
        );
        
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        
        // Center the image in the cell
        const offsetX = (availableWidth - scaledWidth) / 2;
        const offsetY = (availableHeight - scaledHeight) / 2;
        
        ctx.drawImage(
            img,
            x + padding + offsetX,
            y + padding + offsetY + 30, // Extra offset for label
            scaledWidth,
            scaledHeight
        );
    }
    
    downloadImage() {
        const canvas = document.getElementById('finalCanvas');
        const link = document.createElement('a');
        link.download = 'chart-layout.png';
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Global functions
function setLayout(layoutType) {
    window.chartTool.currentLayout = layoutType;
    window.chartTool.createLayoutSlots();
}

function assignImageToSlot(slotIndex, imageIndex) {
    if (imageIndex !== '') {
        const slot = document.querySelector(`[data-slot-index="${slotIndex}"]`);
        const img = window.chartTool.uploadedImages[imageIndex];
        
        slot.innerHTML = `
            <img src="${img.src}" alt="${img.label}">
            <div class="image-label">${img.label}</div>
            <select onchange="assignImageToSlot(${slotIndex}, this.value)">
                <option value="">Select image...</option>
                ${window.chartTool.uploadedImages.map((img, idx) => 
                    `<option value="${idx}" ${idx == imageIndex ? 'selected' : ''}>${img.label}</option>`
                ).join('')}
            </select>
        `;
    }
}

function generateFinalImage() {
    window.chartTool.generateFinalImage();
}

function downloadImage() {
    window.chartTool.downloadImage();
}

// Initialize the tool
window.chartTool = new ChartLayoutTool();
