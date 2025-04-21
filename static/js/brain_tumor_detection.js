/**
 * Brain Tumor Detection JavaScript
 * Handles the MRI image upload and brain tumor detection functionality
 */

// Initialize brain tumor detection module when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the brain tumor detection UI if the elements exist
    initializeBrainTumorDetection();
});

/**
 * Initialize the brain tumor detection functionality
 */
function initializeBrainTumorDetection() {
    // Check if we're on a page with the brain tumor detection elements
    const brainTumorTab = document.getElementById('brain-tumor-detection-tab');
    if (!brainTumorTab) return;
    
    // Set up the brain tumor detection tab click handler
    brainTumorTab.addEventListener('click', function() {
        showBrainTumorDetectionPanel();
    });
    
    // Set up the image upload form
    const brainTumorForm = document.getElementById('brain-tumor-upload-form');
    if (brainTumorForm) {
        brainTumorForm.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadAndDetectBrainTumor();
        });
    }
}

/**
 * Show the brain tumor detection panel when tab is clicked
 */
function showBrainTumorDetectionPanel() {
    // Hide all panels first
    const allPanels = document.querySelectorAll('.tab-panel');
    allPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Show the brain tumor detection panel
    const brainTumorPanel = document.getElementById('brain-tumor-detection-panel');
    if (brainTumorPanel) {
        brainTumorPanel.style.display = 'block';
    }
    
    // Update active tab styling
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    const brainTumorTab = document.getElementById('brain-tumor-detection-tab');
    if (brainTumorTab) {
        brainTumorTab.classList.add('active');
    }
}

/**
 * Upload and analyze MRI for brain tumor
 */
function uploadAndDetectBrainTumor() {
    const form = document.getElementById('brain-tumor-upload-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const patientId = "12345"; // Would be dynamic in a real application
    formData.append('patient_id', patientId);
    
    // Show loading state
    const resultsContainer = document.getElementById('brain-tumor-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Analyzing MRI scan for brain tumor...</p>
            </div>
        `;
    }
    
    // Send to server
    fetch('/api/multimodal/brain-tumor-detection', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Brain tumor detection results:', data);
        
        // Display the results
        displayBrainTumorResults(data);
        
        // Request a fresh multimodal update to reflect the new analysis
        if (typeof requestMultimodalUpdate === 'function') {
            requestMultimodalUpdate();
        }
    })
    .catch(error => {
        console.error('Error analyzing image:', error);
        
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error analyzing MRI scan. Please try again.</p>
                </div>
            `;
        }
    });
}

/**
 * Display brain tumor detection results
 */
function displayBrainTumorResults(results) {
    const resultsContainer = document.getElementById('brain-tumor-results');
    if (!resultsContainer) return;
    
    // Check if analysis was successful
    if (!results.success) {
        resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error: ${results.error || 'Analysis failed'}</p>
            </div>
        `;
        return;
    }
    
    // Get results
    const isTumor = results.is_tumor;
    const predictedClass = results.predicted_class;
    const confidence = results.confidence.toFixed(1);
    const tumorInfo = results.tumor_type || {};
    
    // Set result class based on finding
    let resultClass = isTumor ? 'tumor-positive' : 'tumor-negative';
    let iconClass = isTumor ? 'brain' : 'check-circle';
    
    // Create results HTML
    let html = `
        <div class="brain-tumor-result ${resultClass}">
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="result-summary">
                    <h3>${isTumor ? tumorInfo.name || predictedClass : 'No Tumor Detected'}</h3>
                    <div class="confidence-bar">
                        <div class="confidence-level" style="width: ${confidence}%"></div>
                    </div>
                    <p class="confidence-text">${confidence}% confidence</p>
                </div>
            </div>
    `;
    
    // Add details section
    html += `
        <div class="result-details">
            <div class="detail-item">
                <span class="detail-label">Classification:</span>
                <span class="detail-value">${formatTumorTypeName(predictedClass)}</span>
            </div>
    `;
    
    // Add class probabilities
    if (results.class_probabilities) {
        html += `
            <div class="detail-item">
                <span class="detail-label">Detailed Analysis:</span>
                <div class="probability-bars">
        `;
        
        // Add probability bars for each class
        for (const [className, probability] of Object.entries(results.class_probabilities)) {
            html += `
                <div class="probability-bar-item">
                    <span class="probability-label">${formatTumorTypeName(className)}:</span>
                    <div class="probability-bar-container">
                        <div class="probability-bar" style="width: ${probability}%"></div>
                    </div>
                    <span class="probability-value">${probability.toFixed(1)}%</span>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // If a tumor is detected, add information about it
    if (isTumor && tumorInfo) {
        html += `
            <div class="tumor-information">
                <h4>About ${tumorInfo.name || formatTumorTypeName(predictedClass)}</h4>
                <p>${tumorInfo.description || 'No description available.'}</p>
                
                <div class="tumor-info-grid">
        `;
        
        // Add common symptoms if available
        if (tumorInfo.common_symptoms && tumorInfo.common_symptoms.length > 0) {
            html += `
                <div class="tumor-info-section">
                    <h5>Common Symptoms</h5>
                    <ul>
            `;
            
            tumorInfo.common_symptoms.forEach(symptom => {
                html += `<li>${symptom}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add treatment options if available
        if (tumorInfo.treatment_options && tumorInfo.treatment_options.length > 0) {
            html += `
                <div class="tumor-info-section">
                    <h5>Treatment Options</h5>
                    <ul>
            `;
            
            tumorInfo.treatment_options.forEach(treatment => {
                html += `<li>${treatment}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add severity if available
        if (tumorInfo.severity) {
            html += `
                <div class="tumor-info-section full-width">
                    <h5>Severity Level</h5>
                    <div class="severity-indicator">
                        <span class="severity-level ${getSeverityClass(tumorInfo.severity)}">${tumorInfo.severity}</span>
                    </div>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Add recommendations
    html += `
        <div class="recommendations">
            <h4>Recommendations:</h4>
            <ul>
                <li>Consult with a neurologist or neurosurgeon for professional evaluation</li>
                <li>Consider additional diagnostic tests such as contrast-enhanced MRI</li>
                ${isTumor ? '<li>Discuss treatment options with a specialist immediately</li>' : ''}
                ${isTumor ? '<li>Schedule follow-up imaging to monitor progression</li>' : '<li>Schedule periodic follow-up imaging as recommended by your doctor</li>'}
            </ul>
        </div>
    `;
    
    // Close the details and result divs
    html += `
        </div>
    </div>
    <div class="timestamp">Analysis completed at ${formatTimestamp(results.timestamp)}</div>
    <div class="disclaimer">
        <i class="fas fa-info-circle"></i>
        This is an AI-assisted analysis and should not replace professional medical diagnosis.
    </div>
    `;
    
    // Update the container
    resultsContainer.innerHTML = html;
    
    // Display the image preview if there's an image container
    const imageContainer = document.getElementById('brain-tumor-image-preview');
    if (imageContainer) {
        const imageFile = document.getElementById('brain-tumor-image').files[0];
        if (imageFile) {
            // Create object URL for the image file
            const objectUrl = URL.createObjectURL(imageFile);
            
            // Display the image
            imageContainer.innerHTML = `
                <img src="${objectUrl}" alt="MRI Scan" class="mri-preview">
            `;
        }
    }
}

/**
 * Format tumor type name for display
 */
function formatTumorTypeName(tumorType) {
    if (!tumorType) return 'Unknown';
    
    // Handle special cases
    if (tumorType === 'no tumor') return 'No Tumor';
    
    // Capitalize first letter of each word
    return tumorType.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Get CSS class for severity level
 */
function getSeverityClass(severity) {
    if (!severity) return 'unknown';
    
    const lower = severity.toLowerCase();
    
    if (lower.includes('high')) return 'high';
    if (lower.includes('moderate')) return 'moderate';
    if (lower.includes('low')) return 'low';
    
    return 'unknown';
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    
    return date.toLocaleString();
}