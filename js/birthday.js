document.addEventListener('DOMContentLoaded', () => {
    const birthdateInput = document.getElementById('birthdate-input');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsSection = document.getElementById('results-section');
    const errorMsg = document.getElementById('error-msg');
    
    // Set max date to today
    const todayStr = new Date().toISOString().split('T')[0];
    birthdateInput.max = todayStr;

    let countdownInterval = null;

    calculateBtn.addEventListener('click', () => {
        const dateVal = birthdateInput.value;
        if (!dateVal) {
            showError("Please select a date.");
            return;
        }

        const birthDate = new Date(dateVal);
        const now = new Date();

        if (birthDate > now) {
            showError("Birthdate cannot be in the future.");
            return;
        }

        errorMsg.style.display = 'none';
        
        // Calculate diffs
        calculateAgeStats(birthDate, now);
        calculateTraits(birthDate);
        startCountdown(birthDate);

        // Show results
        resultsSection.classList.add('show');
    });

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.style.display = 'block';
        resultsSection.classList.remove('show');
        if (countdownInterval) clearInterval(countdownInterval);
    }

    function calculateAgeStats(birthDate, now) {
        // Exact age
        let years = now.getFullYear() - birthDate.getFullYear();
        let months = now.getMonth() - birthDate.getMonth();
        let days = now.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            days += lastMonth.getDate();
        }
        if (months < 0) {
            years--;
            months += 12;
        }

        document.getElementById('exact-age-display').textContent = `${years} Years, ${months} Months, ${days} Days`;

        // Total durations
        const diffMs = now - birthDate;
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
        const totalMinutes = Math.floor(diffMs / (1000 * 60));

        animateValue('fact-days', totalDays);
        animateValue('total-hours', totalHours);
        animateValue('total-minutes', totalMinutes);
    }

    function calculateTraits(d) {
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        document.getElementById('day-of-week').textContent = daysOfWeek[d.getDay()];

        const m = d.getMonth() + 1; // 1-12
        const day = d.getDate();
        
        document.getElementById('zodiac-sign').textContent = getZodiac(m, day);
        document.getElementById('birthstone').textContent = getBirthstone(m);
        document.getElementById('chinese-zodiac').textContent = getChineseZodiac(d.getFullYear());
        document.getElementById('season').textContent = getSeason(m);
    }

    function startCountdown(birthDate) {
        if (countdownInterval) clearInterval(countdownInterval);

        const updateCountdown = () => {
            const now = new Date();
            let nextBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
            
            if (nextBday < now && nextBday.toDateString() !== now.toDateString()) {
                nextBday.setFullYear(now.getFullYear() + 1);
            }

            const diff = nextBday - now;
            
            if (diff <= 0) {
                document.getElementById('cd-days').textContent = "00";
                document.getElementById('cd-hours').textContent = "00";
                document.getElementById('cd-minutes').textContent = "00";
                document.getElementById('cd-seconds').textContent = "00";
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const m = Math.floor((diff / 1000 / 60) % 60);
            const s = Math.floor((diff / 1000) % 60);

            document.getElementById('cd-days').textContent = d.toString().padStart(2, '0');
            document.getElementById('cd-hours').textContent = h.toString().padStart(2, '0');
            document.getElementById('cd-minutes').textContent = m.toString().padStart(2, '0');
            document.getElementById('cd-seconds').textContent = s.toString().padStart(2, '0');
        };

        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }

    function animateValue(id, end) {
        const obj = document.getElementById(id);
        const duration = 1500;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * end);
            obj.innerHTML = current.toLocaleString();
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end.toLocaleString();
            }
        };
        window.requestAnimationFrame(step);
    }

    function getZodiac(m, d) {
        if ((m == 3 && d >= 21) || (m == 4 && d <= 19)) return "♈ Aries";
        if ((m == 4 && d >= 20) || (m == 5 && d <= 20)) return "♉ Taurus";
        if ((m == 5 && d >= 21) || (m == 6 && d <= 20)) return "♊ Gemini";
        if ((m == 6 && d >= 21) || (m == 7 && d <= 22)) return "♋ Cancer";
        if ((m == 7 && d >= 23) || (m == 8 && d <= 22)) return "♌ Leo";
        if ((m == 8 && d >= 23) || (m == 9 && d <= 22)) return "♍ Virgo";
        if ((m == 9 && d >= 23) || (m == 10 && d <= 22)) return "♎ Libra";
        if ((m == 10 && d >= 23) || (m == 11 && d <= 21)) return "♏ Scorpio";
        if ((m == 11 && d >= 22) || (m == 12 && d <= 21)) return "♐ Sagittarius";
        if ((m == 12 && d >= 22) || (m == 1 && d <= 19)) return "♑ Capricorn";
        if ((m == 1 && d >= 20) || (m == 2 && d <= 18)) return "♒ Aquarius";
        return "♓ Pisces";
    }

    function getChineseZodiac(year) {
        const animals = ["🐒 Monkey", "🐓 Rooster", "🐕 Dog", "🐖 Pig", "🐀 Rat", "🐂 Ox", "🐅 Tiger", "🐇 Rabbit", "🐉 Dragon", "🐍 Snake", "🐎 Horse", "🐐 Goat"];
        return animals[year % 12];
    }

    function getBirthstone(m) {
        const stones = ["Garnet", "Amethyst", "Aquamarine", "Diamond", "Emerald", "Pearl", "Ruby", "Peridot", "Sapphire", "Opal", "Topaz", "Turquoise"];
        return stones[m - 1];
    }

    function getSeason(m) {
        if (m >= 3 && m <= 5) return "🌸 Spring";
        if (m >= 6 && m <= 8) return "☀️ Summer";
        if (m >= 9 && m <= 11) return "🍂 Autumn";
        return "❄️ Winter";
    }
});
