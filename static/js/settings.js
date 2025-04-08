document.addEventListener('DOMContentLoaded', function() {
    // Initialize all input sliders to update their displayed values
    initializeSliders();
    
    // Set up event handlers for buttons
    document.getElementById('save-settings').addEventListener('click', saveSettings);
    document.getElementById('reset-defaults').addEventListener('click', resetDefaults);
    
    // Load any saved settings from localStorage
    loadSavedSettings();
});

// Initialize sliders to update their displayed values
function initializeSliders() {
    // Anomaly detection sensitivity slider
    const anomalySensitivity = document.getElementById('anomaly-sensitivity');
    const anomalySensitivityValue = document.getElementById('anomaly-sensitivity-value');
    
    anomalySensitivity.addEventListener('input', function() {
        const value = parseFloat(this.value);
        let sensitivityText = "";
        
        if (value < 0.03) {
            sensitivityText = "High";
        } else if (value < 0.07) {
            sensitivityText = "Medium";
        } else {
            sensitivityText = "Low";
        }
        
        anomalySensitivityValue.textContent = `${sensitivityText} (${value})`;
    });
    
    // Prediction horizon slider
    const predictionHorizon = document.getElementById('prediction-horizon');
    const predictionHorizonValue = document.getElementById('prediction-horizon-value');
    
    predictionHorizon.addEventListener('input', function() {
        const value = parseInt(this.value);
        const seconds = value * 3; // 3 seconds per reading
        predictionHorizonValue.textContent = `${value} readings (${seconds} seconds)`;
    });
    
    // Update frequency slider
    const updateFrequency = document.getElementById('update-frequency');
    const updateFrequencyValue = document.getElementById('update-frequency-value');
    
    updateFrequency.addEventListener('input', function() {
        updateFrequencyValue.textContent = `${this.value} seconds`;
    });
}

// Save settings to localStorage
function saveSettings() {
    const settings = {
        // Alert thresholds
        heartRate: {
            min: document.getElementById('hr-min').value,
            max: document.getElementById('hr-max').value
        },
        bloodPressure: {
            systolicMin: document.getElementById('bp-systolic-min').value,
            systolicMax: document.getElementById('bp-systolic-max').value,
            diastolicMin: document.getElementById('bp-diastolic-min').value,
            diastolicMax: document.getElementById('bp-diastolic-max').value
        },
        oxygenSaturation: {
            min: document.getElementById('o2-min').value
        },
        respiratoryRate: {
            min: document.getElementById('resp-min').value,
            max: document.getElementById('resp-max').value
        },
        temperature: {
            min: document.getElementById('temp-min').value,
            max: document.getElementById('temp-max').value
        },
        
        // AI model settings
        anomalySensitivity: document.getElementById('anomaly-sensitivity').value,
        predictionHorizon: document.getElementById('prediction-horizon').value,
        usePatientBaseline: document.getElementById('use-patient-baseline').checked,
        enableAdvancedECG: document.getElementById('enable-advanced-ecg').checked,
        
        // Display settings
        updateFrequency: document.getElementById('update-frequency').value,
        showPredictions: document.getElementById('show-predictions').checked,
        enableSoundAlerts: document.getElementById('enable-sound-alerts').checked,
        chartPoints: document.getElementById('chart-points').value
    };
    
    // Save to localStorage
    localStorage.setItem('healthcareMonitoringSettings', JSON.stringify(settings));
    
    // Show success message
    showNotification('Settings saved successfully');
    
    // In a real application, these settings would be sent to the server
    // to update the monitoring system configuration
    console.log('Settings saved:', settings);
}

// Load settings from localStorage
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('healthcareMonitoringSettings');
    
    if (!savedSettings) {
        return; // No saved settings
    }
    
    try {
        const settings = JSON.parse(savedSettings);
        
        // Apply alert thresholds
        if (settings.heartRate) {
            document.getElementById('hr-min').value = settings.heartRate.min;
            document.getElementById('hr-max').value = settings.heartRate.max;
        }
        
        if (settings.bloodPressure) {
            document.getElementById('bp-systolic-min').value = settings.bloodPressure.systolicMin;
            document.getElementById('bp-systolic-max').value = settings.bloodPressure.systolicMax;
            document.getElementById('bp-diastolic-min').value = settings.bloodPressure.diastolicMin;
            document.getElementById('bp-diastolic-max').value = settings.bloodPressure.diastolicMax;
        }
        
        if (settings.oxygenSaturation) {
            document.getElementById('o2-min').value = settings.oxygenSaturation.min;
        }
        
        if (settings.respiratoryRate) {
            document.getElementById('resp-min').value = settings.respiratoryRate.min;
            document.getElementById('resp-max').value = settings.respiratoryRate.max;
        }
        
        if (settings.temperature) {
            document.getElementById('temp-min').value = settings.temperature.min;
            document.getElementById('temp-max').value = settings.temperature.max;
        }
        
        // Apply AI model settings
        if (settings.anomalySensitivity) {
            const anomalySensitivity = document.getElementById('anomaly-sensitivity');
            anomalySensitivity.value = settings.anomalySensitivity;
            // Trigger the input event to update the displayed value
            anomalySensitivity.dispatchEvent(new Event('input'));
        }
        
        if (settings.predictionHorizon) {
            const predictionHorizon = document.getElementById('prediction-horizon');
            predictionHorizon.value = settings.predictionHorizon;
            predictionHorizon.dispatchEvent(new Event('input'));
        }
        
        if (settings.usePatientBaseline !== undefined) {
            document.getElementById('use-patient-baseline').checked = settings.usePatientBaseline;
        }
        
        if (settings.enableAdvancedECG !== undefined) {
            document.getElementById('enable-advanced-ecg').checked = settings.enableAdvancedECG;
        }
        
        // Apply display settings
        if (settings.updateFrequency) {
            const updateFrequency = document.getElementById('update-frequency');
            updateFrequency.value = settings.updateFrequency;
            updateFrequency.dispatchEvent(new Event('input'));
        }
        
        if (settings.showPredictions !== undefined) {
            document.getElementById('show-predictions').checked = settings.showPredictions;
        }
        
        if (settings.enableSoundAlerts !== undefined) {
            document.getElementById('enable-sound-alerts').checked = settings.enableSoundAlerts;
        }
        
        if (settings.chartPoints) {
            document.getElementById('chart-points').value = settings.chartPoints;
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Reset to default settings
function resetDefaults() {
    // Confirm reset
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }
    
    // Clear localStorage
    localStorage.removeItem('healthcareMonitoringSettings');
    
    // Reset form values
    document.getElementById('hr-min').value = 60;
    document.getElementById('hr-max').value = 100;
    
    document.getElementById('bp-systolic-min').value = 90;
    document.getElementById('bp-systolic-max').value = 140;
    document.getElementById('bp-diastolic-min').value = 60;
    document.getElementById('bp-diastolic-max').value = 90;
    
    document.getElementById('o2-min').value = 95;
    
    document.getElementById('resp-min').value = 12;
    document.getElementById('resp-max').value = 20;
    
    document.getElementById('temp-min').value = 97;
    document.getElementById('temp-max').value = 99;
    
    // Reset AI model settings
    const anomalySensitivity = document.getElementById('anomaly-sensitivity');
    anomalySensitivity.value = 0.05;
    anomalySensitivity.dispatchEvent(new Event('input'));
    
    const predictionHorizon = document.getElementById('prediction-horizon');
    predictionHorizon.value = 12;
    predictionHorizon.dispatchEvent(new Event('input'));
    
    document.getElementById('use-patient-baseline').checked = true;
    document.getElementById('enable-advanced-ecg').checked = true;
    
    // Reset display settings
    const updateFrequency = document.getElementById('update-frequency');
    updateFrequency.value = 3;
    updateFrequency.dispatchEvent(new Event('input'));
    
    document.getElementById('show-predictions').checked = true;
    document.getElementById('enable-sound-alerts').checked = true;
    document.getElementById('chart-points').value = 20;
    
    // Show notification
    showNotification('Settings reset to defaults');
}

// Show a temporary notification
function showNotification(message) {
    // Check if a notification container already exists
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
        // Create notification container
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
            
            // Remove container if empty
            if (notificationContainer.children.length === 0) {
                notificationContainer.remove();
            }
        }, 500);
    }, 3000);
}