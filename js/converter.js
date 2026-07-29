document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
            
            resetUI();
        });
    });

    // Image to PDF Logic
    const imgDropZone = document.getElementById('img-drop-zone');
    const imgInput = document.getElementById('img-input');
    const imgPreviewContainer = document.getElementById('img-preview-container');
    const imgOptions = document.getElementById('img-options');
    const imgActionArea = document.getElementById('img-action-area');
    const convertImgBtn = document.getElementById('convert-img-btn');
    
    let uploadedImages = [];

    // Drag and drop events for Image
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imgDropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        imgDropZone.addEventListener(eventName, () => imgDropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        imgDropZone.addEventListener(eventName, () => imgDropZone.classList.remove('dragover'), false);
    });

    imgDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleImageFiles(files);
    });

    imgInput.addEventListener('change', function() {
        handleImageFiles(this.files);
    });

    function handleImageFiles(files) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        Array.from(files).forEach(file => {
            if (validTypes.includes(file.type)) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImages.push({
                        id: Date.now() + Math.random(),
                        file: file,
                        dataUrl: e.target.result
                    });
                    renderImagePreviews();
                };
                reader.readAsDataURL(file);
            } else {
                app.showToast(`Invalid file type: ${file.name}`, 'error');
            }
        });
    }

    function renderImagePreviews() {
        imgPreviewContainer.innerHTML = '';
        if (uploadedImages.length > 0) {
            imgPreviewContainer.classList.remove('hidden');
            imgOptions.classList.remove('hidden');
            imgActionArea.classList.remove('hidden');
            
            uploadedImages.forEach((imgObj, index) => {
                const item = document.createElement('div');
                item.className = 'preview-item glass-panel';
                item.innerHTML = `
                    <img src="${imgObj.dataUrl}" alt="Preview">
                    <button class="remove-btn" onclick="removeImage('${imgObj.id}')">×</button>
                    <div class="item-index">${index + 1}</div>
                `;
                imgPreviewContainer.appendChild(item);
            });
        } else {
            imgPreviewContainer.classList.add('hidden');
            imgOptions.classList.add('hidden');
            imgActionArea.classList.add('hidden');
        }
    }

    window.removeImage = (id) => {
        uploadedImages = uploadedImages.filter(img => img.id.toString() !== id.toString());
        renderImagePreviews();
    };

    convertImgBtn.addEventListener('click', async () => {
        if (uploadedImages.length === 0) return;
        
        showLoading(true);
        try {
            const { jsPDF } = window.jspdf;
            const orientation = document.getElementById('pdf-orientation').value;
            const format = document.getElementById('pdf-format').value;
            const margin = parseInt(document.getElementById('pdf-margin').value) || 0;
            
            let pdf;
            
            for (let i = 0; i < uploadedImages.length; i++) {
                const img = uploadedImages[i];
                const imageElement = await loadImage(img.dataUrl);
                
                let pdfWidth, pdfHeight;
                let finalOrientation = orientation;
                
                if (format === 'fit') {
                    // Fit to image size
                    pdfWidth = imageElement.width * 0.264583; // px to mm
                    pdfHeight = imageElement.height * 0.264583;
                    finalOrientation = pdfWidth > pdfHeight ? 'l' : 'p';
                    
                    if (i === 0) {
                        pdf = new jsPDF({ orientation: finalOrientation, unit: 'mm', format: [pdfWidth + margin*2, pdfHeight + margin*2] });
                    } else {
                        pdf.addPage([pdfWidth + margin*2, pdfHeight + margin*2], finalOrientation);
                    }
                    
                    pdf.addImage(img.dataUrl, getImgType(img.file.type), margin, margin, pdfWidth, pdfHeight);
                } else {
                    // Standard format (A4/Letter)
                    if (i === 0) {
                        pdf = new jsPDF({ orientation: finalOrientation, unit: 'mm', format: format });
                    } else {
                        pdf.addPage(format, finalOrientation);
                    }
                    
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    
                    const availableWidth = pageWidth - (margin * 2);
                    const availableHeight = pageHeight - (margin * 2);
                    
                    const ratio = Math.min(availableWidth / imageElement.width, availableHeight / imageElement.height);
                    
                    const drawWidth = imageElement.width * ratio;
                    const drawHeight = imageElement.height * ratio;
                    
                    const x = margin + (availableWidth - drawWidth) / 2;
                    const y = margin + (availableHeight - drawHeight) / 2;
                    
                    pdf.addImage(img.dataUrl, getImgType(img.file.type), x, y, drawWidth, drawHeight);
                }
            }
            
            const pdfBlob = pdf.output('blob');
            showDownload(pdfBlob, 'images_converted.pdf');
            
        } catch (error) {
            console.error(error);
            app.showToast('Error converting images to PDF', 'error');
        } finally {
            showLoading(false);
        }
    });

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function getImgType(mimeType) {
        if (mimeType.includes('png')) return 'PNG';
        if (mimeType.includes('webp')) return 'WEBP';
        return 'JPEG';
    }

    // DOCX to PDF Logic
    const docxDropZone = document.getElementById('docx-drop-zone');
    const docxInput = document.getElementById('docx-input');
    const docxPreview = document.getElementById('docx-preview');
    const docxHtmlContent = document.getElementById('docx-html-content');
    const docxActionArea = document.getElementById('docx-action-area');
    const convertDocxBtn = document.getElementById('convert-docx-btn');
    
    let currentDocxHtml = '';

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        docxDropZone.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        docxDropZone.addEventListener(eventName, () => docxDropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        docxDropZone.addEventListener(eventName, () => docxDropZone.classList.remove('dragover'), false);
    });

    docxDropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleDocxFile(files[0]);
    });

    docxInput.addEventListener('change', function() {
        if (this.files.length > 0) handleDocxFile(this.files[0]);
    });

    function handleDocxFile(file) {
        if (!file.name.endsWith('.docx')) {
            app.showToast('Please upload a valid .docx file', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const arrayBuffer = event.target.result;
            
            showLoading(true);
            mammoth.convertToHtml({arrayBuffer: arrayBuffer})
                .then(function(result) {
                    currentDocxHtml = result.value;
                    docxHtmlContent.innerHTML = currentDocxHtml;
                    docxPreview.classList.remove('hidden');
                    docxActionArea.classList.remove('hidden');
                })
                .catch(function(err) {
                    console.error(err);
                    app.showToast('Error reading DOCX file', 'error');
                })
                .finally(() => {
                    showLoading(false);
                });
        };
        reader.readAsArrayBuffer(file);
    }

    convertDocxBtn.addEventListener('click', async () => {
        if (!currentDocxHtml) return;
        
        showLoading(true);
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                unit: 'pt',
                format: 'a4',
                orientation: 'portrait'
            });
            
            // A simple approach using html2canvas which is often bundled or available
            // Let's create a temporary container styled for A4
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = currentDocxHtml;
            tempDiv.style.width = '595px'; // A4 width at 72dpi roughly
            tempDiv.style.padding = '40px';
            tempDiv.style.background = 'white';
            tempDiv.style.color = 'black';
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            
            // Use jsPDF's built in html method (requires html2canvas)
            await doc.html(tempDiv, {
                callback: function (doc) {
                    document.body.removeChild(tempDiv);
                    const pdfBlob = doc.output('blob');
                    showDownload(pdfBlob, 'document_converted.pdf');
                },
                x: 10,
                y: 10,
                width: 575, //target width
                windowWidth: 595
            });
            
        } catch (error) {
            console.error(error);
            app.showToast('Error converting document', 'error');
        } finally {
            showLoading(false);
        }
    });

    // Helper functions
    function showLoading(show) {
        document.getElementById('loading-overlay').classList.toggle('hidden', !show);
    }

    function showDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const downloadLink = document.getElementById('download-link');
        downloadLink.href = url;
        downloadLink.download = filename;
        
        document.getElementById('download-area').classList.remove('hidden');
        document.querySelector('.tab-container').classList.add('hidden');
    }

    document.getElementById('reset-btn').addEventListener('click', resetUI);

    function resetUI() {
        uploadedImages = [];
        currentDocxHtml = '';
        
        imgPreviewContainer.innerHTML = '';
        imgPreviewContainer.classList.add('hidden');
        imgOptions.classList.add('hidden');
        imgActionArea.classList.add('hidden');
        
        docxPreview.classList.add('hidden');
        docxHtmlContent.innerHTML = '';
        docxActionArea.classList.add('hidden');
        
        document.getElementById('download-area').classList.add('hidden');
        document.querySelector('.tab-container').classList.remove('hidden');
        
        imgInput.value = '';
        docxInput.value = '';
    }
    
    if (window.app && app.createToolNav) {
        app.createToolNav();
    }
});
