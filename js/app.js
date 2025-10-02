// --- Navigation Logic ---
const selectorScreen = document.getElementById('template-selector');
const appScreen = document.getElementById('app-screen');
const templateContent = document.getElementById('template-content');
const receiptPreview = document.getElementById('receipt-preview');
const templateTitle = document.getElementById('template-title');
const inputForm = document.querySelector('.input-form'); // Select the input form container

/**
 * Shows the template selection screen and hides the app screen.
 */
function showSelector() {
    appScreen.classList.remove('active');
    selectorScreen.classList.add('active');
    templateContent.innerHTML = ''; // Clear loaded template
    receiptPreview.innerHTML = ''; // Clear preview
    templateTitle.textContent = '';
}
window.showSelector = showSelector;

/**
 * Loads a template file and switches to the app screen.
 * @param {string} url The path to the template HTML file.
 * @param {string} title The display name of the template.
 */
async function loadTemplate(url, title) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        
        // 1. Load the template HTML into the input form
        templateContent.innerHTML = html;
        templateTitle.textContent = title;

        // 2. Hide selector and show app screen
        selectorScreen.classList.remove('active');
        appScreen.classList.add('active');
        
        // 3. Set up the initial preview structure by finding the template element
        const previewTemplate = document.getElementById('weighment-slip-preview');
        if (previewTemplate) {
            const templateClone = document.importNode(previewTemplate.content, true);
            receiptPreview.innerHTML = '';
            receiptPreview.appendChild(templateClone);
        }

    } catch (error) {
        console.error('Failed to load template:', error);
        alert('Could not load template. See console for details.');
    }
}
window.loadTemplate = loadTemplate; 

// --- Manual Update & Calculation Logic ---

/**
 * Calculates Net Weight/Quantity and manually updates a single element in the preview.
 * @param {string} targetId The ID of the preview element (e.g., 'net-weight').
 * @param {string|number} value The value to display.
 */
function updatePreviewElement(targetId, value) {
    const previewElement = document.getElementById(`preview-${targetId}`);
    if (previewElement) {
        previewElement.textContent = value;
    }
}

/**
 * This is the main function called by the 'Preview' button.
 * It reads all inputs, performs calculations, and updates the receipt preview.
 */
function updatePreview() {
    // 1. Read all basic input fields
    const inputFields = templateContent.querySelectorAll('input[data-preview-target]');
    inputFields.forEach(input => {
        const targetId = input.getAttribute('data-preview-target');
        updatePreviewElement(targetId, input.value);
    });

    // 2. Perform custom calculations
    const load = parseFloat(document.getElementById('load-weight').value) || 0;
    const empty = parseFloat(document.getElementById('empty-weight').value) || 0;
    
    const netWeight = Math.max(0, load - empty);
    const quantity = netWeight / 1000;

    // 3. Update calculated fields in the preview
    updatePreviewElement('net-weight', netWeight.toFixed(0)); // Net weight in KG
    updatePreviewElement('quantity', quantity.toFixed(2));     // Quantity in MT
}
window.updatePreview = updatePreview; // Expose globally for the new button


// --- Printing Logic ---

/**
 * Prints the content of the receipt preview using the CSS print media query.
 */
function printReceipt() {
    // Ensure all data is updated right before printing
    updatePreview(); 
    window.print();
}
window.printReceipt = printReceipt; // Expose globally for index.html button

// Initial state: Show selector screen on load
document.addEventListener('DOMContentLoaded', () => {
    showSelector();
});