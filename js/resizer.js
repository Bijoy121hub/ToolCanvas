document.addEventListener('DOMContentLoaded', () => {
    // Mode tabs
    const tabBtns = document.querySelectorAll('.tab-btn[data-target^="mode-"]');
    const tabContents = document.querySelectorAll('.resize-mode');
    
    let currentMode = 'custom';
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.dataset.target;
            document.getElementById(targetId).classList.add('active');
            
            currentMode = targetId.replace('mode-', '');
            updateTargetDimensions();
        });
    });

    // Elements
    const dropZone = document.getElementById('resizer-drop-zone');
    const fileInput = document.getElementById('resizer-input');
    
    const uploadSection = document.getElementById('upload-section');
    const editorSection = document.getElementById('editor-section');
    const resultSection = document.getElementById('result-section');
    
    const origPreview = document.getElementById('original-preview');
    const origInfo = document.getElementById('original-info');
    
    const inputW = document.getElementById('custom-width');
    const inputH = document.getElementById('custom-height');
    const lockBtn = document.getElementById('lock-aspect');
    const inputPercent = document.getElementById('percent-scale');
    const presetSelect = document.getElementById('preset-select');
    
    const outFormat = document.getElementById('output-format');
    const outQuality = document.getElementById('output-quality');
    const qualityGroup = document.getElementById('quality-group');
    const qualityVal = document.getElementById('quality-val');
    
    const applyBtn = document.getElementById('apply-resize-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    let originalImage = null;
    let originalFile = null;
    let aspectRatio = 1;
    let isLocked = true;
    let targetW = 0;
    let targetH = 0;

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', e => {
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', function() {
        if (this.files.length) handleFile(this.files[0]);
    });

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            app.showToast('Please upload an image file', 'error');
            return;
        }
        
        originalFile = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                aspectRatio = img.width / img.height;
                
                // Set UI
                origPreview.src = e.target.result;
                origInfo.innerHTML = `
                    <strong>${file.name}</strong><br>
                    Dimensions: ${img.width} × ${img.height}px<br>
                    Size: ${formatBytes(file.size)}
                `;
                
                // Set initial inputs
                inputW.value = img.width;
                inputH.value = img.height;
                targetW = img.width;
                targetH = img.height;
                
                outFormat.value = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' ? file.type : 'image/jpeg';
                updateFormatOptions();
                
                uploadSection.classList.add('hidden');
                editorSection.classList.remove('hidden');
                resultSection.classList.add('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Interactions
    lockBtn.addEventListener('click', () => {
        isLocked = !isLocked;
        lockBtn.classList.toggle('locked', isLocked);
        lockBtn.textContent = isLocked ? '🔒' : '🔓';
        if (isLocked && originalImage) {
            aspectRatio = inputW.value / inputH.value || originalImage.width / originalImage.height;
        }
    });

    inputW.addEventListener('input', () => {
        if (!originalImage) return;
        targetW = parseInt(inputW.value) || 0;
        if (isLocked && targetW > 0) {
            targetH = Math.round(targetW / aspectRatio);
            inputH.value = targetH;
        } else {
            targetH = parseInt(inputH.value) || 0;
        }
    });

    inputH.addEventListener('input', () => {
        if (!originalImage) return;
        targetH = parseInt(inputH.value) || 0;
        if (isLocked && targetH > 0) {
            targetW = Math.round(targetH * aspectRatio);
            inputW.value = targetW;
        } else {
            targetW = parseInt(inputW.value) || 0;
        }
    });

    inputPercent.addEventListener('input', updateTargetDimensions);
    presetSelect.addEventListener('change', updateTargetDimensions);

    function updateTargetDimensions() {
        if (!originalImage) return;
        
        if (currentMode === 'percent') {
            const scale = (parseInt(inputPercent.value) || 100) / 100;
            targetW = Math.round(originalImage.width * scale);
            targetH = Math.round(originalImage.height * scale);
        } else if (currentMode === 'preset') {
            const [w, h] = presetSelect.value.split('x').map(Number);
            targetW = w;
            targetH = h;
        } else {
            targetW = parseInt(inputW.value) || 0;
            targetH = parseInt(inputH.value) || 0;
        }
    }

    outFormat.addEventListener('change', updateFormatOptions);
    outQuality.addEventListener('input', () => {
        qualityVal.textContent = outQuality.value;
    });

    function updateFormatOptions() {
        if (outFormat.value === 'image/png') {
            qualityGroup.style.opacity = '0.5';
            outQuality.disabled = true;
        } else {
            qualityGroup.style.opacity = '1';
            outQuality.disabled = false;
        }
    }

    // Process Resize
    applyBtn.addEventListener('click', () => {
        if (!originalImage || targetW <= 0 || targetH <= 0) {
            app.showToast('Invalid dimensions', 'error');
            return;
        }
        
        updateTargetDimensions(); // Ensure latest

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        
        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Fill white background if converting PNG to JPG
        if (outFormat.value === 'image/jpeg' && originalFile.type === 'image/png') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(originalImage, 0, 0, targetW, targetH);
        
        const format = outFormat.value;
        const quality = parseFloat(outQuality.value);
        
        canvas.toBlob((blob) => {
            if (!blob) {
                app.showToast('Error resizing image', 'error');
                return;
            }
            
            const url = URL.createObjectURL(blob);
            document.getElementById('resized-preview').src = url;
            
            // Set stats
            document.getElementById('stat-orig-size').textContent = formatBytes(originalFile.size);
            document.getElementById('stat-new-size').textContent = formatBytes(blob.size);
            
            const diff = originalFile.size - blob.size;
            const diffPercent = ((diff / originalFile.size) * 100).toFixed(1);
            
            const diffEl = document.getElementById('stat-diff');
            if (diff > 0) {
                diffEl.textContent = `-${diffPercent}% smaller`;
                diffEl.style.color = '#10b981';
            } else if (diff < 0) {
                diffEl.textContent = `+${Math.abs(diffPercent)}% larger`;
                diffEl.style.color = '#f59e0b';
            } else {
                diffEl.textContent = 'No change';
                diffEl.style.color = 'inherit';
            }
            
            // Setup download
            const ext = format.split('/')[1];
            const dBtn = document.getElementById('download-btn');
            dBtn.href = url;
            dBtn.download = `resized_${targetW}x${targetH}.${ext}`;
            
            editorSection.classList.add('hidden');
            resultSection.classList.remove('hidden');
            
        }, format, quality);
    });

    resetBtn.addEventListener('click', () => {
        fileInput.value = '';
        originalImage = null;
        originalFile = null;
        
        uploadSection.classList.remove('hidden');
        editorSection.classList.add('hidden');
        resultSection.classList.add('hidden');
    });

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }
    
    if (window.app && app.createToolNav) {
        app.createToolNav();
    }
});
