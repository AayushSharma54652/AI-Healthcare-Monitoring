/**
 * Kidney Stone Detection JavaScript
 * Handles the CT scan image upload and kidney stone detection functionality
 */

// Initialize kidney stone detection module when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the kidney stone detection UI if the elements exist
    initializeKidneyStoneDetection();
});

/**
 * Initialize the kidney stone detection functionality
 */
function initializeKidneyStoneDetection() {
    // Check if we're on a page with the kidney stone detection elements
    const kidneyStoneTab = document.getElementById('kidney-stone-detection-tab');
    if (!kidneyStoneTab) return;
    
    // Set up tab functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all panels
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Show panel corresponding to clicked button
            const panelId = this.id.replace('-tab', '-panel');
            document.getElementById(panelId)?.classList.add('active');
        });
    });
    
    // Set up the image upload form
    const kidneyStoneForm = document.getElementById('kidney-stone-upload-form');
    if (kidneyStoneForm) {
        kidneyStoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            uploadAndDetectKidneyStone();
        });
    }
    
    // Set up image preview
    const imageInput = document.getElementById('kidney-stone-image');
    const previewContainer = document.getElementById('kidney-stone-image-preview');
    
    if (imageInput && previewContainer) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewContainer.innerHTML = `<img src="${e.target.result}" alt="CT scan preview" class="ct-preview">`;
                };
                reader.readAsDataURL(file);
            } else {
                previewContainer.innerHTML = `<div class="no-image-placeholder">CT scan preview will appear here</div>`;
            }
        });
    }
    
    // Set up example CT scan loading
    const loadExampleBtn = document.getElementById('load-example');
    if (loadExampleBtn) {
        loadExampleBtn.addEventListener('click', function() {
            // Fetch a sample CT scan from the server
            fetch('/api/multimodal/get-sample-ct')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Display the sample image
                        const imagePath = data.image_path;
                        previewContainer.innerHTML = `<img src="${imagePath}" alt="Sample CT scan" class="ct-preview sample">`;
                        
                        // Create a file object for the form
                        fetch(imagePath)
                            .then(res => res.blob())
                            .then(blob => {
                                const file = new File([blob], "sample-ct.jpg", {type: "image/jpeg"});
                                
                                // Create a DataTransfer object and add the file to it
                                const dataTransfer = new DataTransfer();
                                dataTransfer.items.add(file);
                                
                                // Set the file input's files property
                                if (imageInput) {
                                    imageInput.files = dataTransfer.files;
                                }
                            })
                            .catch(error => {
                                console.error('Error loading sample image:', error);
                            });
                    } else {
                        alert('Error loading example: ' + (data.error || 'Unknown error'));
                    }
                })
                .catch(error => {
                    console.error('Error fetching sample CT scan:', error);
                    alert('Error loading example. Please try again.');
                });
        });
    }
}

/**
 * Upload and analyze CT scan for kidney stone
 */
function uploadAndDetectKidneyStone() {
    const form = document.getElementById('kidney-stone-upload-form');
    if (!form) return;
    
    const formData = new FormData(form);
    const patientId = "12345"; // Would be dynamic in a real application
    formData.append('patient_id', patientId);
    
    // Show loading state
    const resultsContainer = document.getElementById('kidney-stone-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Analyzing CT scan for kidney stones...</p>
            </div>
        `;
    }
    
    // Send to server
    fetch('/api/multimodal/kidney-stone-detection', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log('Kidney stone detection results:', data);
        
        // Display the results
        displayKidneyStoneResults(data);
        
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
                    <p>Error analyzing CT scan. Please try again.</p>
                </div>
            `;
        }
    });
}

/**
 * Display kidney stone detection results
 */
function displayKidneyStoneResults(results) {
    const resultsContainer = document.getElementById('kidney-stone-results');
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
    const isStone = results.is_stone;
    const predictedClass = results.predicted_class;
    const confidence = results.confidence.toFixed(1);
    const stoneInfo = results.stone_info || {};
    
    // Set result class based on finding
    let resultClass = isStone ? 'stone-positive' : 'stone-negative';
    let iconClass = isStone ? 'kidney' : 'check-circle';
    
    // Create results HTML
    let html = `
        <div class="kidney-stone-result ${resultClass}">
            <div class="result-header">
                <div class="result-icon">
                    <i class="fas fa-${iconClass}"></i>
                </div>
                <div class="result-summary">
                    <h3>${isStone ? 'Kidney Stone Detected' : 'No Kidney Stone Detected'}</h3>
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
                    <span class="probability-label">${className}:</span>
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
    
    // If a stone is detected, add information about it
    if (isStone && stoneInfo) {
        html += `
            <div class="stone-information">
                <h4>About Kidney Stones</h4>
                <p>${stoneInfo.description || 'No description available.'}</p>
                
                <div class="stone-info-grid">
        `;
        
        // Add common symptoms if available
        if (stoneInfo.common_symptoms && stoneInfo.common_symptoms.length > 0) {
            html += `
                <div class="stone-info-section">
                    <h5>Common Symptoms</h5>
                    <ul>
            `;
            
            stoneInfo.common_symptoms.slice(0, 5).forEach(symptom => {
                html += `<li>${symptom}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add treatment options if available
        if (stoneInfo.treatment_options && stoneInfo.treatment_options.length > 0) {
            html += `
                <div class="stone-info-section">
                    <h5>Treatment Options</h5>
                    <ul>
            `;
            
            stoneInfo.treatment_options.slice(0, 5).forEach(treatment => {
                html += `<li>${treatment}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add prevention tips if available
        if (stoneInfo.prevention && stoneInfo.prevention.length > 0) {
            html += `
                <div class="stone-info-section">
                    <h5>Prevention Tips</h5>
                    <ul>
            `;
            
            stoneInfo.prevention.slice(0, 5).forEach(tip => {
                html += `<li>${tip}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add stone types if available
        if (stoneInfo.stone_types && stoneInfo.stone_types.length > 0) {
            html += `
                <div class="stone-info-section">
                    <h5>Types of Kidney Stones</h5>
                    <ul>
            `;
            
            stoneInfo.stone_types.forEach(type => {
                html += `<li>${type}</li>`;
            });
            
            html += `
                    </ul>
                </div>
            `;
        }
        
        // Add severity if available
        if (results.severity) {
            html += `
                <div class="stone-info-section full-width">
                    <h5>Severity Level</h5>
                    <div class="severity-indicator">
                        <span class="severity-level ${results.severity}">${capitalizeFirstLetter(results.severity)}</span>
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
                <li>Consult with a urologist or nephrologist for professional evaluation</li>
                <li>Consider additional diagnostic tests such as urinalysis or ultrasound</li>
                ${isStone ? '<li>Increase water intake to 2-3 liters per day</li>' : ''}
                ${isStone ? '<li>Discuss pain management and treatment options with a specialist</li>' : '<li>Maintain proper hydration and a balanced diet</li>'}
                ${isStone ? '<li>Follow up with a specialist to develop a prevention plan</li>' : '<li>Schedule routine check-ups with your doctor</li>'}
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
}

/**
 * Helper function to capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
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