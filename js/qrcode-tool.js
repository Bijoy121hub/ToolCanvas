document.addEventListener('DOMContentLoaded', () => {
    // Tabs
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Generator
    const qrOutput = document.getElementById('qr-output');
    const qrType = document.getElementById('qr-type');
    const qrContent = document.getElementById('qr-content');
    const qrSizeFg = document.getElementById('qr-color-fg');
    const qrSizeBg = document.getElementById('qr-color-bg');
    const qrSize = document.getElementById('qr-size');
    const btnDownload = document.getElementById('btn-download');

    // WiFi fields
    const wifiSsid = document.getElementById('wifi-ssid');
    const wifiPass = document.getElementById('wifi-pass');
    const wifiEnc = document.getElementById('wifi-enc');

    let qrcode = null;

    function getQRText() {
        let type = qrType.value;
        if(type === 'wifi') {
            let ssid = wifiSsid.value;
            let pass = wifiPass.value;
            let enc = wifiEnc.value;
            return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
        } else if (type === 'email') {
            return `mailto:${qrContent.value}`;
        } else if (type === 'phone') {
            return `tel:${qrContent.value}`;
        }
        return qrContent.value || ' ';
    }

    function generateQR() {
        qrOutput.innerHTML = '';
        let text = getQRText();
        let size = parseInt(qrSize.value);
        
        qrcode = new QRCode(qrOutput, {
            text: text,
            width: size,
            height: size,
            colorDark : qrSizeFg.value,
            colorLight : qrSizeBg.value,
            correctLevel : QRCode.CorrectLevel.H
        });
    }

    qrType.addEventListener('change', () => {
        document.getElementById('input-text').style.display = qrType.value === 'wifi' ? 'none' : 'block';
        document.getElementById('input-wifi').style.display = qrType.value === 'wifi' ? 'block' : 'none';
        generateQR();
    });

    [qrContent, wifiSsid, wifiPass, wifiEnc, qrSizeFg, qrSizeBg, qrSize].forEach(el => {
        el.addEventListener('input', generateQR);
    });

    btnDownload.addEventListener('click', () => {
        const img = qrOutput.querySelector('img');
        const canvas = qrOutput.querySelector('canvas');
        if(!canvas && !img) return;
        
        const dataUrl = canvas ? canvas.toDataURL("image/png") : img.src;
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'toolcanvas-qrcode.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });

    generateQR();

    // Scanner
    const btnStart = document.getElementById('btn-scan-start');
    const btnStop = document.getElementById('btn-scan-stop');
    const fileUpload = document.getElementById('qr-upload');
    const resContainer = document.getElementById('scan-result-container');
    const resText = document.getElementById('scan-text');
    const resLink = document.getElementById('scan-link');
    const btnCopy = document.getElementById('btn-copy-scan');
    const historyList = document.getElementById('scan-history');

    let html5QrcodeScanner = null;

    function onScanSuccess(decodedText, decodedResult) {
        if(html5QrcodeScanner) {
            html5QrcodeScanner.clear();
            btnStart.style.display = 'inline-block';
            btnStop.style.display = 'none';
        }
        
        resContainer.style.display = 'block';
        resText.textContent = decodedText;
        
        if(decodedText.startsWith('http://') || decodedText.startsWith('https://')) {
            resLink.href = decodedText;
            resLink.style.display = 'inline-block';
        } else {
            resLink.style.display = 'none';
        }

        // Add to history
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">${decodedText}</span>
            <span style="color: #94a3b8; font-size: 12px;">${new Date().toLocaleTimeString()}</span>
        `;
        historyList.prepend(item);
    }

    btnStart.addEventListener('click', () => {
        if(!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5Qrcode("qr-reader");
        }
        
        html5QrcodeScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            (errorMessage) => { /* ignore */ }
        ).then(() => {
            btnStart.style.display = 'none';
            btnStop.style.display = 'inline-block';
            resContainer.style.display = 'none';
        }).catch(err => alert("Camera access denied or unavailable."));
    });

    btnStop.addEventListener('click', () => {
        if(html5QrcodeScanner) {
            html5QrcodeScanner.stop().then(() => {
                btnStart.style.display = 'inline-block';
                btnStop.style.display = 'none';
            });
        }
    });

    fileUpload.addEventListener('change', (e) => {
        if(e.target.files.length == 0) return;
        const html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.scanFile(e.target.files[0], true)
        .then(decodedText => {
            onScanSuccess(decodedText);
        })
        .catch(err => {
            alert("No QR code found in the image.");
        });
    });

    btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(resText.textContent);
        const original = btnCopy.textContent;
        btnCopy.textContent = 'Copied!';
        setTimeout(() => btnCopy.textContent = original, 2000);
    });
});
