/**
 * Multimodal Dashboard JavaScript
 * Handles real-time updates, data visualization, and interactions for the
 * multimodal patient monitoring dashboard.
 */

// Global state
const state = {
  patientId: "12345", // Would be set dynamically based on viewed patient
  realtimeUpdates: false,
  updateInterval: null,
  lastUpdateTime: null,
  modalityData: {
    vitals: null,
    wearable: {},
    image: null,
    audio: null,
  },
  fusionResults: null,
  selectedWearableDevice: null,
  charts: {}, // Store chart instances
  waveform: null, // For audio visualization
  expanding: false, // Flag for panel expansion animation
};

// DOM Ready - Initialize the dashboard
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the user interface
  initializeDashboard();

  // Request initial data
  requestInitialData();

  // Set up event listeners
  setupEventListeners();
});

/**
 * Initialize the dashboard components and UI elements
 */
function initializeDashboard() {
  // Initialize empty charts
  initializeCharts();

  // Setup panel expansion behavior
  setupPanelExpansion();

  // Setup modal dialogs
  setupModals();

  console.log("Multimodal dashboard initialized");
}

/**
 * Request initial data from the server
 */
function requestInitialData() {
  // Fetch patient summary via API
  fetch(`/api/multimodal/patient-summary?patient_id=${state.patientId}`)
    .then((response) => response.json())
    .then((data) => {
      console.log("Received initial data:", data);

      // Update dashboard with the data
      updateDashboardWithMultimodalData(data);

      // Record update time
      state.lastUpdateTime = new Date();
    })
    .catch((error) => {
      console.error("Error fetching initial data:", error);
      showError("Failed to load patient data. Please try again.");
    });
}

/**
 * Setup all event listeners for the dashboard
 */
function setupEventListeners() {
  // Refresh data button
  const refreshBtn = document.getElementById("refresh-data");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function () {
      requestMultimodalUpdate();
    });
  }

  // Toggle real-time updates
  const toggleRealtimeBtn = document.getElementById("toggle-realtime");
  if (toggleRealtimeBtn) {
    toggleRealtimeBtn.addEventListener("click", function () {
      toggleRealtimeUpdates();
    });
  }

  // View detailed vitals button
  const viewVitalsBtn = document.getElementById("view-detailed-vitals");
  if (viewVitalsBtn) {
    viewVitalsBtn.addEventListener("click", function () {
      window.location.href = `/history?patient_id=${state.patientId}`;
    });
  }

  // Connect device button
  const connectDeviceBtn = document.getElementById("connect-device");
  if (connectDeviceBtn) {
    connectDeviceBtn.addEventListener("click", function () {
      showDeviceConnectionModal();
    });
  }

  // Image upload form
  const imageUploadForm = document.getElementById("image-upload-form");
  if (imageUploadForm) {
    imageUploadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      uploadAndAnalyzeImage();
    });
  }

  // Audio recording buttons
  const startRecordingBtn = document.getElementById("start-recording");
  const stopRecordingBtn = document.getElementById("stop-recording");

  if (startRecordingBtn && stopRecordingBtn) {
    startRecordingBtn.addEventListener("click", function () {
      startAudioRecording();
    });

    stopRecordingBtn.addEventListener("click", function () {
      stopAudioRecording();
    });
  }

  // Audio upload form
  const audioUploadForm = document.getElementById("audio-upload-form");
  if (audioUploadForm) {
    audioUploadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      uploadAndAnalyzeAudio();
    });
  }

  // Trend analysis button
  const analyzeTrendBtn = document.getElementById("analyze-trend");
  if (analyzeTrendBtn) {
    analyzeTrendBtn.addEventListener("click", function () {
      analyzeTrend();
    });
  }

  // Connect device form
  const connectDeviceForm = document.getElementById("connect-device-form");
  if (connectDeviceForm) {
    connectDeviceForm.addEventListener("submit", function (e) {
      e.preventDefault();
      connectWearableDevice();
    });
  }
}

/**
 * Initialize all charts with empty data
 */
function initializeCharts() {
  // Vitals trend chart
  const vitalsTrendCtx = document.getElementById("vitals-trend-chart");
  if (vitalsTrendCtx) {
    state.charts.vitalsTrend = new Chart(vitalsTrendCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Heart Rate",
            data: [],
            borderColor: "rgba(255, 99, 132, 1)",
            tension: 0.4,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    });
  }

  // Modality contributions chart
  const modalityContribCtx = document.getElementById(
    "modality-contributions-chart"
  );
  if (modalityContribCtx) {
    state.charts.modalityContributions = new Chart(modalityContribCtx, {
      type: "doughnut",
      data: {
        labels: ["Vitals", "Wearables", "Images", "Audio"],
        datasets: [
          {
            data: [25, 25, 25, 25],
            backgroundColor: [
              "rgba(255, 99, 132, 0.7)",
              "rgba(54, 162, 235, 0.7)",
              "rgba(255, 206, 86, 0.7)",
              "rgba(75, 192, 192, 0.7)",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
        },
      },
    });
  }

  // Data completeness chart
  const completenessCtx = document.getElementById("data-completeness-chart");
  if (completenessCtx) {
    state.charts.dataCompleteness = new Chart(completenessCtx, {
      type: "radar",
      data: {
        labels: ["Vitals", "Wearables", "Images", "Audio"],
        datasets: [
          {
            label: "Data Completeness",
            data: [0, 0, 0, 0],
            fill: true,
            backgroundColor: "rgba(54, 162, 235, 0.2)",
            borderColor: "rgb(54, 162, 235)",
            pointBackgroundColor: "rgb(54, 162, 235)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(54, 162, 235)",
          },
        ],
      },
      options: {
        elements: {
          line: {
            borderWidth: 3,
          },
        },
        scales: {
          r: {
            angleLines: {
              display: true,
            },
            suggestedMin: 0,
            suggestedMax: 1,
          },
        },
      },
    });
  }

  // Trend analysis chart
  const trendAnalysisCtx = document.getElementById("trend-analysis-chart");
  if (trendAnalysisCtx) {
    state.charts.trendAnalysis = new Chart(trendAnalysisCtx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Value",
            data: [],
            borderColor: "rgba(75, 192, 192, 1)",
            tension: 0.4,
            fill: false,
          },
          {
            label: "Trend Line",
            data: [],
            borderColor: "rgba(255, 99, 132, 1)",
            borderDash: [5, 5],
            tension: 0,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Time",
            },
          },
          y: {
            title: {
              display: true,
              text: "Value",
            },
          },
        },
      },
    });
  }
}

/**
 * Set up panel expansion behavior for detailed viewing
 */
function setupPanelExpansion() {
  const expandButtons = document.querySelectorAll(".panel-expand-btn");
  expandButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (state.expanding) return; // Prevent multiple clicks during animation

      const panel = this.closest(".multimodal-panel");

      if (!panel) return;

      state.expanding = true;

      if (panel.classList.contains("expanded")) {
        // Collapse
        panel.classList.remove("expanded");
        this.innerHTML = '<i class="fas fa-expand"></i>';

        // Restore original position in grid after animation
        setTimeout(() => {
          panel.style.gridArea = "";
          panel.style.zIndex = "";
          state.expanding = false;

          // Update charts if needed
          updateChartsOnResize();
        }, 300);
      } else {
        // Expand
        // Save original position for restoration
        panel.dataset.originalGridArea = panel.style.gridArea;

        // Position above all other content
        panel.style.zIndex = "100";

        // Expand to cover most of the grid
        panel.style.gridArea = "1 / 1 / span 4 / span 4";
        panel.classList.add("expanded");
        this.innerHTML = '<i class="fas fa-compress"></i>';

        setTimeout(() => {
          state.expanding = false;

          // Update charts when expanded
          updateChartsOnResize();
        }, 300);
      }
    });
  });
}

/**
 * Set up modal dialogs
 */
function setupModals() {
  // Device connection modal
  const deviceModal = document.getElementById("device-modal");
  const closeBtn = deviceModal.querySelector(".close-modal");
  const cancelBtn = deviceModal.querySelector(".cancel-modal");

  closeBtn.addEventListener("click", function () {
    deviceModal.style.display = "none";
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      deviceModal.style.display = "none";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", function (event) {
    if (event.target === deviceModal) {
      deviceModal.style.display = "none";
    }
  });
}

/**
 * Show the device connection modal
 */
function showDeviceConnectionModal() {
  const modal = document.getElementById("device-modal");
  modal.style.display = "block";
}

/**
 * Toggle real-time updates on/off
 */
function toggleRealtimeUpdates() {
  const toggleBtn = document.getElementById("toggle-realtime");

  if (state.realtimeUpdates) {
    // Turn off real-time updates
    state.realtimeUpdates = false;
    if (state.updateInterval) {
      clearInterval(state.updateInterval);
      state.updateInterval = null;
    }

    toggleBtn.innerHTML =
      '<i class="fas fa-satellite-dish"></i> Start Real-time Updates';
    toggleBtn.classList.remove("btn-active");
    toggleBtn.classList.add("btn-secondary");
  } else {
    // Turn on real-time updates
    state.realtimeUpdates = true;

    // Request updates every 5 seconds
    state.updateInterval = setInterval(function () {
      requestMultimodalUpdate();
    }, 5000);

    toggleBtn.innerHTML =
      '<i class="fas fa-pause"></i> Pause Real-time Updates';
    toggleBtn.classList.remove("btn-secondary");
    toggleBtn.classList.add("btn-active");

    // Get an initial update
    requestMultimodalUpdate();
  }
}

/**
 * Update dashboard with multimodal data received from server
 */
function updateDashboardWithMultimodalData(data) {
  // Update state with new data
  if (data.fusion_results) {
    state.fusionResults = data.fusion_results;
  }

  if (data.vitals) {
    state.modalityData.vitals = data.vitals;
    updateVitalsDisplay(data.vitals);
  }

  if (data.wearable_data) {
    Object.assign(state.modalityData.wearable, data.wearable_data);
    updateWearableDisplay(data.wearable_data);
  }

  // Update fusion results and insights
  if (data.fusion_results) {
    updateFusionInsights(data.fusion_results);
  }

  // Update data quality panel
  if (data.data_quality) {
    updateDataQualityPanel(data.data_quality);
  }

  // Record the update time
  state.lastUpdateTime = new Date();

  // Show update indicator
  showUpdateIndicator();
}

/**
 * Update vital signs display with new data
 */
function updateVitalsDisplay(vitalsData) {
  // Update the vital signs values
  const heartRateElement = document.getElementById("vital-heart-rate");
  const bpElement = document.getElementById("vital-blood-pressure");
  const respElement = document.getElementById("vital-respiration");
  const oxygenElement = document.getElementById("vital-oxygen");
  const tempElement = document.getElementById("vital-temperature");

  if (heartRateElement && vitalsData.heart_rate !== undefined) {
    heartRateElement.textContent = `${vitalsData.heart_rate} BPM`;
  }

  if (bpElement && vitalsData.blood_pressure !== undefined) {
    const [systolic, diastolic] = vitalsData.blood_pressure;
    bpElement.textContent = `${systolic}/${diastolic} mmHg`;
  }

  if (respElement && vitalsData.respiratory_rate !== undefined) {
    respElement.textContent = `${vitalsData.respiratory_rate} breaths/min`;
  }

  if (oxygenElement && vitalsData.oxygen_saturation !== undefined) {
    oxygenElement.textContent = `${vitalsData.oxygen_saturation}%`;
  }

  if (tempElement && vitalsData.temperature !== undefined) {
    tempElement.textContent = `${vitalsData.temperature}°F`;
  }

  // Update vitals trend chart if we have history data
  if (state.charts.vitalsTrend && vitalsData.history) {
    updateVitalsTrendChart(vitalsData.history);
  }
}

/**
 * Update wearable devices display with new data
 */
function updateWearableDisplay(wearableData) {
  // Update connected devices list
  const devicesList = document.getElementById("connected-devices-list");

  if (devicesList) {
    // Check if we have any connected devices
    if (Object.keys(wearableData).length === 0) {
      devicesList.innerHTML =
        '<div class="device-placeholder">No devices connected</div>';
      return;
    }

    // Clear the list
    devicesList.innerHTML = "";

    // Add each connected device
    for (const deviceId in wearableData) {
      const deviceInfo = wearableData[deviceId];
      const deviceType = deviceInfo.device_type || "unknown";

      const deviceElement = document.createElement("div");
      deviceElement.className = "device-item";
      deviceElement.dataset.deviceId = deviceId;

      // Set selected class if this is the currently selected device
      if (state.selectedWearableDevice === deviceId) {
        deviceElement.classList.add("selected");
      }

      // Get icon based on device type
      let deviceIcon = "watch";
      if (deviceType === "glucose_monitor") deviceIcon = "tint";
      else if (deviceType === "activity_tracker") deviceIcon = "running";
      else if (deviceType === "sleep_monitor") deviceIcon = "bed";
      else if (deviceType === "bp_monitor") deviceIcon = "heartbeat";
      else if (deviceType === "pulse_oximeter") deviceIcon = "lungs";

      deviceElement.innerHTML = `
                <div class="device-icon"><i class="fas fa-${deviceIcon}"></i></div>
                <div class="device-details">
                    <div class="device-name">${formatDeviceType(
                      deviceType
                    )}</div>
                    <div class="device-id">${deviceId}</div>
                </div>
                <div class="device-status">
                    <span class="status-indicator connected"></span>
                    <span class="status-text">Connected</span>
                </div>
                <div class="device-actions">
                    <button class="btn-disconnect" data-device-id="${deviceId}">
                        <i class="fas fa-unlink"></i>
                    </button>
                </div>
            `;

      devicesList.appendChild(deviceElement);

      // Add click handler to show device data
      deviceElement.addEventListener("click", function () {
        const deviceId = this.dataset.deviceId;
        selectWearableDevice(deviceId);
      });
    }

    // Add disconnect button handlers
    const disconnectButtons = devicesList.querySelectorAll(".btn-disconnect");
    disconnectButtons.forEach((button) => {
      button.addEventListener("click", function (e) {
        e.stopPropagation(); // Prevent device selection
        const deviceId = this.dataset.deviceId;
        disconnectWearableDevice(deviceId);
      });
    });

    // If we have devices but none selected, select the first one
    if (Object.keys(wearableData).length > 0 && !state.selectedWearableDevice) {
      selectWearableDevice(Object.keys(wearableData)[0]);
    }
  }

  // If a device is selected, update its data display
  if (
    state.selectedWearableDevice &&
    wearableData[state.selectedWearableDevice]
  ) {
    displayWearableData(
      state.selectedWearableDevice,
      wearableData[state.selectedWearableDevice]
    );
  }
}

/**
 * Select a wearable device to display its data
 */
function selectWearableDevice(deviceId) {
  // Update selected device in state
  state.selectedWearableDevice = deviceId;

  // Update UI to show selection
  const deviceItems = document.querySelectorAll(".device-item");
  deviceItems.forEach((item) => {
    if (item.dataset.deviceId === deviceId) {
      item.classList.add("selected");
    } else {
      item.classList.remove("selected");
    }
  });

  // Display the selected device's data
  if (state.modalityData.wearable[deviceId]) {
    displayWearableData(deviceId, state.modalityData.wearable[deviceId]);
  }
}

/**
 * Display wearable device data in the dashboard
 */
function displayWearableData(deviceId, deviceData) {
  const dataContainer = document.getElementById("wearable-data-container");
  if (!dataContainer) return;

  // Get device type for specific display formatting
  const deviceType = deviceData.device_type || "unknown";

  // Clear any "no data" message
  dataContainer.innerHTML = "";

  // Create data display based on device type
  if (deviceType === "smartwatch") {
    displaySmartwatchData(dataContainer, deviceData);
  } else if (deviceType === "glucose_monitor") {
    displayGlucoseMonitorData(dataContainer, deviceData);
  } else if (deviceType === "activity_tracker") {
    displayActivityTrackerData(dataContainer, deviceData);
  } else if (deviceType === "sleep_monitor") {
    displaySleepMonitorData(dataContainer, deviceData);
  } else if (deviceType === "bp_monitor") {
    displayBPMonitorData(dataContainer, deviceData);
  } else if (deviceType === "pulse_oximeter") {
    displayPulseOximeterData(dataContainer, deviceData);
  } else {
    // Generic display for unknown device types
    displayGenericWearableData(dataContainer, deviceData);
  }
}

/**
 * Display smartwatch data in the dashboard
 */
function displaySmartwatchData(container, data) {
  // Extract relevant data
  const heartRate = data.heart_rate?.value || "--";
  const spo2 = data.spo2?.value || "--";
  const steps = data.steps?.value || "--";
  const calories = data.calories?.value || "--";

  // Create HTML for data display
  const html = `
        <div class="wearable-data-cards">
            <div class="wearable-data-card">
                <div class="card-icon"><i class="fas fa-heart"></i></div>
                <div class="card-value">${heartRate}</div>
                <div class="card-label">Heart Rate (BPM)</div>
            </div>
            <div class="wearable-data-card">
                <div class="card-icon"><i class="fas fa-lungs"></i></div>
                <div class="card-value">${spo2}</div>
                <div class="card-label">Blood Oxygen (%)</div>
            </div>
            <div class="wearable-data-card">
                <div class="card-icon"><i class="fas fa-walking"></i></div>
                <div class="card-value">${steps}</div>
                <div class="card-label">Steps</div>
            </div>
            <div class="wearable-data-card">
                <div class="card-icon"><i class="fas fa-fire"></i></div>
                <div class="card-value">${calories}</div>
                <div class="card-label">Calories</div>
            </div>
        </div>
        <div class="wearable-last-update">
            Last updated: ${formatTimestamp(data.heart_rate?.timestamp)}
        </div>
    `;

  container.innerHTML = html;
}

/**
 * Display glucose monitor data in the dashboard
 */
function displayGlucoseMonitorData(container, data) {
  // Extract relevant data
  const glucose = data.glucose?.value || "--";
  const trend = data.trend?.value || "Unknown";

  // Create HTML for data display
  const html = `
        <div class="wearable-data-cards">
            <div class="wearable-data-card large">
                <div class="card-icon"><i class="fas fa-tint"></i></div>
                <div class="card-value">${glucose}</div>
                <div class="card-label">Glucose (mg/dL)</div>
            </div>
            <div class="wearable-data-card large">
                <div class="card-icon"><i class="fas fa-chart-line"></i></div>
                <div class="card-value">${capitalizeFirstLetter(trend)}</div>
                <div class="card-label">Trend</div>
            </div>
        </div>
        <div class="wearable-last-update">
            Last updated: ${formatTimestamp(data.glucose?.timestamp)}
        </div>
    `;

  container.innerHTML = html;
}

/**
 * Display generic wearable data when no specific formatter exists
 */
function displayGenericWearableData(container, data) {
  // Create a table with all data points
  let html =
    '<div class="wearable-data-table"><table><thead><tr><th>Metric</th><th>Value</th><th>Time</th></tr></thead><tbody>';

  // Add each data point to the table
  for (const key in data) {
    if (typeof data[key] === "object" && data[key] !== null) {
      const value = data[key].value || "--";
      const unit = data[key].unit || "";
      const timestamp = formatTimestamp(data[key].timestamp);

      html += `
                <tr>
                    <td>${formatMetricName(key)}</td>
                    <td>${value} ${unit}</td>
                    <td>${timestamp}</td>
                </tr>
            `;
    }
  }

  html += "</tbody></table></div>";
  container.innerHTML = html;
}

/**
 * Update the fusion insights panel with new data
 */
function updateFusionInsights(fusionResults) {
  // Update risk score display
  updateRiskGauge(fusionResults);

  // Update status summary
  const summaryElement = document.getElementById("risk-summary-text");
  if (summaryElement && fusionResults.integrated_assessment) {
    summaryElement.textContent = fusionResults.integrated_assessment.summary;
  }

  // Update key findings list
  const findingsList = document.getElementById("key-findings-list");
  if (
    findingsList &&
    fusionResults.integrated_assessment &&
    fusionResults.integrated_assessment.key_findings
  ) {
    const findings = fusionResults.integrated_assessment.key_findings;

    if (findings.length === 0) {
      findingsList.innerHTML =
        '<li class="finding normal">No significant findings detected</li>';
    } else {
      findingsList.innerHTML = "";

      findings.forEach((finding) => {
        const li = document.createElement("li");
        li.className = `finding ${finding.severity || "normal"}`;

        // Icon based on source
        let iconClass = "heartbeat";
        if (finding.source === "image") iconClass = "x-ray";
        else if (finding.source === "audio") iconClass = "microphone";
        else if (finding.source === "wearable") iconClass = "watch";

        li.innerHTML = `
                    <span class="finding-icon"><i class="fas fa-${iconClass}"></i></span>
                    <span class="finding-text">${finding.finding}</span>
                `;

        findingsList.appendChild(li);
      });
    }
  }

  // Update recommendations list
  const recommendationsList = document.getElementById("recommendations-list");
  if (
    recommendationsList &&
    fusionResults.integrated_assessment &&
    fusionResults.integrated_assessment.recommendations
  ) {
    const recommendations = fusionResults.integrated_assessment.recommendations;

    if (recommendations.length === 0) {
      recommendationsList.innerHTML =
        '<li class="no-data-message">No recommendations available</li>';
    } else {
      recommendationsList.innerHTML = "";

      recommendations.forEach((rec) => {
        const li = document.createElement("li");
        li.className = `recommendation ${rec.priority || "medium"}`;

        li.innerHTML = `
                    <span class="recommendation-text">${rec.action}</span>
                    <span class="recommendation-reason">${rec.rationale}</span>
                `;

        recommendationsList.appendChild(li);
      });
    }
  }

  // Update modality contributions chart
  updateModalityContributionsChart(fusionResults);

  // Update cross-validation panel
  updateCrossValidationPanel(fusionResults);

  // Update global risk score display
  const riskScoreDisplay = document.getElementById("risk-score-display");
  if (riskScoreDisplay && fusionResults.integrated_assessment) {
    const score = fusionResults.integrated_assessment.combined_risk_score;
    const percentage = Math.round(score * 100);
    let riskLevel = "Low";

    if (score > 0.7) riskLevel = "High";
    else if (score > 0.4) riskLevel = "Medium";

    riskScoreDisplay.textContent = `Multimodal Risk Score: ${percentage}% (${riskLevel})`;

    // Add class for color coding
    riskScoreDisplay.className = "";
    if (score > 0.7) riskScoreDisplay.classList.add("high-risk");
    else if (score > 0.4) riskScoreDisplay.classList.add("medium-risk");
    else riskScoreDisplay.classList.add("low-risk");
  }
}

/**
 * Update the risk gauge visualization
 */
function updateRiskGauge(fusionResults) {
  if (!fusionResults.integrated_assessment) return;

  const risk = fusionResults.integrated_assessment.combined_risk_score || 0;
  const gaugeArrow = document.getElementById("multimodal-gauge-arrow");
  const riskValue = document.getElementById("multimodal-risk-value");

  if (gaugeArrow) {
    // Convert risk (0-1) to rotation (0-180 degrees)
    const rotation = risk * 180;
    gaugeArrow.style.transform = `rotate(${rotation}deg)`;
  }

  if (riskValue) {
    // Display risk as percentage
    const percentage = Math.round(risk * 100);
    riskValue.textContent = `${percentage}%`;

    // Color based on risk level
    riskValue.className = "risk-value";
    if (risk > 0.7) riskValue.classList.add("high-risk");
    else if (risk > 0.4) riskValue.classList.add("medium-risk");
    else riskValue.classList.add("low-risk");
  }
}

/**
 * Update the modality contributions chart
 */
function updateModalityContributionsChart(fusionResults) {
  if (
    !state.charts.modalityContributions ||
    !fusionResults.early_fusion ||
    !fusionResults.early_fusion.score_components
  ) {
    return;
  }

  const components = fusionResults.early_fusion.score_components;

  // Calculate contribution percentages
  let vitalContribution = 0;
  let wearableContribution = 0;
  let imageContribution = 0;
  let audioContribution = 0;

  // Sum up the contributions from different components
  for (const key in components) {
    if (
      key.startsWith("vitals_") ||
      key === "heart_rate" ||
      key === "respiratory_rate" ||
      key === "oxygen_saturation" ||
      key === "temperature"
    ) {
      vitalContribution += components[key];
    } else if (key.startsWith("wearable_")) {
      wearableContribution += components[key];
    } else if (key.startsWith("image_")) {
      imageContribution += components[key];
    } else if (key.startsWith("audio_")) {
      audioContribution += components[key];
    }
  }

  // Ensure we have at least some contribution from each modality for visualization
  vitalContribution = Math.max(0.1, vitalContribution);
  wearableContribution = Math.max(0.05, wearableContribution);
  imageContribution = Math.max(0.05, imageContribution);
  audioContribution = Math.max(0.05, audioContribution);

  // Total for normalization
  const total =
    vitalContribution +
    wearableContribution +
    imageContribution +
    audioContribution;

  // Normalize to percentages
  vitalContribution = (vitalContribution / total) * 100;
  wearableContribution = (wearableContribution / total) * 100;
  imageContribution = (imageContribution / total) * 100;
  audioContribution = (audioContribution / total) * 100;

  // Update chart data
  state.charts.modalityContributions.data.datasets[0].data = [
    vitalContribution,
    wearableContribution,
    imageContribution,
    audioContribution,
  ];

  // Update chart
  state.charts.modalityContributions.update();
}

/**
 * Update the cross-validation panel with validation results
 */
function updateCrossValidationPanel(fusionResults) {
  if (!fusionResults.cross_modality_validation) return;

  const validation = fusionResults.cross_modality_validation;
  const validationIndicator = document.getElementById("validation-indicator");
  const validationStatusText = document.getElementById(
    "validation-status-text"
  );
  const validationScore = document.getElementById("validation-score");
  const confirmationsList = document.getElementById("confirmations-list");
  const conflictsList = document.getElementById("conflicts-list");

  // Update validation indicator
  if (validationIndicator) {
    validationIndicator.className = "validation-indicator";

    if (validation.validated) {
      validationIndicator.classList.add("validated");
      validationIndicator.querySelector(".validation-icon").innerHTML =
        '<i class="fas fa-check-circle"></i>';
    } else {
      validationIndicator.classList.add("conflicts");
      validationIndicator.querySelector(".validation-icon").innerHTML =
        '<i class="fas fa-exclamation-triangle"></i>';
    }
  }

  // Update validation status text
  if (validationStatusText) {
    if (validation.validated) {
      validationStatusText.textContent = "Data is consistent across modalities";
    } else {
      validationStatusText.textContent =
        "Conflicts detected between data sources";
    }
  }

  // Update validation score
  if (validationScore) {
    const score = (validation.validation_score * 100).toFixed(0);
    validationScore.textContent = `${score}%`;
  }

  // Update confirmations list
  if (confirmationsList && validation.confirmations) {
    if (validation.confirmations.length === 0) {
      confirmationsList.innerHTML =
        '<li class="no-data-message">No confirmations available</li>';
    } else {
      confirmationsList.innerHTML = "";

      validation.confirmations.forEach((confirmation) => {
        const li = document.createElement("li");
        li.className = "confirmation";

        li.innerHTML = `
                    <span class="confirmation-icon"><i class="fas fa-check-circle"></i></span>
                    <div class="confirmation-details">
                        <div class="confirmation-text">${
                          confirmation.measurement
                        }</div>
                        <div class="confirmation-sources">Sources: ${confirmation.sources.join(
                          ", "
                        )}</div>
                        <div class="confirmation-values">Values: ${confirmation.values.join(
                          ", "
                        )}</div>
                    </div>
                `;

        confirmationsList.appendChild(li);
      });
    }
  }

  // Update conflicts list
  if (conflictsList && validation.conflicts) {
    if (validation.conflicts.length === 0) {
      conflictsList.innerHTML =
        '<li class="no-data-message">No conflicts detected</li>';
    } else {
      conflictsList.innerHTML = "";

      validation.conflicts.forEach((conflict) => {
        const li = document.createElement("li");
        li.className = "conflict";

        li.innerHTML = `
                    <span class="conflict-icon"><i class="fas fa-exclamation-triangle"></i></span>
                    <div class="conflict-details">
                        <div class="conflict-text">${conflict.measurement}</div>
                        <div class="conflict-sources">Sources: ${conflict.sources.join(
                          ", "
                        )}</div>
                        <div class="conflict-values">Values: ${conflict.values.join(
                          ", "
                        )}</div>
                        ${
                          conflict.notes
                            ? `<div class="conflict-notes">${conflict.notes}</div>`
                            : ""
                        }
                    </div>
                `;

        conflictsList.appendChild(li);
      });
    }
  }
}

/**
 * Update the data quality panel with quality metrics
 */
function updateDataQualityPanel(qualityReport) {
  const qualityScore = document.getElementById("data-quality-score");
  const qualityLabel = document.getElementById("data-quality-label");
  const availabilityContainer = document.getElementById(
    "modality-availability-container"
  );

  if (qualityScore) {
    const score = (qualityReport.quality_score * 100).toFixed(0);
    qualityScore.textContent = `${score}%`;

    // Color based on quality level
    qualityScore.className = "quality-score";
    qualityScore.classList.add(qualityReport.quality_level);
  }

  if (qualityLabel) {
    qualityLabel.textContent =
      capitalizeFirstLetter(qualityReport.quality_level) + " Quality";
    qualityLabel.className = "quality-label";
    qualityLabel.classList.add(qualityReport.quality_level);
  }

  // Update completeness chart
  if (state.charts.dataCompleteness && qualityReport.modality_stats) {
    const stats = qualityReport.modality_stats;

    // Calculate completeness for each modality (0-1)
    const vitalsCompleteness = stats.vitals?.available ? 1 : 0;
    const wearableCompleteness = stats.wearable?.available ? 1 : 0;
    const imageCompleteness = stats.image?.available ? 1 : 0;
    const audioCompleteness = stats.audio?.available ? 1 : 0;

    // Update chart data
    state.charts.dataCompleteness.data.datasets[0].data = [
      vitalsCompleteness,
      wearableCompleteness,
      imageCompleteness,
      audioCompleteness,
    ];

    state.charts.dataCompleteness.update();
  }

  // Update availability details
  if (availabilityContainer && qualityReport.modality_stats) {
    const stats = qualityReport.modality_stats;
    availabilityContainer.innerHTML = "";

    // Create a card for each modality
    for (const modality in stats) {
      const modalityInfo = stats[modality];
      const card = document.createElement("div");
      card.className = "modality-card";

      // Set icon based on modality
      let iconClass = "question-circle";
      if (modality === "vitals") iconClass = "heartbeat";
      else if (modality === "wearable") iconClass = "watch";
      else if (modality === "image") iconClass = "x-ray";
      else if (modality === "audio") iconClass = "microphone";

      // Set availability status
      const isAvailable = modalityInfo.available === true;

      card.innerHTML = `
                <div class="modality-icon"><i class="fas fa-${iconClass}"></i></div>
                <div class="modality-details">
                    <div class="modality-name">${capitalizeFirstLetter(
                      modality
                    )}</div>
                    <div class="modality-status ${
                      isAvailable ? "available" : "unavailable"
                    }">
                        ${isAvailable ? "Available" : "Unavailable"}
                    </div>
                    ${
                      isAvailable
                        ? `
                        <div class="modality-points">
                            ${modalityInfo.data_points} data points
                        </div>
                        <div class="modality-time">
                            Last update: ${formatTimestamp(modalityInfo.newest)}
                        </div>
                    `
                        : ""
                    }
                </div>
            `;

      availabilityContainer.appendChild(card);
    }
  }
}

/**
 * Upload and analyze a medical image
 */
function uploadAndAnalyzeImage() {
  const form = document.getElementById("image-upload-form");
  if (!form) return;

  const formData = new FormData(form);

  // Add patient ID
  formData.append("patient_id", state.patientId);

  // Show loading state
  const analysisResults = document.getElementById("image-analysis-results");
  if (analysisResults) {
    analysisResults.innerHTML =
      '<div class="loading-spinner"></div><p>Analyzing image...</p>';
  }

  // Send to server
  fetch("/api/multimodal/image-analysis", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Image analysis results:", data);

      // Update the image display
      displayAnalyzedImage(data);

      // Request a fresh multimodal update to reflect the new image data
      requestMultimodalUpdate();
    })
    .catch((error) => {
      console.error("Error analyzing image:", error);

      if (analysisResults) {
        analysisResults.innerHTML =
          '<p class="error-message">Error analyzing image. Please try again.</p>';
      }
    });
}

/**
 * Display the analyzed image with results
 */
function displayAnalyzedImage(data) {
  if (!data || !data.analysis) return;

  // Update the image container
  const imageContainer = document.getElementById("medical-image-container");
  if (imageContainer && data.processed_image) {
    // Create image element
    const img = document.createElement("img");
    img.className = "medical-image";
    img.alt = `Medical image - ${data.processed_image.modality}`;

    // Set image source - would normally be a path to the processed image
    if (data.processed_image.processed_image_path) {
      img.src = `/static/processed/${data.processed_image.processed_image_path}`;
    } else {
      // Fallback - in a real implementation, you'd handle this better
      img.src = "/static/images/sample_xray.png";
    }

    // Clear container and add image
    imageContainer.innerHTML = "";
    imageContainer.appendChild(img);
  }

  // Update analysis results
  const analysisResults = document.getElementById("image-analysis-results");
  if (analysisResults && data.analysis) {
    const analysis = data.analysis;

    // Create results HTML
    let html = "";

    // Add abnormality score
    if ("abnormality_score" in analysis) {
      const score = (analysis.abnormality_score * 100).toFixed(0);
      const scoreClass =
        analysis.abnormality_score > 0.5
          ? "high"
          : analysis.abnormality_score > 0.3
          ? "medium"
          : "low";

      html += `
                <div class="analysis-score ${scoreClass}">
                    <span class="score-label">Abnormality:</span>
                    <span class="score-value">${score}%</span>
                </div>
            `;
    }

    // Add findings
    if (analysis.findings && analysis.findings.length > 0) {
      html += '<div class="analysis-findings"><h5>Findings:</h5><ul>';

      analysis.findings.forEach((finding) => {
        const confidence = (finding.confidence * 100).toFixed(0);
        const severityClass = finding.severity || "medium";

        html += `
                    <li class="finding ${severityClass}">
                        ${finding.label}
                        <span class="confidence">${confidence}% confidence</span>
                    </li>
                `;
      });

      html += "</ul></div>";
    } else {
      html +=
        '<div class="analysis-findings">No significant findings detected</div>';
    }

    // Add contextual analysis if available
    if (
      analysis.contextual_analysis &&
      analysis.contextual_analysis.correlated_findings &&
      analysis.contextual_analysis.correlated_findings.length > 0
    ) {
      html += '<div class="contextual-analysis"><h5>Clinical Context:</h5><ul>';

      analysis.contextual_analysis.correlated_findings.forEach((finding) => {
        html += `
                    <li class="correlation ${finding.severity}">
                        ${finding.explanation}
                    </li>
                `;
      });

      html += "</ul></div>";
    }

    // Add timestamp
    html += `<div class="analysis-timestamp">Analyzed: ${formatTimestamp(
      analysis.timestamp
    )}</div>`;

    analysisResults.innerHTML = html;
  }
}

/**
 * Start recording audio
 */
function startAudioRecording() {
  const startBtn = document.getElementById("start-recording");
  const stopBtn = document.getElementById("stop-recording");
  const audioType = document.getElementById("audio-type").value;

  // Update button states
  if (startBtn) startBtn.disabled = true;
  if (stopBtn) stopBtn.disabled = false;

  // Show recording indicator
  const waveformContainer = document.getElementById("waveform-container");
  if (waveformContainer) {
    waveformContainer.innerHTML =
      '<div class="recording-indicator"></div><div class="recording-text">Recording...</div>';
  }

  // Initialize audio recorder
  initializeAudioRecorder(audioType);
}

/**
 * Initialize the audio recorder
 */
function initializeAudioRecorder(audioType) {
  // In a real implementation, this would use the Web Audio API
  // For this implementation, we'll simulate recording

  // Store start time for simulating recording duration
  state.recordingStartTime = new Date();

  // Create animation frame for simulating recording visualization
  state.recordingAnimation = requestAnimationFrame(
    updateRecordingVisualization
  );
}

/**
 * Update the recording visualization
 */
function updateRecordingVisualization() {
  const waveformContainer = document.getElementById("waveform-container");
  if (!waveformContainer) return;

  // Calculate elapsed time
  const elapsed = new Date() - state.recordingStartTime;
  const seconds = Math.floor(elapsed / 1000);

  // Update recording indicator with time
  waveformContainer.querySelector(
    ".recording-text"
  ).textContent = `Recording... ${seconds}s`;

  // Continue animation
  state.recordingAnimation = requestAnimationFrame(
    updateRecordingVisualization
  );
}

/**
 * Stop recording audio
 */
function stopAudioRecording() {
  const startBtn = document.getElementById("start-recording");
  const stopBtn = document.getElementById("stop-recording");

  // Update button states
  if (startBtn) startBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;

  // Stop animation
  if (state.recordingAnimation) {
    cancelAnimationFrame(state.recordingAnimation);
    state.recordingAnimation = null;
  }

  // Show processing state
  const waveformContainer = document.getElementById("waveform-container");
  if (waveformContainer) {
    waveformContainer.innerHTML =
      '<div class="loading-spinner"></div><div class="recording-text">Processing audio...</div>';
  }

  // Get audio type
  const audioType = document.getElementById("audio-type").value;

  // In a real implementation, this would process and send the recorded audio
  // For this implementation, we'll simulate with a delay
  setTimeout(() => {
    simulateAudioAnalysis(audioType);
  }, 1500);
}

/**
 * Simulate audio analysis with appropriate results
 */
function simulateAudioAnalysis(audioType) {
  // Create simulated analysis results based on audio type
  let analysisResults = {
    audio_type: audioType,
    top_prediction: {},
    abnormality_score: 0.1,
    audio_measurements: {},
  };

  // Customize based on audio type
  if (audioType === "breathing") {
    analysisResults.top_prediction = {
      class: Math.random() > 0.7 ? "wheezing" : "normal",
      probability: 0.85,
      is_abnormal: Math.random() > 0.7,
    };
    analysisResults.abnormality_score = Math.random() > 0.7 ? 0.68 : 0.12;
    analysisResults.audio_measurements = {
      breathing_rate: 14 + Math.random() * 6,
      breath_regularity: 0.85,
    };
  } else if (audioType === "cough") {
    analysisResults.top_prediction = {
      class: Math.random() > 0.6 ? "dry" : "normal",
      probability: 0.78,
      is_abnormal: Math.random() > 0.6,
    };
    analysisResults.abnormality_score = Math.random() > 0.6 ? 0.58 : 0.15;
    analysisResults.audio_measurements = {
      cough_count: Math.floor(Math.random() * 5) + 1,
      cough_intensity: 0.65,
    };
  } else if (audioType === "heart") {
    analysisResults.top_prediction = {
      class: Math.random() > 0.8 ? "murmur" : "normal",
      probability: 0.82,
      is_abnormal: Math.random() > 0.8,
    };
    analysisResults.abnormality_score = Math.random() > 0.8 ? 0.72 : 0.08;
    analysisResults.audio_measurements = {
      heart_rate_estimate: 72 + Math.random() * 20,
      regularity: 0.9,
    };
  } else if (audioType === "voice") {
    analysisResults.top_prediction = {
      class: Math.random() > 0.85 ? "weak" : "normal",
      probability: 0.88,
      is_abnormal: Math.random() > 0.85,
    };
    analysisResults.abnormality_score = Math.random() > 0.85 ? 0.62 : 0.05;
    analysisResults.audio_measurements = {
      mean_pitch: 120 + Math.random() * 40,
      voicing_ratio: 0.75,
    };
  }

  // Display the results
  displayAudioAnalysis(analysisResults);

  // Request a fresh multimodal update to reflect the new audio data
  requestMultimodalUpdate();
}

/**
 * Upload and analyze audio file
 */
function uploadAndAnalyzeAudio() {
  const form = document.getElementById("audio-upload-form");
  if (!form) return;

  // Get audio type
  const audioType = document.getElementById("audio-type").value;

  const formData = new FormData(form);
  formData.append("patient_id", state.patientId);
  formData.append("audio_type", audioType);

  // Show loading state
  const waveformContainer = document.getElementById("waveform-container");
  if (waveformContainer) {
    waveformContainer.innerHTML =
      '<div class="loading-spinner"></div><div class="recording-text">Processing audio...</div>';
  }

  // In a real implementation, you would send the audio to the server
  // For this implementation, we'll simulate with a delay
  setTimeout(() => {
    simulateAudioAnalysis(audioType);
  }, 1500);
}

/**
 * Display audio analysis results
 */
function displayAudioAnalysis(results) {
  // Update waveform display
  const waveformContainer = document.getElementById("waveform-container");
  if (waveformContainer) {
    // In a real implementation, this would display the actual audio waveform
    // For this implementation, we'll use a simulated waveform
    waveformContainer.innerHTML = `
            <div class="waveform-display">
                <div class="waveform-line"></div>
                <div class="waveform-line"></div>
                <div class="waveform-line"></div>
                <div class="waveform-line"></div>
                <div class="waveform-line"></div>
            </div>
            <div class="waveform-label">${formatAudioType(
              results.audio_type
            )} Recording</div>
        `;
  }

  // Update audio player
  const audioPlayer = document.getElementById("audio-player");
  if (audioPlayer) {
    // In a real implementation, this would set the audio source
    // For this implementation, we'll simulate availability
    audioPlayer.style.display = "block";
    audioPlayer.controls = true;
  }

  // Update analysis results
  const analysisResults = document.getElementById("audio-analysis-results");
  if (analysisResults) {
    // Create results HTML
    let html = "";

    // Add classification result
    if (results.top_prediction) {
      const prediction = results.top_prediction;
      const isAbnormal = prediction.is_abnormal;
      const className = prediction.class;
      const probability = (prediction.probability * 100).toFixed(0);

      html += `
                <div class="analysis-classification ${
                  isAbnormal ? "abnormal" : "normal"
                }">
                    <div class="classification-result">
                        <span class="result-label">Classification:</span>
                        <span class="result-value">${capitalizeFirstLetter(
                          className
                        )}</span>
                    </div>
                    <div class="classification-confidence">
                        <span class="confidence-label">Confidence:</span>
                        <span class="confidence-value">${probability}%</span>
                    </div>
                </div>
            `;
    }

    // Add abnormality score
    if ("abnormality_score" in results) {
      const score = (results.abnormality_score * 100).toFixed(0);
      const scoreClass =
        results.abnormality_score > 0.5
          ? "high"
          : results.abnormality_score > 0.3
          ? "medium"
          : "low";

      html += `
                <div class="analysis-score ${scoreClass}">
                    <span class="score-label">Abnormality:</span>
                    <span class="score-value">${score}%</span>
                </div>
            `;
    }

    // Add measurements
    if (results.audio_measurements) {
      const measurements = results.audio_measurements;

      html += '<div class="audio-measurements"><h5>Measurements:</h5><ul>';

      for (const key in measurements) {
        const value = measurements[key].toFixed(2);
        const label = formatMetricName(key);

        html += `
                    <li class="measurement">
                        <span class="measurement-label">${label}:</span>
                        <span class="measurement-value">${value}</span>
                    </li>
                `;
      }

      html += "</ul></div>";
    }

    analysisResults.innerHTML = html;
  }

  // Update state with audio data
  state.modalityData.audio = results;
}

/**
 * Analyze trend for selected parameter
 */
function analyzeTrend() {
  const parameter = document.getElementById("trend-parameter").value;
  const timeWindow = document.getElementById("trend-time-window").value;

  // Show loading state
  const trendChart = document.getElementById("trend-analysis-chart");
  if (trendChart) {
    trendChart.style.opacity = 0.5;
  }

  const interpretationText = document.getElementById(
    "trend-interpretation-text"
  );
  if (interpretationText) {
    interpretationText.textContent = "Analyzing trend...";
  }

  // Fetch trend analysis from API
  fetch(
    `/api/multimodal/trend-analysis?patient_id=${state.patientId}&parameter=${parameter}&time_window=${timeWindow}`
  )
    .then((response) => response.json())
    .then((data) => {
      displayTrendAnalysis(data);
    })
    .catch((error) => {
      console.error("Error analyzing trend:", error);

      if (interpretationText) {
        interpretationText.textContent =
          "Error analyzing trend. Please try again.";
      }

      if (trendChart) {
        trendChart.style.opacity = 1;
      }
    });
}

/**
 * Display trend analysis results
 */
function displayTrendAnalysis(results) {
  // Restore chart opacity
  const trendChart = document.getElementById("trend-analysis-chart");
  if (trendChart) {
    trendChart.style.opacity = 1;
  }

  // Update interpretation text
  const interpretationText = document.getElementById(
    "trend-interpretation-text"
  );
  if (interpretationText && results.interpretation) {
    interpretationText.textContent = results.interpretation;

    // Add class based on significance
    interpretationText.className = "";
    if (results.significance === "significant") {
      interpretationText.classList.add("significant");
    } else if (results.significance === "statistically_significant") {
      interpretationText.classList.add("statistically-significant");
    } else {
      interpretationText.classList.add("not-significant");
    }
  }

  // Update trend chart
  if (state.charts.trendAnalysis && results.parameter) {
    // Clear existing data
    state.charts.trendAnalysis.data.labels = [];
    state.charts.trendAnalysis.data.datasets[0].data = [];
    state.charts.trendAnalysis.data.datasets[1].data = [];

    // Check if we have time range data
    if (results.time_range && results.time_range.start) {
      // Calculate time points
      const startTime = new Date(results.time_range.start);
      const dataPoints = results.data_points || 10;
      const timeInterval = results.time_range.duration_seconds / dataPoints;

      // Create labels (time points)
      const labels = [];
      for (let i = 0; i < dataPoints; i++) {
        const timePoint = new Date(
          startTime.getTime() + i * timeInterval * 1000
        );
        labels.push(formatTime(timePoint));
      }

      state.charts.trendAnalysis.data.labels = labels;

      // Add data points if available
      if (Array.isArray(results.data_values)) {
        state.charts.trendAnalysis.data.datasets[0].data = results.data_values;

        // Update dataset label
        state.charts.trendAnalysis.data.datasets[0].label = formatParameterName(
          results.parameter
        );
      }

      // Add trend line if we have slope and intercept
      if (results.slope !== undefined && results.slope !== null) {
        // Calculate trend line points
        const trendData = [];
        for (let i = 0; i < dataPoints; i++) {
          const x = i * timeInterval;
          const y = results.slope * x + (results.intercept || 0);
          trendData.push(y);
        }

        state.charts.trendAnalysis.data.datasets[1].data = trendData;
      }

      // Update y-axis label
      state.charts.trendAnalysis.options.scales.y.title.text =
        formatParameterName(results.parameter);

      // Update chart
      state.charts.trendAnalysis.update();
    }
  }
}

/**
 * Update vitals trend chart with historical data
 */
function updateVitalsTrendChart(historyData) {
  if (!state.charts.vitalsTrend || !historyData) return;

  // Check if we have timestamps and heart rate data
  if (
    !historyData.timestamps ||
    !historyData.heart_rate ||
    historyData.timestamps.length === 0 ||
    historyData.heart_rate.length === 0
  ) {
    return;
  }

  // Get the last 20 points (or fewer if not available)
  const count = Math.min(20, historyData.timestamps.length);
  const timestamps = historyData.timestamps.slice(-count);
  const heartRates = historyData.heart_rate.slice(-count);

  // Format timestamps for display
  const labels = timestamps.map((ts) => formatTime(new Date(ts)));

  // Update chart data
  state.charts.vitalsTrend.data.labels = labels;
  state.charts.vitalsTrend.data.datasets[0].data = heartRates;

  // Update chart
  state.charts.vitalsTrend.update();
}

/**
 * Connect a wearable device
 */
function connectWearableDevice() {
  const form = document.getElementById("connect-device-form");
  if (!form) return;

  const deviceType = form.elements["device_type"].value;
  const deviceId = form.elements["device_id"].value;
  const provider = form.elements["provider"].value;

  // Close the modal
  const modal = document.getElementById("device-modal");
  if (modal) {
    modal.style.display = "none";
  }

  // Show connecting state in device list
  const devicesList = document.getElementById("connected-devices-list");
  if (devicesList) {
    devicesList.innerHTML =
      '<div class="device-connecting">Connecting to device...</div>';
  }

  // Prepare connection data
  const connectionData = {
    device_id: deviceId,
    device_type: deviceType,
    patient_id: state.patientId,
    connection_params: {
      provider: provider,
    },
  };

  // Send connection request to server
  fetch("/api/multimodal/connect-wearable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(connectionData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Device connection response:", data);

      if (data.status === "success") {
        // Request a fresh multimodal update to reflect the new connected device
        requestMultimodalUpdate();

        // Show success message
        showNotification("Device connected successfully", "success");
      } else {
        // Show error message
        showNotification("Error connecting device: " + data.message, "error");

        // Restore device list
        updateWearableDisplay(state.modalityData.wearable);
      }
    })
    .catch((error) => {
      console.error("Error connecting device:", error);

      // Show error message
      showNotification("Connection failed. Please try again.", "error");

      // Restore device list
      updateWearableDisplay(state.modalityData.wearable);
    });
}

/**
 * Disconnect a wearable device
 */
function disconnectWearableDevice(deviceId) {
  // Send disconnection request to server
  fetch("/api/multimodal/disconnect-wearable", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ device_id: deviceId }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Device disconnection response:", data);

      if (data.status === "success") {
        // Remove from local state
        if (state.modalityData.wearable[deviceId]) {
          delete state.modalityData.wearable[deviceId];
        }

        // Clear selection if this was the selected device
        if (state.selectedWearableDevice === deviceId) {
          state.selectedWearableDevice = null;
        }

        // Update wearable display
        updateWearableDisplay(state.modalityData.wearable);

        // Show success message
        showNotification("Device disconnected successfully", "success");

        // Request a fresh multimodal update
        requestMultimodalUpdate();
      } else {
        // Show error message
        showNotification(
          "Error disconnecting device: " + data.message,
          "error"
        );
      }
    })
    .catch((error) => {
      console.error("Error disconnecting device:", error);
      showNotification("Disconnection failed. Please try again.", "error");
    });
}

/**
 * Request a multimodal data update via socket.io
 */
function requestMultimodalUpdate() {
  if (socket && socket.connected) {
    socket.emit("request_multimodal_update", {
      patient_id: state.patientId,
    });
  } else {
    // Fallback to REST API if socket.io not available
    fetch(`/api/multimodal/patient-summary?patient_id=${state.patientId}`)
      .then((response) => response.json())
      .then((data) => {
        updateDashboardWithMultimodalData(data);
      })
      .catch((error) => {
        console.error("Error fetching multimodal update:", error);
      });
  }
}

/**
 * Update charts when container is resized
 */
function updateChartsOnResize() {
  // Update all charts to fit new container size
  for (const chartName in state.charts) {
    if (state.charts[chartName]) {
      state.charts[chartName].resize();
    }
  }
}

/**
 * Show a notification message
 */
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  // Add to page
  document.body.appendChild(notification);

  // Show with animation
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove after delay
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

/**
 * Show update indicator
 */
function showUpdateIndicator() {
  const refreshBtn = document.getElementById("refresh-data");
  if (!refreshBtn) return;

  refreshBtn.classList.add("updated");
  setTimeout(() => {
    refreshBtn.classList.remove("updated");
  }, 1000);
}

/**
 * Show error message
 */
function showError(message) {
  showNotification(message, "error");
}

/**
 * Utility function to format device type for display
 */
function formatDeviceType(type) {
  if (!type) return "Unknown Device";

  // Replace underscores with spaces and capitalize
  const formatted = type.replace(/_/g, " ");
  return capitalizeFirstLetter(formatted);
}

/**
 * Utility function to format audio type for display
 */
function formatAudioType(type) {
  if (!type) return "Audio";

  const typeMap = {
    breathing: "Breathing Sounds",
    cough: "Cough Recording",
    heart: "Heart Sounds",
    voice: "Voice Sample",
  };

  return typeMap[type] || capitalizeFirstLetter(type);
}

/**
 * Utility function to format metric name for display
 */
function formatMetricName(name) {
  if (!name) return "";

  // Replace underscores with spaces
  let formatted = name.replace(/_/g, " ");

  // Handle special cases
  const specialCases = {
    spo2: "SpO₂",
    bp: "Blood Pressure",
    hr: "Heart Rate",
    rr: "Respiratory Rate",
  };

  for (const key in specialCases) {
    formatted = formatted.replace(
      new RegExp(`\\b${key}\\b`, "i"),
      specialCases[key]
    );
  }

  return capitalizeFirstLetter(formatted);
}

/**
 * Utility function to format parameter name for display
 */
function formatParameterName(name) {
  if (!name) return "";

  // Define mappings for common parameters
  const parameterMap = {
    heart_rate: "Heart Rate (BPM)",
    respiratory_rate: "Respiratory Rate (breaths/min)",
    oxygen_saturation: "Oxygen Saturation (%)",
    temperature: "Temperature (°F)",
    blood_pressure_systolic: "Systolic BP (mmHg)",
    blood_pressure_diastolic: "Diastolic BP (mmHg)",
    risk_score: "Risk Score",
  };

  return parameterMap[name] || formatMetricName(name);
}

/**
 * Utility function to format timestamp for display
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown";

  // Parse the timestamp
  const date = new Date(timestamp);

  // Check if date is valid
  if (isNaN(date.getTime())) return timestamp;

  // Format as MM/DD/YYYY HH:MM:SS
  return `${
    date.getMonth() + 1
  }/${date.getDate()}/${date.getFullYear()} ${formatTime(date)}`;
}

/**
 * Utility function to format time for display
 */
function formatTime(date) {
  if (!date) return "";

  // Format as HH:MM:SS
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Utility function to capitalize first letter of a string
 */
function capitalizeFirstLetter(string) {
  if (!string) return "";
  return string.charAt(0).toUpperCase() + string.slice(1);
}