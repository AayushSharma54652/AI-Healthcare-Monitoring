// Connect to Socket.IO server
const socket = io();

// Store chart objects for updates
const charts = {};
let ecgChart = null;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Initialize all charts
  initializeCharts();

  // Setup socket.io event listeners
  setupSocketListeners();
});

// Initialize chart objects
function initializeCharts() {
  // Initialize vital signs mini charts
  charts.heartRate = createLineChart(
    "heart-rate-chart",
    "Heart Rate",
    "#f87171"
  );
  charts.bloodPressure = createDualLineChart(
    "blood-pressure-chart",
    "Blood Pressure",
    "#4f46e5",
    "#818cf8"
  );
  charts.oxygen = createLineChart(
    "oxygen-chart",
    "Oxygen Saturation",
    "#10b981"
  );
  charts.respiratory = createLineChart(
    "respiratory-chart",
    "Respiratory Rate",
    "#f59e0b"
  );
  charts.temperature = createLineChart(
    "temperature-chart",
    "Temperature",
    "#ec4899"
  );

  // Initialize ECG chart
  ecgChart = createECGChart("ecg-chart");
}

// Setup Socket.IO event listeners
function setupSocketListeners() {
  // Listen for initial data when connecting
  socket.on("initial_data", function (data) {
    console.log("Received initial data:", data);

    // Update charts with historical data
    updateChartsWithHistory(data.patient_data_history);

    // Update alerts panel
    updateAlerts(data.alerts);
  });

  // Listen for real-time updates
  // Listen for real-time updates
  socket.on("vitals_update", function (data) {
    console.log("Received update:", data);

    // Update vital signs displays
    updateVitalSigns(data.current_vitals);

    // Update charts
    updateCharts(data.current_vitals);

    // Update ECG display
    updateECG(data.current_vitals.ecg_data, data.ecg_analysis);

    // Update AI analysis section - now passing current_vitals
    updateAIAnalysis(
      data.risk_score,
      data.risk_factors,
      data.anomaly_results,
      data.current_vitals
    );

    // Update predictions
    updatePredictions(data.predictions);

    // Update alerts if any new ones
    if (data.alerts && data.alerts.length > 0) {
      updateAlerts(data.alerts);
    }
  });
}

// Update vital signs displays with current data
function updateVitalSigns(vitals) {
  // Update heart rate
  document.getElementById("heart-rate-value").textContent = vitals.heart_rate;
  updateStatusIndicator("heart-rate-status", vitals.heart_rate, 60, 100);

  // Update blood pressure
  document.getElementById(
    "blood-pressure-value"
  ).textContent = `${vitals.blood_pressure[0]}/${vitals.blood_pressure[1]}`;
  updateStatusIndicator(
    "blood-pressure-status",
    vitals.blood_pressure[0],
    90,
    140,
    vitals.blood_pressure[1],
    60,
    90
  );

  // Update oxygen saturation
  document.getElementById("oxygen-value").textContent =
    vitals.oxygen_saturation;
  updateStatusIndicator(
    "oxygen-status",
    vitals.oxygen_saturation,
    95,
    100,
    null,
    null,
    null,
    true
  );

  // Update respiratory rate
  document.getElementById("respiratory-value").textContent =
    vitals.respiratory_rate;
  updateStatusIndicator("respiratory-status", vitals.respiratory_rate, 12, 20);

  // Update temperature
  document.getElementById("temperature-value").textContent = vitals.temperature;
  updateStatusIndicator("temperature-status", vitals.temperature, 97, 99);
}

// Update status indicator color based on value
function updateStatusIndicator(
  elementId,
  value,
  min,
  max,
  value2 = null,
  min2 = null,
  max2 = null,
  higherIsBetter = false
) {
  const element = document.getElementById(elementId);

  // Remove all existing classes
  element.classList.remove("normal", "warning", "critical");

  // Check if value is in normal range
  let status = "normal";

  if (higherIsBetter) {
    // For metrics where higher is better (e.g., oxygen)
    if (value < min) {
      status = value < min - 5 ? "critical" : "warning";
    }
  } else {
    // For metrics with a normal range
    if (value < min || value > max) {
      // Determine how far outside the range
      const lowerDiff = min - value;
      const upperDiff = value - max;
      const diff = Math.max(lowerDiff, upperDiff);

      status = diff > (max - min) / 3 ? "critical" : "warning";
    }
  }

  // If there's a second value to check (e.g., diastolic BP)
  if (value2 !== null && min2 !== null && max2 !== null) {
    if (value2 < min2 || value2 > max2) {
      // Determine how far outside the range
      const lowerDiff = min2 - value2;
      const upperDiff = value2 - max2;
      const diff = Math.max(lowerDiff, upperDiff);

      // Use the more severe status
      const status2 = diff > (max2 - min2) / 3 ? "critical" : "warning";
      if (
        status === "normal" ||
        (status === "warning" && status2 === "critical")
      ) {
        status = status2;
      }
    }
  }

  // Apply the appropriate class
  element.classList.add(status);
}

// Update charts with new data point
function updateCharts(vitals) {
  // Add new data points to each chart
  const timestamp = new Date().toLocaleTimeString();

  // Update heart rate chart
  addDataPoint(charts.heartRate, timestamp, vitals.heart_rate);

  // Update blood pressure chart (systolic and diastolic)
  addDualDataPoint(
    charts.bloodPressure,
    timestamp,
    vitals.blood_pressure[0],
    vitals.blood_pressure[1]
  );

  // Update oxygen saturation chart
  addDataPoint(charts.oxygen, timestamp, vitals.oxygen_saturation);

  // Update respiratory rate chart
  addDataPoint(charts.respiratory, timestamp, vitals.respiratory_rate);

  // Update temperature chart
  addDataPoint(charts.temperature, timestamp, vitals.temperature);
}

// Update ECG display
function updateECG(ecgData, ecgAnalysis) {
  // Update ECG chart with new data
  updateECGChart(ecgChart, ecgData);

  // Update ECG analysis text
  const ecgAnalysisElement = document.getElementById("ecg-analysis");
  if (
    ecgAnalysis &&
    ecgAnalysis.condition_names &&
    ecgAnalysis.condition_names.length > 0
  ) {
    ecgAnalysisElement.textContent = ecgAnalysis.condition_names.join(", ");

    // Update ECG status indicator
    const ecgStatusElement = document.getElementById("ecg-status");
    ecgStatusElement.classList.remove("normal", "warning", "critical");

    if (
      ecgAnalysis.conditions.includes("normal") &&
      ecgAnalysis.conditions.length === 1
    ) {
      ecgStatusElement.classList.add("normal");
    } else if (
      ecgAnalysis.conditions.includes("afib") ||
      ecgAnalysis.conditions.includes("st_elevation")
    ) {
      ecgStatusElement.classList.add("critical");
    } else {
      ecgStatusElement.classList.add("warning");
    }
  } else {
    ecgAnalysisElement.textContent = "Normal sinus rhythm";
    document.getElementById("ecg-status").classList.add("normal");
  }
}

// Update AI analysis section
// Update AI analysis section
function updateAIAnalysis(riskScore, riskFactors, anomalyResults, currentData) {
  // Update risk meter
  const riskMeterFill = document.getElementById("risk-meter-fill");
  const riskMeterValue = document.getElementById("risk-meter-value");
  const riskScoreDisplay = document.getElementById("risk-score-display");

  // Set risk meter fill width based on risk score
  riskMeterFill.style.width = `${riskScore * 100}%`;

  // Update risk score text
  riskMeterValue.textContent = `${Math.round(riskScore * 100)}%`;
  riskScoreDisplay.textContent = `Risk Score: ${Math.round(riskScore * 100)}%`;

  // Update patient status indicator based on risk score
  const statusIndicator = document.querySelector(
    ".patient-info .status-indicator"
  );
  statusIndicator.classList.remove("low-risk", "medium-risk", "high-risk");

  if (riskScore < 0.3) {
    statusIndicator.classList.add("low-risk");
  } else if (riskScore < 0.7) {
    statusIndicator.classList.add("medium-risk");
  } else {
    statusIndicator.classList.add("high-risk");
  }

  // Update risk factors list
  const riskFactorsList = document.getElementById("risk-factors-list");

  if (riskFactors && riskFactors.length > 0) {
    riskFactorsList.innerHTML = "";
    riskFactors.forEach((factor) => {
      const li = document.createElement("li");
      li.textContent = factor;
      riskFactorsList.appendChild(li);
    });
  } else {
    riskFactorsList.innerHTML = "<li>No significant risk factors detected</li>";
  }

  // Update AI explainer if the function exists
  if (typeof updateAIExplanation === "function" && currentData) {
    updateAIExplanation(currentData, anomalyResults, riskScore, riskFactors);
  }
}

// Update predictions display
function updatePredictions(predictions) {
  if (!predictions) return;

  // Get the last prediction in the series
  const lastIndex = predictions.heart_rate.length - 1;

  // Update heart rate prediction
  document.getElementById("heart-rate-prediction").textContent =
    predictions.heart_rate[lastIndex];

  // Update blood pressure prediction
  document.getElementById(
    "blood-pressure-prediction"
  ).textContent = `${predictions.blood_pressure_systolic[lastIndex]}/${predictions.blood_pressure_diastolic[lastIndex]}`;

  // Update oxygen saturation prediction
  document.getElementById("oxygen-prediction").textContent =
    predictions.oxygen_saturation[lastIndex];

  // Update respiratory rate prediction
  document.getElementById("respiratory-prediction").textContent =
    predictions.respiratory_rate[lastIndex];

  // Update temperature prediction
  document.getElementById("temperature-prediction").textContent =
    predictions.temperature[lastIndex];
}

// Update alerts panel
function updateAlerts(alerts) {
  const alertsContainer = document.getElementById("alerts-container");

  if (!alerts || alerts.length === 0) {
    alertsContainer.innerHTML =
      '<div class="alert-placeholder">No alerts</div>';
    return;
  }

  // Clear container
  alertsContainer.innerHTML = "";

  // Add alerts in reverse order (newest first)
  alerts
    .slice()
    .reverse()
    .forEach((alert) => {
      const alertTime = new Date(alert.timestamp).toLocaleTimeString();

      const alertElement = document.createElement("div");
      alertElement.className = "alert-item";

      alertElement.innerHTML = `
            <div class="alert-header">
                <div class="alert-title">Alert</div>
                <div class="alert-time">${alertTime}</div>
            </div>
            <div class="alert-details">${alert.message}</div>
        `;

      alertsContainer.appendChild(alertElement);
    });
}

// Update charts with historical data
function updateChartsWithHistory(history) {
  if (!history || !history.timestamps || history.timestamps.length === 0)
    return;

  // Clear existing data
  charts.heartRate.data.labels = [];
  charts.heartRate.data.datasets[0].data = [];

  charts.bloodPressure.data.labels = [];
  charts.bloodPressure.data.datasets[0].data = [];
  charts.bloodPressure.data.datasets[1].data = [];

  charts.oxygen.data.labels = [];
  charts.oxygen.data.datasets[0].data = [];

  charts.respiratory.data.labels = [];
  charts.respiratory.data.datasets[0].data = [];

  charts.temperature.data.labels = [];
  charts.temperature.data.datasets[0].data = [];

  // Use only the last 20 points for display
  const startIndex = Math.max(0, history.timestamps.length - 20);

  for (let i = startIndex; i < history.timestamps.length; i++) {
    const timestamp = new Date(history.timestamps[i]).toLocaleTimeString();

    // Add data to each chart
    charts.heartRate.data.labels.push(timestamp);
    charts.heartRate.data.datasets[0].data.push(history.heart_rate[i]);

    charts.bloodPressure.data.labels.push(timestamp);
    charts.bloodPressure.data.datasets[0].data.push(
      history.blood_pressure_systolic[i]
    );
    charts.bloodPressure.data.datasets[1].data.push(
      history.blood_pressure_diastolic[i]
    );

    charts.oxygen.data.labels.push(timestamp);
    charts.oxygen.data.datasets[0].data.push(history.oxygen_saturation[i]);

    charts.respiratory.data.labels.push(timestamp);
    charts.respiratory.data.datasets[0].data.push(history.respiratory_rate[i]);

    charts.temperature.data.labels.push(timestamp);
    charts.temperature.data.datasets[0].data.push(history.temperature[i]);
  }

  // Update all charts
  charts.heartRate.update();
  charts.bloodPressure.update();
  charts.oxygen.update();
  charts.respiratory.update();
  charts.temperature.update();
}

function updateECG(ecgData, ecgAnalysis) {
  // Update ECG chart with new data
  if (typeof updateECGChart === "function") {
    // Use the enhanced ECG visualization if available
    updateECGChart(ecgChart, ecgData, ecgAnalysis);
  } else {
    // Fallback to basic update
    ecgChart.data.datasets[0].data = ecgData;
    ecgChart.update();
  }

  // Update ECG analysis text
  const ecgAnalysisElement = document.getElementById("ecg-analysis");
  if (
    ecgAnalysis &&
    ecgAnalysis.condition_names &&
    ecgAnalysis.condition_names.length > 0
  ) {
    ecgAnalysisElement.textContent = ecgAnalysis.condition_names.join(", ");

    // Update ECG status indicator
    const ecgStatusElement = document.getElementById("ecg-status");
    ecgStatusElement.classList.remove("normal", "warning", "critical");

    if (
      ecgAnalysis.conditions.includes("normal") &&
      ecgAnalysis.conditions.length === 1
    ) {
      ecgStatusElement.classList.add("normal");
    } else if (
      ecgAnalysis.conditions.includes("afib") ||
      ecgAnalysis.conditions.includes("st_elevation")
    ) {
      ecgStatusElement.classList.add("critical");
    } else {
      ecgStatusElement.classList.add("warning");
    }
  } else {
    ecgAnalysisElement.textContent = "Normal sinus rhythm";
    document.getElementById("ecg-status").classList.add("normal");
  }
}
