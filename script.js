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
    const preview
