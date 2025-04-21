/**
 * Pneumonia Detection JavaScript
 * Handles the X-ray image upload and pneumonia detection functionality
 */

// Initialize pneumonia detection module when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the pneumonia detection UI if the elements exist
    initializePneumoniaDetection();
});

/**
 * Initialize the pneumonia detection functionality
 */
function initializePneumoniaDetection() {
    // Check if we're on a page with the pneumonia detection elements
    const pneumoniaTab = document.getElementById('pneumonia-detection-tab');
    if (!pneumoniaTab) return;
    
    // Set up the pneumonia detection tab click handler
    pneumoniaTab.addEventListener('click', function() {
        showPneumoniaDetectionPanel();
    });
    
    // Set up the image upload form
    const pneumoniaForm = document.getElementById('pneumonia-upload-form');
    if (pneumoniaForm) {
        pneumoniaForm.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadAndDetectPneumonia();
        });
    }
}

/**
 * Show the pneumonia detection panel when tab is clicked
 */
function showPneumoniaDetectionPanel() {
    // Hide all panels first
    const allPanels = document.querySelectorAll('.tab-panel');
    allPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    
    // Show the pneumonia detection panel
    const pneumoniaPanel = document.getElementById('pneumonia-detection-panel');
    if (pneumoniaPanel) {
        pneumoniaPanel.style.display = 'block';
    }
    
    // Update active tab styling
    const allTabs = document.querySelectorAll('.tab-button');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });
    
    const pneumoniaTab = document.getElementById('pneumonia-detection-tab');
    if (pneumoniaTab) {
        pneumoniaTab.classList.add('active');
    }
}

/**
 * Upload and analyze chest X-ray for pneumonia
 */
function uploadAndDetectPneumonia() {
    const form = document.getElementById('pneumonia-upload-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const patientId = "12345"; 
    formData.append('patient_id', patientId);
    
    // // Add patient ID to the form data
    // formData.append('patient_id', state.patientId);
    
    // Show loading state
    const resultsContainer = document.getElementById('pneumonia-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Analyzing chest X-ray for pneumonia...</p>
            </div>
        `;
    }
    
    // Send to server
    fetch('/api/multimodal/pneumonia-detection', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Pneumonia detection results:', data);
        
        // Display the results
        displayPneumoniaResults(data);
        
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
                    <p>Error analyzing X-ray. Please try again.</p>
                </div>
            `;
        }
    });
}

/**
 * Display pneumonia detection results
 */
function displayPneumoniaResults(results) {
    const resultsContainer = document.getElementById('pneumonia-results');
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
    const isPneumonia = results.is_pneumonia;
    const confidence = results.confidence.toFixed(1);
    const predictedClass = results.predicted_class;
    const severity = results.severity;
    
    // Set result class based on finding
    let resultClass = isPneumonia ? 'pneumonia-positive' : 'pneumonia-negative';
    let severityText = '';
    
    if (isPneumonia) {
        if (severity === 'severe') {
            severityText = 'Severe';
        } else if (severity === 'moderate') {
            severityText = 'Moderate';
        } else {
            severityText = 'Mild';
        }
    }
    
    // Create results HTML
    let html = `
        <div class="pneumonia-result ${resultClass}">
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-${isPneumonia ? 'lungs' : 'check-circle'}"></i>
                </div>
                <div class="result-summary">
                    <h3>${isPneumonia ? 'Pneumonia Detected' : 'No Pneumonia Detected'}</h3>
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
                <span class="detail-value">${predictedClass}</span>
            </div>
    `;
    
    // Add severity if pneumonia detected
    if (isPneumonia) {
        html += `
            <div class="detail-item">
                <span class="detail-label">Severity:</span>
                <span class="detail-value severity-${severity}">${severityText}</span>
            </div>
        `;
    }
    
    // Add all scores
    if (results.all_scores) {
        html += `
            <div class="detail-item">
                <span class="detail-label">Detailed Scores:</span>
                <div class="score-bars">
        `;
        
        // Add score bars for each class
        for (const [className, score] of Object.entries(results.all_scores)) {
            html += `
                <div class="score-bar-item">
                    <span class="score-label">${className}:</span>
                    <div class="score-bar-container">
                        <div class="score-bar" style="width: ${score}%"></div>
                    </div>
                    <span class="score-value">${score.toFixed(1)}%</span>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    }
    
    // Add recommendations section if pneumonia detected
    if (isPneumonia) {
        html += `
            <div class="recommendations">
                <h4>Recommendations:</h4>
                <ul>
                    <li>Consult with a medical professional for confirmation</li>
                    <li>Consider additional diagnostic tests</li>
                    ${severity === 'severe' ? '<li>Consider urgent medical attention</li>' : ''}
                </ul>
            </div>
        `;
    }
    
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
    const imageContainer = document.getElementById('pneumonia-image-preview');
    if (imageContainer) {
        const imageFile = document.getElementById('pneumonia-image').files[0];
        if (imageFile) {
            // Create object URL for the image file
            const objectUrl = URL.createObjectURL(imageFile);
            
            // Display the image
            imageContainer.innerHTML = `
                <img src="${objectUrl}" alt="Chest X-ray" class="xray-preview">
            `;
        }
    }
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