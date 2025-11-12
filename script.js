// Configuration
const API_BASE = 'https://veerulookup.onrender.com';

// DOM Elements
const form = document.getElementById('searchForm');
const typeSelect = document.getElementById('type');
const inputValue = document.getElementById('inputValue');
const resultBox = document.getElementById('result');
const loading = document.getElementById('loading');
const submitBtn = document.getElementById('submitBtn');

// Placeholders for different types
const placeholders = {
    phone: 'e.g. 9876543210',
    aadhaar: 'e.g. 123456789012',
    gst: 'e.g. 22AAAAA0000A1Z5',
    upi: 'e.g. example@oksbi',
    ifsc: 'e.g. SBIN0001234',
    pincode: 'e.g. 110001',
    vehicle: 'e.g. DL01AA1234'
};

// Update placeholder on type change
typeSelect.addEventListener('change', () => {
    const type = typeSelect.value;
    inputValue.placeholder = placeholders[type] || 'Enter value';
    inputValue.value = '';
    hideResult();
});

// Form submit handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const value = inputValue.value.trim();

    if (!type || !value) return;

    if (!validateInput(type, value)) {
        showResult('Invalid input format!', 'error');
        return;
    }

    showLoading(true);
    hideResult();

    const url = buildUrl(type, value);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        displayResult(data, type);
    } catch (error) {
        console.error('Fetch error:', error);
        let message = 'Failed to fetch data. Try again later.';
        
        if (error.name === 'AbortError') {
            message = 'Request timed out. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
            message = 'Network error. Check your internet connection.';
        }
        
        showResult(message, 'error');
    } finally {
        showLoading(false);
    }
});

// Build API URL based on type
function buildUrl(type, value) {
    const endpoints = {
        phone: `/search_phone?number=`,
        aadhaar: `/search_aadhaar?aadhaar=`,
        gst: `/search_gst?gst=`,
        upi: `/search_upi?upi=`,
        ifsc: `/search_ifsc?ifsc=`,
        pincode: `/search_pincode?pincode=`,
        vehicle: `/search_vehicle?rc=`
    };
    return `${API_BASE}${endpoints[type]}${encodeURIComponent(value)}`;
}

// Input validation using regex
function validateInput(type, value) {
    const patterns = {
        phone: /^\d{10}$/,
        aadhaar: /^\d{12}$/,
        gst: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        upi: /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,}$/,
        ifsc: /^[A-Z]{4}0[A-Z0-9]{6}$/,
        pincode: /^\d{6}$/,
        vehicle: /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{1,4}$/
    };
    return patterns[type] ? patterns[type].test(value) : false;
}

// Display result in user-friendly format
function displayResult(data, type) {
    let html = '<strong>Result:</strong>\n\n';

    const fieldLabels = {
        phone: { name: 'Name', operator: 'Operator', circle: 'Circle' },
        aadhaar: { name: 'Name', address: 'Address' },
        gst: { legal_name: 'Legal Name', address: 'Address', trade_name: 'Trade Name' },
        upi: { name: 'Name', bank: 'Bank', ifsc: 'IFSC' },
        ifsc: { bank: 'Bank', branch: 'Branch', address: 'Address' },
        pincode: { post_office: 'Post Office', district: 'District', state: 'State' },
        vehicle: { owner: 'Owner', model: 'Model', fuel: 'Fuel', reg_date: 'Registration Date' }
    };

    const labels = fieldLabels[type] || {};
    let hasData = false;

    for (const [key, label] of Object.entries(labels)) {
        if (data[key] !== undefined && data[key] !== null) {
            html += `<strong>${label}:</strong> ${data[key]}\n`;
            hasData = true;
        }
    }

    if (!hasData) {
        html += data && typeof data === 'object' 
            ? JSON.stringify(data, null, 2) 
            : (data || 'No data found.');
    }

    showResult(html, 'success');
}

// UI Helpers
function showResult(message, type) {
    resultBox.innerHTML = message;
    resultBox.className = `result-box ${type}`;
    resultBox.style.display = 'block';
}

function hideResult() {
    resultBox.style.display = 'none';
    resultBox.className = 'result-box';
}

function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    submitBtn.disabled = show;
    submitBtn.textContent = show ? 'Searching...' : 'Submit';
}