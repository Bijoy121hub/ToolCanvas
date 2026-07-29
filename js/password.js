document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const pwDisplay = document.getElementById('password-display');
    const copyBtn = document.getElementById('copy-btn');
    const generateBtn = document.getElementById('generate-btn');
    const lengthSlider = document.getElementById('length-slider');
    const lengthVal = document.getElementById('length-val');
    
    const chkUpper = document.getElementById('chk-uppercase');
    const chkLower = document.getElementById('chk-lowercase');
    const chkNumbers = document.getElementById('chk-numbers');
    const chkSymbols = document.getElementById('chk-symbols');
    const chkAmbiguous = document.getElementById('chk-ambiguous');

    const strengthBar = document.getElementById('strength-bar');
    const strengthLabel = document.getElementById('strength-label');

    const batchCount = document.getElementById('batch-count');
    const batchGenBtn = document.getElementById('batch-generate-btn');
    const batchList = document.getElementById('batch-list');

    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');

    // Char sets
    const CHARS = {
        upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lower: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };
    const AMBIGUOUS = 'l1IO0oO';

    let history = [];

    // Init
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
        generateMainPassword();
    });

    [chkUpper, chkLower, chkNumbers, chkSymbols, chkAmbiguous].forEach(chk => {
        chk.addEventListener('change', generateMainPassword);
    });

    generateBtn.addEventListener('click', generateMainPassword);
    
    copyBtn.addEventListener('click', () => {
        copyToClipboard(pwDisplay.textContent, copyBtn);
    });

    batchGenBtn.addEventListener('click', generateBatch);
    clearHistoryBtn.addEventListener('click', () => {
        history = [];
        renderHistory();
    });

    function getActiveChars() {
        let sets = [];
        if (chkUpper.checked) sets.push(CHARS.upper);
        if (chkLower.checked) sets.push(CHARS.lower);
        if (chkNumbers.checked) sets.push(CHARS.numbers);
        if (chkSymbols.checked) sets.push(CHARS.symbols);

        if (chkAmbiguous.checked) {
            sets = sets.map(set => {
                return set.split('').filter(c => !AMBIGUOUS.includes(c)).join('');
            });
        }
        return sets;
    }

    function generatePassword(length, sets) {
        if (sets.length === 0) return '';
        
        let password = '';
        let allChars = sets.join('');

        // Ensure at least one from each set
        sets.forEach(set => {
            if (set.length > 0 && password.length < length) {
                password += set[Math.floor(Math.random() * set.length)];
            }
        });

        // Fill the rest
        while (password.length < length) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle
        password = password.split('').sort(() => 0.5 - Math.random()).join('');
        return password;
    }

    function generateMainPassword() {
        const length = parseInt(lengthSlider.value);
        const sets = getActiveChars();
        
        if (sets.length === 0) {
            pwDisplay.textContent = 'Select at least one option';
            strengthBar.style.width = '0%';
            strengthLabel.textContent = '';
            return;
        }

        const pwd = generatePassword(length, sets);
        pwDisplay.textContent = pwd;
        
        updateStrength(pwd, sets.length);
        addToHistory(pwd);
    }

    function generateBatch() {
        const count = Math.min(Math.max(parseInt(batchCount.value) || 5, 1), 20);
        const length = parseInt(lengthSlider.value);
        const sets = getActiveChars();
        
        if (sets.length === 0) return;

        batchList.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const pwd = generatePassword(length, sets);
            const li = document.createElement('li');
            li.className = 'pwd-item';
            
            const span = document.createElement('span');
            span.textContent = pwd;
            
            const btn = document.createElement('button');
            btn.textContent = 'Copy';
            btn.onclick = () => copyToClipboard(pwd, btn);

            li.appendChild(span);
            li.appendChild(btn);
            batchList.appendChild(li);
        }
    }

    function addToHistory(pwd) {
        history.unshift({ pwd, time: new Date().toLocaleTimeString() });
        if (history.length > 10) history.pop();
        renderHistory();
    }

    function renderHistory() {
        historyList.innerHTML = '';
        history.forEach(item => {
            const li = document.createElement('li');
            li.className = 'pwd-item';
            
            const span = document.createElement('span');
            span.textContent = `${item.pwd} (${item.time})`;
            
            const btn = document.createElement('button');
            btn.textContent = 'Copy';
            btn.onclick = () => copyToClipboard(item.pwd, btn);

            li.appendChild(span);
            li.appendChild(btn);
            historyList.appendChild(li);
        });
    }

    function updateStrength(pwd, poolVariety) {
        let entropy = 0;
        let poolSize = 0;
        
        if (chkUpper.checked) poolSize += 26;
        if (chkLower.checked) poolSize += 26;
        if (chkNumbers.checked) poolSize += 10;
        if (chkSymbols.checked) poolSize += 30;
        if (chkAmbiguous.checked) poolSize -= 7;

        if (poolSize > 0) {
            entropy = pwd.length * (Math.log(poolSize) / Math.log(2));
        }

        let strength = 'Very Weak';
        let color = 'var(--danger)';
        let percent = 20;

        if (entropy > 100) {
            strength = 'Very Strong';
            color = 'var(--primary)';
            percent = 100;
        } else if (entropy > 80) {
            strength = 'Strong';
            color = 'var(--success)';
            percent = 80;
        } else if (entropy > 60) {
            strength = 'Good';
            color = '#a3e635'; // lime
            percent = 60;
        } else if (entropy > 40) {
            strength = 'Fair';
            color = 'var(--warning)';
            percent = 40;
        } else if (entropy > 25) {
            strength = 'Weak';
            color = '#f97316'; // orange
            percent = 25;
        }

        strengthBar.style.width = `${percent}%`;
        strengthBar.style.backgroundColor = color;
        strengthLabel.textContent = strength;
        strengthLabel.style.color = color;
    }

    function copyToClipboard(text, btn) {
        // Fallback or navigator.clipboard
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                showCopied(btn);
            });
        } else {
            // Check if app.js has copyToClipboard globally
            if (typeof window.copyToClipboard === 'function' && btn.id === 'copy-btn') {
                window.copyToClipboard(text);
                showCopied(btn);
            } else {
                let textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    showCopied(btn);
                } catch (err) {
                    console.error('Copy failed', err);
                }
                textArea.remove();
            }
        }
    }

    function showCopied(btn) {
        const oldText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
            btn.textContent = oldText;
        }, 1500);
    }

    // Initial run
    generateMainPassword();
});
