// Create a simple line chart
function createLineChart(canvasId, label, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: label,
                data: [],
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
                    display: false
                },
                y: {
                    display: true,
                    beginAtZero: false,
                    grid: {
                        drawBorder: false,
                        display: true,
                        drawOnChartArea: true,
                        drawTicks: false,
                    },
                    ticks: {
                        display: true,
                        padding: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 500
            }
        }
    });
}

// Create a dual line chart (for blood pressure)
function createDualLineChart(canvasId, label, color1, color2) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Systolic',
                    data: [],
                    borderColor: color1,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 1,
                    pointHoverRadius: 3,
                    fill: false,
                    tension: 0.2
                },
                {
                    label: 'Diastolic',
                    data: [],
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
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: true,
                    beginAtZero: false,
                    grid: {
                        drawBorder: false,
                        display: true,
                        drawOnChartArea: true,
                        drawTicks: false,
                    },
                    ticks: {
                        display: true,
                        padding: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 500
            }
        }
    });
}

// Create ECG chart
function createECGChart(canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: 250}, (_, i) => i),
            datasets: [{
                label: 'ECG',
                data: Array(250).fill(0),
                borderColor: '#ef4444',
                backgroundColor: 'transparent',
                borderWidth: 1.5,
                pointRadius: 0,
                tension: 0
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
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false,
                    min: -0.5,
                    max: 1.5
                }
            },
            animation: {
                duration: 0
            }
        }
    });
}

// Add a data point to a line chart
function addDataPoint(chart, label, data) {
    // Add new data
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data);
    
    // Remove old data if more than 20 points
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    
    // Update the chart
    chart.update();
}

// Add a data point to a dual line chart
function addDualDataPoint(chart, label, data1, data2) {
    // Add new data
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(data1);
    chart.data.datasets[1].data.push(data2);
    
    // Remove old data if more than 20 points
    if (chart.data.labels.length > 20) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }
    
    // Update the chart
    chart.update();
}

// Update ECG chart with new data
function updateECGChart(chart, ecgData) {
    // Update the dataset with the new ECG data
    chart.data.datasets[0].data = ecgData;
    
    // Update the chart
    chart.update();
}