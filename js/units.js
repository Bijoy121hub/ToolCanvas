const unitsData = {
    length: {
        base: 'm',
        units: {
            'mm': 0.001, 'cm': 0.01, 'm': 1, 'km': 1000, 
            'inch': 0.0254, 'foot': 0.3048, 'yard': 0.9144, 'mile': 1609.344, 'nautical mile': 1852
        }
    },
    weight: {
        base: 'kg',
        units: {
            'mg': 0.000001, 'g': 0.001, 'kg': 1, 'tonne': 1000, 
            'oz': 0.0283495, 'lb': 0.453592, 'stone': 6.35029
        }
    },
    temperature: {
        base: 'Celsius',
        units: { 'Celsius': 1, 'Fahrenheit': 1, 'Kelvin': 1 }
    },
    volume: {
        base: 'L',
        units: {
            'ml': 0.001, 'L': 1, 'gallon (US)': 3.78541, 'gallon (UK)': 4.54609, 
            'cup': 0.24, 'fl oz': 0.0295735, 'tablespoon': 0.0147868, 'teaspoon': 0.00492892
        }
    },
    area: {
        base: 'sq m',
        units: {
            'sq mm': 0.000001, 'sq cm': 0.0001, 'sq m': 1, 'sq km': 1000000, 
            'sq inch': 0.00064516, 'sq foot': 0.092903, 'sq yard': 0.836127, 'acre': 4046.86, 'hectare': 10000
        }
    },
    speed: {
        base: 'm/s',
        units: {
            'm/s': 1, 'km/h': 0.277778, 'mph': 0.44704, 'knot': 0.514444, 'ft/s': 0.3048
        }
    },
    data: {
        base: 'byte',
        units: {
            'bit': 0.125, 'byte': 1, 'KB': 1000, 'MB': 1000000, 'GB': 1000000000, 'TB': 1000000000000, 'PB': 1000000000000000,
            'Kibibyte': 1024, 'Mebibyte': 1048576, 'Gibibyte': 1073741824
        }
    },
    currency: {
        base: 'USD',
        units: {
            'USD': 1, 'EUR': 1, 'GBP': 1, 'JPY': 1, 'AUD': 1, 'CAD': 1, 'CHF': 1, 'CNY': 1, 'INR': 1, 'BDT': 1, 'KRW': 1, 'SGD': 1, 'BRL': 1, 'MXN': 1
        }
    }
};

let currentCategory = 'length';
let currencyRates = null;

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-btn');
    const fromVal = document.getElementById('from-val');
    const toVal = document.getElementById('to-val');
    const fromUnit = document.getElementById('from-unit');
    const toUnit = document.getElementById('to-unit');
    const swapBtn = document.getElementById('swap-btn');
    const refTbody = document.getElementById('ref-tbody');
    const currencyInfo = document.getElementById('currency-info');

    // Fetch currency rates
    async function fetchRates() {
        const cached = localStorage.getItem('currencyRates');
        const timestamp = localStorage.getItem('currencyRatesTime');
        const now = Date.now();
        
        if (cached && timestamp && now - timestamp < 3600000) {
            currencyRates = JSON.parse(cached);
            unitsData.currency.units = { ...unitsData.currency.units, ...currencyRates.rates };
            unitsData.currency.units['USD'] = 1;
            currencyInfo.textContent = `Rates updated: ${new Date(parseInt(timestamp)).toLocaleString()}`;
            if(currentCategory === 'currency') updateConversions();
            return;
        }

        try {
            currencyInfo.style.display = 'block';
            currencyInfo.textContent = 'Fetching rates...';
            const res = await fetch('https://api.frankfurter.app/latest?from=USD');
            if(!res.ok) throw new Error('Network error');
            const data = await res.json();
            currencyRates = data;
            localStorage.setItem('currencyRates', JSON.stringify(data));
            localStorage.setItem('currencyRatesTime', now.toString());
            
            // Add other mock rates for API missing ones if needed (like BDT)
            if(!data.rates.BDT) data.rates.BDT = 110; 
            
            unitsData.currency.units = { ...unitsData.currency.units, ...data.rates };
            unitsData.currency.units['USD'] = 1;
            currencyInfo.textContent = `Rates updated: just now`;
            if(currentCategory === 'currency') updateConversions();
        } catch(e) {
            currencyInfo.textContent = 'Failed to fetch live rates. Using fallback values.';
            console.error(e);
        }
    }
    fetchRates();

    function populateSelects() {
        fromUnit.innerHTML = '';
        toUnit.innerHTML = '';
        const units = Object.keys(unitsData[currentCategory].units);
        units.forEach(u => {
            fromUnit.add(new Option(u, u));
            toUnit.add(new Option(u, u));
        });
        if(units.length > 1) toUnit.selectedIndex = 1;
    }

    function formatNumber(num) {
        if(isNaN(num)) return '0';
        if(num === 0) return '0';
        if(Math.abs(num) < 0.0001 || Math.abs(num) > 10000000) return num.toExponential(4);
        return parseFloat(num.toFixed(6)).toString();
    }

    function convert(val, from, to, cat) {
        if(cat === 'temperature') {
            let celsius = 0;
            if(from === 'Celsius') celsius = val;
            else if(from === 'Fahrenheit') celsius = (val - 32) * 5/9;
            else if(from === 'Kelvin') celsius = val - 273.15;

            if(to === 'Celsius') return celsius;
            if(to === 'Fahrenheit') return (celsius * 9/5) + 32;
            if(to === 'Kelvin') return celsius + 273.15;
        }
        else if (cat === 'currency') {
            if(!currencyRates && !unitsData.currency.units[from]) return 0; // wait
            let inUSD = val / (unitsData.currency.units[from] || 1);
            return inUSD * (unitsData.currency.units[to] || 1);
        }
        else {
            let baseVal = val * unitsData[cat].units[from];
            return baseVal / unitsData[cat].units[to];
        }
    }

    function updateConversions() {
        const val = parseFloat(fromVal.value) || 0;
        const from = fromUnit.value;
        const to = toUnit.value;
        
        if(!from || !to) return;
        
        toVal.value = formatNumber(convert(val, from, to, currentCategory));

        // Update reference table
        refTbody.innerHTML = '';
        const allUnits = Object.keys(unitsData[currentCategory].units);
        allUnits.forEach(u => {
            const tr = document.createElement('tr');
            const td1 = document.createElement('td');
            td1.textContent = u;
            const td2 = document.createElement('td');
            td2.textContent = formatNumber(convert(val, from, u, currentCategory));
            tr.appendChild(td1);
            tr.appendChild(td2);
            refTbody.appendChild(tr);
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.cat;
            currencyInfo.style.display = currentCategory === 'currency' ? 'block' : 'none';
            populateSelects();
            updateConversions();
        });
    });

    swapBtn.addEventListener('click', () => {
        const temp = fromUnit.value;
        fromUnit.value = toUnit.value;
        toUnit.value = temp;
        updateConversions();
    });

    fromVal.addEventListener('input', updateConversions);
    fromUnit.addEventListener('change', updateConversions);
    toUnit.addEventListener('change', updateConversions);

    // Init
    populateSelects();
    updateConversions();
});
