// --- Navigation Logic ---
const selectorScreen = document.getElementById('template-selector');
const appScreen = document.getElementById('app-screen');
const templateContent = document.getElementById('template-content');
const receiptPreview = document.getElementById('receipt-preview');
const templateTitle = document.getElementById('template-title');

/**
 * Shows the template selection screen and hides the app screen.
 */
function showSelector() {
    appScreen.classList.remove('active');
    selectorScreen.classList.add('active');
    templateContent.innerHTML = ''; 
    receiptPreview.innerHTML = ''; 
    templateTitle.textContent = '';
}
window.showSelector = showSelector;

/**
 * Loads a template file and switches to the app screen.
 */
async function loadTemplate(url, title) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        
        templateContent.innerHTML = html;
        templateTitle.textContent = title;

        selectorScreen.classList.remove('active');
        appScreen.classList.add('active');
        
        // Set up the initial preview structure by finding the template element
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
 * Updates a single element in the preview using its ID.
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
    // --- 1. HANDLE DATE AND TIME DYNAMICALLY ---
    const now = new Date();
    const dateString = now.toLocaleDateString();
    const timeString = now.toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit', hour12: true});

    updatePreviewElement('date', dateString);
    updatePreviewElement('time', timeString);

    // --- 2. Read all basic input fields ---
    const inputFields = templateContent.querySelectorAll('input[data-preview-target]');
    inputFields.forEach(input => {
        const targetId = input.getAttribute('data-preview-target');
        updatePreviewElement(targetId, input.value);
    });

    // --- 3. Perform custom calculations ---
    const load = parseFloat(document.getElementById('load-weight')?.value) || 0;
    const empty = parseFloat(document.getElementById('empty-weight')?.value) || 0;
    
    const netWeight = Math.max(0, load - empty);
    const quantity = netWeight / 1000;

    // --- 4. Update calculated fields in the preview ---
    updatePreviewElement('net-weight', netWeight.toFixed(0)); // Net weight in KG
    updatePreviewElement('quantity', quantity.toFixed(2));     // Quantity in MT
}
window.updatePreview = updatePreview; 


// --- Printing Logic (Physical Printer) ---

/**
 * Initiates the browser's native print dialog for direct physical printing.
 */
function printReceipt() {
    updatePreview(); 
    window.print();
}
window.printReceipt = printReceipt; 

// --- PDF Generation Logic (Client-Side) ---

/**
 * Generates and downloads a PDF file from the receipt preview content.
 */
async function saveAsPdf() {
    // 1. Ensure all data is the most recent
    updatePreview(); 

    // 2. Target the receipt element
    const receiptElement = document.getElementById('receipt-preview');

    // 3. Use html2canvas to render the HTML receipt into a canvas/image
    const canvas = await html2canvas(receiptElement, {
        scale: 3, // Increase resolution for better PDF quality
        logging: false,
        useCORS: true 
    });

    // 4. Get the image data and dimensions
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    
    const receiptWidth = 80; // mm
    const receiptHeight = (canvas.height * receiptWidth) / canvas.width; // Maintain aspect ratio

    // 5. Create the PDF document
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [receiptWidth + 5, receiptHeight + 5] // A bit larger than the content
    });

    // 6. Add the image to the PDF
    pdf.addImage(imgData, 'PNG', 2.5, 2.5, receiptWidth, receiptHeight); // Add with a small margin

    // 7. Generate filename
    const dcNumber = document.getElementById('dc-number')?.value || 'N/A';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `WeighmentSlip_${dcNumber.replace(/[^a-z0-9]/gi, '_')}_${date}.pdf`;

    // 8. Trigger the download
    pdf.save(filename);
}
window.saveAsPdf = saveAsPdf; 

// Initial state: Show selector screen on load
document.addEventListener('DOMContentLoaded', () => {
    showSelector();
});