// Global data storage
let patientData = {};
let displayedHours = 24;  // Default to 24 hours
let charts = {}; // Store chart objects

// Initialize history page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch historical data
    fetchHistoricalData();
    
    // Set up download button
    document.getElementById('download-report').addEventListener('click', downloadReport);
});

// Fetch historical patient data
function fetchHistoricalData() {
    fetch('/api/data/history')
        .then(response => response.json())
        .then(data => {
            patientData = data;
            updateHistoryCharts();
            calculateStats();
            generateAIInsights();
            loadAlertHistory();
        })
        .catch(error => {
            console.error('Error fetching historical data:', error);
        });
}

// Update time range selection
function updateTimeRange() {
    const selector = document.getElementById('time-range');
    displayedHours = parseInt(selector.value);
    updateHistoryCharts();
    calculateStats();
    generateAIInsights();
}

// Update all charts with historical data
function updateHistoryCharts() {
    if (!patientData || !patientData.timestamps || patientData.timestamps.length === 0) {
        return;
    }
    
    // Determine data range based on selected time
    const dataPoints = patientData.timestamps.length;
    const dataPerHour = Math.ceil(dataPoints / 24);  // Assuming 24 hours of data
    const pointsToShow = Math.min(dataPoints, displayedHours * dataPerHour);
    const startIndex = dataPoints - pointsToShow;
    
    // Prepare data arrays
    const timeLabels = patientData.timestamps.slice(startIndex).map(timestamp => {
        return new Date(timestamp).toLocaleTimeString();
    });
    
    const heartRateData = patientData.heart_rate.slice(startIndex);
    const systolicData = patientData.blood_pressure_systolic.slice(startIndex);
    const diastolicData = patientData.blood_pressure_diastolic.slice(startIndex);
    const oxygenData = patientData.oxygen_saturation.slice(startIndex);
    const respRateData = patientData.respiratory_rate.slice(startIndex);
    
    // Create/update heart rate chart
    createHistoryChart('heart-rate-history-chart', 'Heart Rate', timeLabels, heartRateData, '#f87171');
    
    // Create/update blood pressure chart
    createDualHistoryChart('bp-history-chart', 'Blood Pressure', timeLabels, 
        systolicData, diastolicData, '#4f46e5', '#818cf8', 'Systolic', 'Diastolic');
    
    // Create/update oxygen saturation chart
    createHistoryChart('o2-history-chart', 'Oxygen Saturation', timeLabels, oxygenData, '#10b981');
    
    // Create/update respiratory rate chart
    createHistoryChart('resp-history-chart', 'Respiratory Rate', timeLabels, respRateData, '#f59e0b');
    
    // Create/update risk score chart (simulated data as we don't store risk history yet)
    createRiskHistoryChart();
}

// Create a history chart
function createHistoryChart(canvasId, label, labels, data, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Check if chart already exists
    if (charts[canvasId]) {
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data;
        charts[canvasId].update();
        return;
    }
    
    // Create new chart
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 3,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        maxRotation: 0
                    }
                },
                y: {
                    display: true,
                    beginAtZero: false,
                    grid: {
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Create a dual-line history chart (for blood pressure)
function createDualHistoryChart(canvasId, label, labels, data1, data2, color1, color2, label1, label2) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // Check if chart already exists
    if (charts[canvasId]) {
        charts[canvasId].data.labels = labels;
        charts[canvasId].data.datasets[0].data = data1;
        charts[canvasId].data.datasets[1].data = data2;
        charts[canvasId].update();
        return;
    }
    
    // Create new chart
    charts[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: label1,
                    data: data1,
                    borderColor: color1,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 1,
                    pointHoverRadius: 3,
                    fill: false,
                    tension: 0.2
                },
                {
                    label: label2,
                    data: data2,
                    borderColor: color2,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 1,
                    pointHoverRadius: 3,
                    fill: false,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        maxRotation: 0
                    }
                },
                y: {
                    display: true,
                    beginAtZero: false,
                    grid: {
                        drawBorder: false
                    }
                }
            }
        }
    });
}

// Create risk history chart with simulated data
function createRiskHistoryChart() {
    const ctx = document.getElementById('risk-history-chart').getContext('2d');
    
    // Generate simulated risk data based on vital signs
    const dataPoints = patientData.timestamps.length;
    const dataPerHour = Math.ceil(dataPoints / 24);
    const pointsToShow = Math.min(dataPoints, displayedHours * dataPerHour);
    const startIndex = dataPoints - pointsToShow;
    
    const timeLabels = patientData.timestamps.slice(startIndex).map(timestamp => {
        return new Date(timestamp).toLocaleTimeString();
    });
    
    // Generate risk scores based on vitals (simplified algorithm)
    const riskScores = [];
    for (let i = startIndex; i < dataPoints; i++) {
        const hr = patientData.heart_rate[i];
        const systolic = patientData.blood_pressure_systolic[i];
        const diastolic = patientData.blood_pressure_diastolic[i];
        const o2 = patientData.oxygen_saturation[i];
        const resp = patientData.respiratory_rate[i];
        
        // Calculate a synthetic risk score
        let risk = 0;
        
        // Heart rate contribution
        if (hr < 60 || hr > 100) {
            risk += Math.min(1, Math.abs(hr - 80) / 40) * 0.2;
        }
        
        // Blood pressure contribution
        if (systolic < 90 || systolic > 140 || diastolic < 60 || diastolic > 90) {
            const systolicRisk = Math.min(1, Math.abs(systolic - 120) / 50);
            const diastolicRisk = Math.min(1, Math.abs(diastolic - 80) / 30);
            risk += Math.max(systolicRisk, diastolicRisk) * 0.2;
        }
        
        // Oxygen saturation contribution
        if (o2 < 95) {
            risk += Math.min(1, (95 - o2) / 10) * 0.3;
        }
        
        // Respiratory rate contribution
        if (resp < 12 || resp > 20) {
            risk += Math.min(1, Math.abs(resp - 16) / 8) * 0.2;
        }
        
        // Add some randomness for visual interest
        risk += Math.random() * 0.1;
        risk = Math.min(0.95, Math.max(0.05, risk));
        
        riskScores.push(risk);
    }
    
    // Check if chart already exists
    if (charts['risk-history-chart']) {
        charts['risk-history-chart'].data.labels = timeLabels;
        charts['risk-history-chart'].data.datasets[0].data = riskScores;
        charts['risk-history-chart'].update();
        return;
    }
    
    // Create new chart
    charts['risk-history-chart'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Risk Score',
                data: riskScores,
                borderColor: '#ef4444',
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 2,
                pointRadius: 1,
                pointHoverRadius: 3,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Risk Score: ${Math.round(value * 100)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        maxRotation: 0
                    }
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    max: 1,
                    grid: {
                        drawBorder: false
                    },
                    ticks: {
                        callback: function(value) {
                            return `${value * 100}%`;
                        }
                    }
                }
            }
        }
    });
}

// Calculate and display statistics
function calculateStats() {
    if (!patientData || !patientData.heart_rate || patientData.heart_rate.length === 0) {
        return;
    }
    
    // Determine data range based on selected time
    const dataPoints = patientData.timestamps.length;
    const dataPerHour = Math.ceil(dataPoints / 24);
    const pointsToShow = Math.min(dataPoints, displayedHours * dataPerHour);
    const startIndex = dataPoints - pointsToShow;
    
    // Heart Rate stats
    const hrData = patientData.heart_rate.slice(startIndex);
    document.getElementById('hr-avg').textContent = calculateAverage(hrData).toFixed(1) + ' BPM';
    document.getElementById('hr-min').textContent = Math.min(...hrData).toFixed(1) + ' BPM';
    document.getElementById('hr-max').textContent = Math.max(...hrData).toFixed(1) + ' BPM';
    
    // Blood Pressure stats
    const systolicData = patientData.blood_pressure_systolic.slice(startIndex);
    const diastolicData = patientData.blood_pressure_diastolic.slice(startIndex);
    document.getElementById('bp-avg').textContent = 
        `${calculateAverage(systolicData).toFixed(0)}/${calculateAverage(diastolicData).toFixed(0)} mmHg`;
    document.getElementById('bp-min').textContent = 
        `${Math.min(...systolicData).toFixed(0)}/${Math.min(...diastolicData).toFixed(0)} mmHg`;
    document.getElementById('bp-max').textContent = 
        `${Math.max(...systolicData).toFixed(0)}/${Math.max(...diastolicData).toFixed(0)} mmHg`;
    
    // Oxygen stats
    const o2Data = patientData.oxygen_saturation.slice(startIndex);
    document.getElementById('o2-avg').textContent = calculateAverage(o2Data).toFixed(1) + '%';
    document.getElementById('o2-min').textContent = Math.min(...o2Data).toFixed(1) + '%';
    document.getElementById('o2-max').textContent = Math.max(...o2Data).toFixed(1) + '%';
    
    // Respiratory Rate stats
    const respData = patientData.respiratory_rate.slice(startIndex);
    document.getElementById('resp-avg').textContent = calculateAverage(respData).toFixed(1) + ' breaths/min';
    document.getElementById('resp-min').textContent = Math.min(...respData).toFixed(1) + ' breaths/min';
    document.getElementById('resp-max').textContent = Math.max(...respData).toFixed(1) + ' breaths/min';
}

// Calculate average for an array of numbers
function calculateAverage(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Generate AI insights based on historical data
function generateAIInsights() {
    if (!patientData || !patientData.heart_rate || patientData.heart_rate.length === 0) {
        return;
    }
    
    // Determine data range
    const dataPoints = patientData.timestamps.length;
    const dataPerHour = Math.ceil(dataPoints / 24);
    const pointsToShow = Math.min(dataPoints, displayedHours * dataPerHour);
    const startIndex = dataPoints - pointsToShow;
    
    // Generate insights
    const hrData = patientData.heart_rate.slice(startIndex);
    const systolicData = patientData.blood_pressure_systolic.slice(startIndex);
    const diastolicData = patientData.blood_pressure_diastolic.slice(startIndex);
    const o2Data = patientData.oxygen_saturation.slice(startIndex);
    const respData = patientData.respiratory_rate.slice(startIndex);
    
    // Simple trend detection
    const hrTrend = detectTrend(hrData);
    const bpTrend = detectTrend(systolicData);
    const o2Trend = detectTrend(o2Data);
    const respTrend = detectTrend(respData);
    
    // Generate insight text
    let insightText = "Based on AI analysis of the last " + displayedHours + " hours: ";
    const insights = [];
    
    // Heart rate insights
    if (hrTrend === 'increasing') {
        insights.push("Heart rate shows an increasing trend, suggesting increased stress or activity");
    } else if (hrTrend === 'decreasing') {
        insights.push("Heart rate shows a decreasing trend, suggesting improved rest");
    } else {
        insights.push("Heart rate remains stable");
    }
    
    // Blood pressure insights
    if (bpTrend === 'increasing') {
        insights.push("Blood pressure is trending upward, recommend continued monitoring");
    } else if (bpTrend === 'decreasing') {
        insights.push("Blood pressure is trending downward");
    }
    
    // Oxygen insights
    if (Math.min(...o2Data) < 95) {
        insights.push("Oxygen saturation dropped below normal levels during this period");
    }
    
    // Risk pattern insights
    if (hrTrend === 'increasing' && bpTrend === 'increasing') {
        insights.push("Correlated increases in heart rate and blood pressure may indicate increased cardiovascular stress");
    }
    
    // Combine insights
    insightText += insights.join(". ") + ".";
    
    // Add recommendations
    if (insights.length > 1) {
        insightText += " Based on these patterns, the AI system recommends continued monitoring with special attention to cardiovascular indicators.";
    } else {
        insightText += " Overall vitals appear stable. Recommend standard monitoring protocols.";
    }
    
    // Update insight text on page
    document.getElementById('ai-trend-analysis').textContent = insightText;
}

// Simple trend detection
function detectTrend(data) {
    if (data.length < 5) return 'stable';
    
    // Use first and last quarters to determine trend
    const quarterLength = Math.floor(data.length / 4);
    const firstQuarter = data.slice(0, quarterLength);
    const lastQuarter = data.slice(-quarterLength);
    
    const firstAvg = calculateAverage(firstQuarter);
    const lastAvg = calculateAverage(lastQuarter);
    
    const percentChange = (lastAvg - firstAvg) / firstAvg * 100;
    
    if (percentChange > 5) {
        return 'increasing';
    } else if (percentChange < -5) {
        return 'decreasing';
    } else {
        return 'stable';
    }
}

// Load alert history
function loadAlertHistory() {
    fetch('/api/alerts')
        .then(response => response.json())
        .then(alerts => {
            const alertContainer = document.getElementById('alert-history');
            
            if (!alerts || alerts.length === 0) {
                alertContainer.innerHTML = '<p class="empty-state">No alerts recorded in this time period</p>';
                return;
            }
            
            // Clear container
            alertContainer.innerHTML = '';
            
            // Add alerts in reverse order (newest first)
            alerts.slice().reverse().forEach(alert => {
                const alertTime = new Date(alert.timestamp).toLocaleString();
                
                const alertElement = document.createElement('div');
                alertElement.className = 'alert-history-item';
                
                alertElement.innerHTML = `
                    <div class="alert-header">
                        <div class="alert-title">Alert (${Math.round(alert.risk_score * 100)}% Risk)</div>
                        <div class="alert-time">${alertTime}</div>
                    </div>
                    <div class="alert-details">${alert.message}</div>
                    <div class="alert-factors">
                        <strong>Contributing Factors:</strong>
                        <ul>${alert.risk_factors.map(factor => `<li>${factor}</li>`).join('')}</ul>
                    </div>
                `;
                
                alertContainer.appendChild(alertElement);
            });
        })
        .catch(error => {
            console.error('Error fetching alert history:', error);
            document.getElementById('alert-history').innerHTML = 
                '<p class="empty-state">Failed to load alert history</p>';
        });
}

// Download patient report
function downloadReport() {
    // In a real application, this would generate a PDF or other report format
    // For this demo, we'll create a simple text report
    
    // Gather data for report
    const reportData = {
        patient: {
            name: 'John Doe',
            id: '12345',
            age: 45,
            room: 302
        },
        timeRange: `Last ${displayedHours} Hours`,
        stats: {
            heartRate: {
                avg: document.getElementById('hr-avg').textContent,
                min: document.getElementById('hr-min').textContent,
                max: document.getElementById('hr-max').textContent
            },
            bloodPressure: {
                avg: document.getElementById('bp-avg').textContent,
                min: document.getElementById('bp-min').textContent,
                max: document.getElementById('bp-max').textContent
            },
            oxygenSaturation: {
                avg: document.getElementById('o2-avg').textContent,
                min: document.getElementById('o2-min').textContent,
                max: document.getElementById('o2-max').textContent
            },
            respiratoryRate: {
                avg: document.getElementById('resp-avg').textContent,
                min: document.getElementById('resp-min').textContent,
                max: document.getElementById('resp-max').textContent
            }
        },
        aiInsights: document.getElementById('ai-trend-analysis').textContent,
        generatedDate: new Date().toLocaleString()
    };
    
    // Create report text
    let reportText = "AI HEALTHCARE MONITORING SYSTEM - PATIENT REPORT\n\n";
    reportText += `Patient: ${reportData.patient.name} (ID: ${reportData.patient.id})\n`;
    reportText += `Age: ${reportData.patient.age} | Room: ${reportData.patient.room}\n\n`;
    reportText += `Time Range: ${reportData.timeRange}\n`;
    reportText += `Report Generated: ${reportData.generatedDate}\n\n`;
    
    reportText += "VITAL SIGNS SUMMARY\n";
    reportText += `Heart Rate: ${reportData.stats.heartRate.avg} (Min: ${reportData.stats.heartRate.min}, Max: ${reportData.stats.heartRate.max})\n`;
    reportText += `Blood Pressure: ${reportData.stats.bloodPressure.avg} (Min: ${reportData.stats.bloodPressure.min}, Max: ${reportData.stats.bloodPressure.max})\n`;
    reportText += `Oxygen Saturation: ${reportData.stats.oxygenSaturation.avg} (Min: ${reportData.stats.oxygenSaturation.min}, Max: ${reportData.stats.oxygenSaturation.max})\n`;
    reportText += `Respiratory Rate: ${reportData.stats.respiratoryRate.avg} (Min: ${reportData.stats.respiratoryRate.min}, Max: ${reportData.stats.respiratoryRate.max})\n\n`;
    
    reportText += "AI ANALYSIS\n";
    reportText += reportData.aiInsights + "\n\n";
    
    reportText += "NOTE: This report was generated by an AI Healthcare Monitoring System. All findings should be reviewed by a qualified healthcare professional.";
    
    // Create download link
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-report-${reportData.patient.id}-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}