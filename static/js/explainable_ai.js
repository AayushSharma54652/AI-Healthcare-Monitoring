/**
 * Explainable AI Dashboard
 * Provides detailed explanations of the AI's decision-making process
 * and allows interactive exploration of the healthcare monitoring system
 */

// Connect to the Socket.IO server
const socket = io();

// State to store the latest data
let currentData = {
  riskScore: 0.15,
  currentVitals: {
    heartRate: 75,
    bloodPressure: [120, 80],
    respiratoryRate: 16,
    oxygenSaturation: 98,
    temperature: 98.6,
  },
  featureAttribution: {},
  confidenceIntervals: {},
  similarCases: [],
  counterfactuals: [],
};

// Initialize the dashboard when the page loads
document.addEventListener("DOMContentLoaded", function () {
  initExplanationDashboard();

  // Set up socket event handlers
  socket.on("connect", function () {
    console.log("Connected to server");

    // Request initial data
    socket.emit("request_explanation_data");
  });

  socket.on("explanation_data", function (data) {
    updateExplanationDashboard(data);
  });

  socket.on("vitals_update", function (data) {
    // Request explanation data when new vitals come in
    socket.emit("request_explanation_data", {
      vitals: data.current_vitals,
      risk_score: data.risk_score,
      anomalies: data.anomaly_results,
    });

    // Update risk score display
    document.getElementById(
      "risk-score-display"
    ).textContent = `Risk Score: ${Math.round(data.risk_score * 100)}%`;

    // Update status indicator color
    const statusIndicator = document.querySelector(".status-indicator");
    if (data.risk_score < 0.3) {
      statusIndicator.className = "status-indicator normal";
    } else if (data.risk_score < 0.7) {
      statusIndicator.className = "status-indicator warning";
    } else {
      statusIndicator.className = "status-indicator high-risk";
    }
  });

  // Set up interactive controls
  document
    .getElementById("update-exploration")
    .addEventListener("click", function () {
      updateExplorationChart();
    });

  document
    .getElementById("exploration-vital")
    .addEventListener("change", function () {
      updateExplorationRange();
    });

  document
    .getElementById("download-report")
    .addEventListener("click", function () {
      generateExplanationReport();
    });

  // Initial setup of exploration range
  updateExplorationRange();
});

/**
 * Initialize the explanation dashboard
 */
function initExplanationDashboard() {
  // Initial risk gauge
  updateRiskGauge(0.15);

  // Initialize charts
  initConfidenceChart();
  initExplorationChart();

  // Initialize decision path visualization
  initDecisionPath();
}

/**
 * Update the explanation dashboard with new data
 */
function updateExplanationDashboard(data) {
  // Store the current data
  currentData = {
    ...currentData,
    ...data,
  };

  // Update risk gauge and summary
  updateRiskGauge(data.riskScore);
  updateRiskSummary(data);

  // Update feature attribution
  updateFeatureAttribution(data.featureAttribution);

  // Update counterfactual analysis
  updateCounterfactuals(data.counterfactuals);

  // Update confidence intervals
  updateConfidenceChart(data.confidenceIntervals);

  // Update similar cases
  updateSimilarCases(data.similarCases);

  // Update decision path
  updateDecisionPath(data.decisionPath);
}

/**
 * Update the risk gauge visualization
 */
function updateRiskGauge(riskScore) {
  // Update the gauge arrow rotation (0 to 180 degrees)
  const rotationDegrees = riskScore * 180;
  document.getElementById(
    "gauge-arrow"
  ).style.transform = `rotate(${rotationDegrees}deg)`;

  // Update the risk value
  document.getElementById("risk-value").textContent = `${Math.round(
    riskScore * 100
  )}%`;
}

/**
 * Update the risk summary text
 */
function updateRiskSummary(data) {
  let summaryText = "";

  if (data.riskScore < 0.2) {
    summaryText =
      "Patient is currently at <strong>low risk</strong>. Vital signs are within normal ranges with minor variations.";
  } else if (data.riskScore < 0.4) {
    summaryText =
      "Patient is at <strong>elevated risk</strong>. Some vital signs show variations that should be monitored.";
  } else if (data.riskScore < 0.7) {
    summaryText =
      "Patient is at <strong>moderate risk</strong>. Several abnormal vital signs detected that require attention.";
  } else {
    summaryText =
      "Patient is at <strong>high risk</strong>. Immediate clinical evaluation is recommended.";
  }

  // Add risk factors if available
  if (data.riskFactors && data.riskFactors.length > 0) {
    summaryText += " Key risk factors include: <ul>";
    data.riskFactors.forEach((factor) => {
      summaryText += `<li>${factor}</li>`;
    });
    summaryText += "</ul>";
  }

  document.getElementById("risk-summary-text").innerHTML = summaryText;
}

/**
 * Update the feature attribution visualization
 */
function updateFeatureAttribution(attributionData) {
  // If no attribution data yet, use sample data
  if (!attributionData || Object.keys(attributionData).length === 0) {
    attributionData = {
      heartRate: {
        value: 105,
        normalRange: [60, 100],
        attribution: 0.25,
        impact: "positive",
      },
      bloodPressureSystolic: {
        value: 135,
        normalRange: [90, 140],
        attribution: 0.15,
        impact: "positive",
      },
      bloodPressureDiastolic: {
        value: 85,
        normalRange: [60, 90],
        attribution: 0.05,
        impact: "neutral",
      },
      respiratoryRate: {
        value: 22,
        normalRange: [12, 20],
        attribution: 0.2,
        impact: "positive",
      },
      oxygenSaturation: {
        value: 94,
        normalRange: [95, 100],
        attribution: 0.3,
        impact: "positive",
      },
      temperature: {
        value: 99.2,
        normalRange: [97, 99],
        attribution: 0.05,
        impact: "neutral",
      },
    };
  }

  const container = document.getElementById("feature-attribution");
  container.innerHTML = "";

  // Create feature bars for each vital sign
  Object.entries(attributionData).forEach(([feature, data]) => {
    const featureBar = document.createElement("div");
    featureBar.className = "feature-bar";

    // Format feature name for display
    let displayName = feature
      .replace(/([A-Z])/g, " $1") // Add spaces before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

    // Format value and normal range
    let valueDisplay = "";
    if (feature === "heartRate") {
      valueDisplay = `${data.value} BPM (Normal: ${data.normalRange[0]}-${data.normalRange[1]})`;
    } else if (feature.includes("bloodPressure")) {
      valueDisplay = `${data.value} mmHg (Normal: ${data.normalRange[0]}-${data.normalRange[1]})`;
    } else if (feature === "respiratoryRate") {
      valueDisplay = `${data.value} breaths/min (Normal: ${data.normalRange[0]}-${data.normalRange[1]})`;
    } else if (feature === "oxygenSaturation") {
      valueDisplay = `${data.value}% (Normal: >${data.normalRange[0]}%)`;
    } else if (feature === "temperature") {
      valueDisplay = `${data.value}°F (Normal: ${data.normalRange[0]}-${data.normalRange[1]})`;
    } else {
      valueDisplay = `${data.value} (Normal: ${data.normalRange[0]}-${data.normalRange[1]})`;
    }

    // Create feature info
    const featureInfo = document.createElement("div");
    featureInfo.className = "feature-info";
    featureInfo.innerHTML = `
            <span class="feature-name">${displayName}</span>
            <span class="feature-value">${valueDisplay}</span>
        `;

    // Create attribution bar
    const attributionBar = document.createElement("div");
    attributionBar.className = "feature-attribution-bar";

    // Create fill based on attribution value
    const fillWidth = Math.abs(data.attribution) * 100;
    const fillElement = document.createElement("div");
    fillElement.className = `feature-fill ${data.impact}`;
    fillElement.style.width = `${fillWidth}%`;

    // Add percentage text if attribution is significant
    if (fillWidth >= 10) {
      const percentageElement = document.createElement("span");
      percentageElement.className = "feature-percentage";
      percentageElement.textContent = `${Math.round(fillWidth)}%`;
      fillElement.appendChild(percentageElement);
    }

    attributionBar.appendChild(fillElement);

    // Assemble and add to container
    featureBar.appendChild(featureInfo);
    featureBar.appendChild(attributionBar);
    container.appendChild(featureBar);
  });
}

/**
 * Update the counterfactual analysis section
 */
function updateCounterfactuals(counterfactuals) {
  // If no counterfactuals provided, use sample data
  if (!counterfactuals || counterfactuals.length === 0) {
    counterfactuals = [
      {
        text: "If heart rate decreased to 85 BPM",
        riskChange: -0.15,
        type: "positive",
      },
      {
        text: "If oxygen saturation increased to 97%",
        riskChange: -0.2,
        type: "positive",
      },
      {
        text: "If respiratory rate decreased to 18 breaths/min",
        riskChange: -0.1,
        type: "positive",
      },
      {
        text: "If heart rate increased to 125 BPM",
        riskChange: 0.25,
        type: "negative",
      },
    ];
  }

  const container = document.getElementById("counterfactual-scenarios");
  container.innerHTML = "";

  // Create counterfactual scenario elements
  counterfactuals.forEach((scenario) => {
    const scenarioElement = document.createElement("div");
    scenarioElement.className = `counterfactual-scenario ${scenario.type}`;

    // Format risk change text
    const changeDirection = scenario.riskChange < 0 ? "decrease" : "increase";
    const changeText = `${Math.abs(scenario.riskChange * 100).toFixed(
      0
    )}% ${changeDirection}`;

    scenarioElement.innerHTML = `
            <div class="counterfactual-text">
                ${scenario.text}
                <span class="risk-change ${changeDirection}">
                    ${changeDirection === "decrease" ? "↓" : "↑"} ${changeText}
                </span>
            </div>
        `;

    container.appendChild(scenarioElement);
  });
}

/**
 * Initialize the confidence chart
 */
function initConfidenceChart() {
  const ctx = document.getElementById("confidence-chart").getContext("2d");

  // Sample data for initial chart
  const labels = ["Now", "+5m", "+10m", "+15m", "+20m", "+25m", "+30m"];
  const predictions = [0.25, 0.27, 0.3, 0.34, 0.39, 0.42, 0.45];
  const lowerBound = [0.2, 0.21, 0.22, 0.24, 0.27, 0.28, 0.3];
  const upperBound = [0.3, 0.34, 0.39, 0.44, 0.51, 0.58, 0.63];

  window.confidenceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Prediction",
          data: predictions,
          borderColor: "#3498db",
          borderWidth: 2,
          pointBackgroundColor: "#3498db",
          pointRadius: 3,
          fill: false,
          tension: 0.1,
        },
        {
          label: "Upper Bound (95%)",
          data: upperBound,
          borderColor: "rgba(52, 152, 219, 0.2)",
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: false,
        },
        {
          label: "Lower Bound (95%)",
          data: lowerBound,
          borderColor: "rgba(52, 152, 219, 0.2)",
          borderWidth: 1,
          pointRadius: 0,
          borderDash: [5, 5],
          fill: "+1",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: function (value) {
              return value * 100 + "%";
            },
          },
          title: {
            display: true,
            text: "Risk Score",
          },
        },
        x: {
          title: {
            display: true,
            text: "Time Horizon",
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return (context.raw * 100).toFixed(0) + "% Risk";
            },
          },
        },
      },
    },
  });

  // Update confidence explanation
  document.getElementById("confidence-explanation-text").innerHTML =
    "The AI system has <strong>high confidence</strong> in the current risk assessment. " +
    "Predictions show a gradually increasing risk trend over the next 30 minutes, with " +
    "widening uncertainty bounds as the prediction reaches further into the future.";
}

/**
 * Update the confidence chart with new data
 */
function updateConfidenceChart(confidenceData) {
  // If no data provided, keep the existing chart
  if (!confidenceData || !confidenceData.predictions) {
    return;
  }

  // Update the chart with new data
  window.confidenceChart.data.labels = confidenceData.timeHorizons;
  window.confidenceChart.data.datasets[0].data = confidenceData.predictions;
  window.confidenceChart.data.datasets[1].data = confidenceData.upperBound;
  window.confidenceChart.data.datasets[2].data = confidenceData.lowerBound;
  window.confidenceChart.update();

  // Update explanation text
  let confidenceText = "";
  const currentConfidence = confidenceData.confidence || "high";

  if (currentConfidence === "high") {
    confidenceText =
      "The AI system has <strong>high confidence</strong> in the current risk assessment. ";
  } else if (currentConfidence === "medium") {
    confidenceText =
      "The AI system has <strong>moderate confidence</strong> in the current risk assessment. ";
  } else {
    confidenceText =
      "The AI system has <strong>low confidence</strong> in the current risk assessment. ";
  }

  // Add trend description
  const trend = detectTrend(confidenceData.predictions);
  if (trend > 0.1) {
    confidenceText +=
      "Predictions show a <strong>significantly increasing risk</strong> over the forecast period.";
  } else if (trend > 0.05) {
    confidenceText +=
      "Predictions show a <strong>gradually increasing risk trend</strong> over the forecast period.";
  } else if (trend < -0.1) {
    confidenceText +=
      "Predictions show a <strong>significantly decreasing risk</strong> over the forecast period.";
  } else if (trend < -0.05) {
    confidenceText +=
      "Predictions show a <strong>gradually decreasing risk trend</strong> over the forecast period.";
  } else {
    confidenceText +=
      "Predictions show a <strong>relatively stable risk</strong> over the forecast period.";
  }

  document.getElementById("confidence-explanation-text").innerHTML =
    confidenceText;
}

/**
 * Helper function to detect trend in prediction data
 */
function detectTrend(predictions) {
  if (!predictions || predictions.length < 2) {
    return 0;
  }

  return predictions[predictions.length - 1] - predictions[0];
}

/**
 * Update similar cases section
 */
function updateSimilarCases(similarCases) {
  // If no similar cases provided, use sample data
  if (!similarCases || similarCases.length === 0) {
    similarCases = [
      {
        name: "Early Sepsis",
        similarity: 0.82,
        description:
          "Rising heart rate, elevated respiratory rate, and declining BP",
      },
      {
        name: "Respiratory Distress",
        similarity: 0.67,
        description:
          "Declining oxygen saturation with compensatory increased respiratory rate",
      },
      {
        name: "Cardiac Ischemia",
        similarity: 0.45,
        description: "ST segment changes with mild tachycardia",
      },
    ];
  }

  const container = document.getElementById("similar-cases-list");
  container.innerHTML = "";

  // Create similar case elements
  similarCases.forEach((caseData) => {
    const caseElement = document.createElement("div");
    caseElement.className = "similar-case";

    // Format similarity as percentage
    const similarityPercent = Math.round(caseData.similarity * 100);

    caseElement.innerHTML = `
            <div>
                <div class="case-name">${caseData.name}</div>
                <div class="case-description">${caseData.description}</div>
            </div>
            <div class="case-similarity">${similarityPercent}% Match</div>
        `;

    container.appendChild(caseElement);
  });
}

/**
 * Initialize the decision path visualization
 */
function initDecisionPath() {
  // Create a placeholder decision tree visualization using D3.js
  const width = document.getElementById("decision-path-container").clientWidth;
  const height = 300;

  const svg = d3
    .select("#decision-path-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Add a background rect
  svg
    .append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#f8f9fa");

  // Add placeholder text
  svg
    .append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .text("Decision path visualization will appear here");
}

/**
 * Update the decision path visualization
 */
function updateDecisionPath(decisionPath) {
  // This would be implemented with a more complex D3.js visualization
  // For now, just showing a placeholder

  // If no actual decision path data, leave the placeholder
  if (!decisionPath) return;

  // Clear existing content
  const container = document.getElementById("decision-path-container");
  container.innerHTML = "";

  // Create a new visualization (simplified for demo)
  const width = container.clientWidth;
  const height = 300;

  const svg = d3
    .select("#decision-path-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Implementation would continue here with a tree visualization
  // based on the decisionPath data
}

/**
 * Initialize the interactive exploration chart
 */
function initExplorationChart() {
  const ctx = document.getElementById("exploration-chart").getContext("2d");

  // Sample data for initial chart
  const labels = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140];
  const riskScores = [
    0.35, 0.25, 0.15, 0.08, 0.05, 0.08, 0.15, 0.25, 0.4, 0.6, 0.75,
  ];

  // Calculate current value position
  const currentValue = 75;
  const currentRisk = 0.08;

  window.explorationChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Risk Score",
          data: riskScores,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "Current Value",
          data: Array(labels.length).fill(null),
          pointBackgroundColor: "#e74c3c",
          pointBorderColor: "#fff",
          pointRadius: 6,
          pointHoverRadius: 8,
          type: "scatter",
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 1,
          ticks: {
            callback: function (value) {
              return value * 100 + "%";
            },
          },
          title: {
            display: true,
            text: "Risk Score",
          },
        },
        x: {
          title: {
            display: true,
            text: "Heart Rate (BPM)",
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              if (context.dataset.label === "Risk Score") {
                return "Risk: " + (context.raw * 100).toFixed(0) + "%";
              }
              return "Current: " + currentValue + " BPM";
            },
          },
        },
      },
    },
  });

  // Set current value point
  const pointIndex = findClosestIndex(labels, currentValue);
  window.explorationChart.data.datasets[1].data[pointIndex] = currentRisk;
  window.explorationChart.update();
}

/**
 * Update the exploration range based on selected vital
 */
function updateExplorationRange() {
  const vitalType = document.getElementById("exploration-vital").value;
  const rangeSlider = document.getElementById("exploration-range");
  const minLabel = document.getElementById("range-min");
  const maxLabel = document.getElementById("range-max");

  // Define ranges for each vital type
  const ranges = {
    heartRate: { min: 40, max: 160, current: 75 },
    bloodPressureSystolic: { min: 70, max: 200, current: 120 },
    bloodPressureDiastolic: { min: 40, max: 120, current: 80 },
    respiratoryRate: { min: 8, max: 40, current: 16 },
    oxygenSaturation: { min: 70, max: 100, current: 98 },
    temperature: { min: 94, max: 104, current: 98.6 },
  };

  // Get current vital sign data from state
  const currentValue = getCurrentVitalValue(vitalType);

  // Update slider and labels
  rangeSlider.min = ranges[vitalType].min;
  rangeSlider.max = ranges[vitalType].max;
  rangeSlider.value = currentValue;

  minLabel.textContent = ranges[vitalType].min;
  maxLabel.textContent = ranges[vitalType].max;

  // Update exploration chart
  updateExplorationChart();
}

/**
 * Get current vital sign value from state
 */
function getCurrentVitalValue(vitalType) {
  if (!currentData.currentVitals) {
    // Default values if no data available
    const defaults = {
      heartRate: 75,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      temperature: 98.6,
    };
    return defaults[vitalType];
  }

  switch (vitalType) {
    case "heartRate":
      return currentData.currentVitals.heartRate;
    case "bloodPressureSystolic":
      return currentData.currentVitals.bloodPressure[0];
    case "bloodPressureDiastolic":
      return currentData.currentVitals.bloodPressure[1];
    case "respiratoryRate":
      return currentData.currentVitals.respiratoryRate;
    case "oxygenSaturation":
      return currentData.currentVitals.oxygenSaturation;
    case "temperature":
      return currentData.currentVitals.temperature;
    default:
      return 75;
  }
}

/**
 * Update the exploration chart with new data
 */
function updateExplorationChart() {
  const vitalType = document.getElementById("exploration-vital").value;
  const currentValue = getCurrentVitalValue(vitalType);

  // Generate x-axis labels (values for the selected vital sign)
  let labels = [];
  let riskScores = [];

  // Define ranges and generate data points
  switch (vitalType) {
    case "heartRate":
      labels = Array.from({ length: 13 }, (_, i) => 40 + i * 10);
      // U-shaped risk curve with minimum around 70-80
      riskScores = [
        0.7, 0.5, 0.3, 0.18, 0.1, 0.05, 0.04, 0.05, 0.1, 0.2, 0.35, 0.55, 0.75,
      ];
      break;

    case "bloodPressureSystolic":
      labels = Array.from({ length: 14 }, (_, i) => 70 + i * 10);
      // U-shaped risk curve with minimum around 110-130
      riskScores = [
        0.65, 0.45, 0.3, 0.2, 0.13, 0.08, 0.05, 0.05, 0.08, 0.15, 0.25, 0.4,
        0.6, 0.8,
      ];
      break;

    case "bloodPressureDiastolic":
      labels = Array.from({ length: 9 }, (_, i) => 40 + i * 10);
      // U-shaped risk curve with minimum around 70-80
      riskScores = [0.6, 0.35, 0.2, 0.1, 0.05, 0.08, 0.2, 0.45, 0.7];
      break;

    case "respiratoryRate":
      labels = Array.from({ length: 17 }, (_, i) => 8 + i * 2);
      // U-shaped risk curve with minimum around 14-18
      riskScores = [
        0.65, 0.45, 0.3, 0.18, 0.1, 0.06, 0.05, 0.05, 0.06, 0.12, 0.22, 0.35,
        0.5, 0.65, 0.75, 0.85, 0.95,
      ];
      break;

    case "oxygenSaturation":
      labels = Array.from({ length: 31 }, (_, i) => 70 + i);
      // Exponential curve with rapid increase below 90
      riskScores = [
        0.95,
        0.93,
        0.91,
        0.89,
        0.87,
        0.85,
        0.82,
        0.79,
        0.76,
        0.73, // 70-79
        0.7,
        0.65,
        0.6,
        0.55,
        0.5,
        0.45,
        0.4,
        0.35,
        0.3,
        0.25, // 80-89
        0.2,
        0.15,
        0.1,
        0.07,
        0.05,
        0.04,
        0.03,
        0.02,
        0.01,
        0.01,
        0.01, // 90-100
      ];
      break;

    case "temperature":
      labels = Array.from({ length: 21 }, (_, i) => 94 + i * 0.5);
      // U-shaped risk curve with minimum around 97-99
      riskScores = [
        0.7,
        0.55,
        0.4,
        0.3,
        0.2,
        0.12, // 94-96.5
        0.08,
        0.05,
        0.04,
        0.04,
        0.05,
        0.08, // 97-99.5
        0.15,
        0.25,
        0.35,
        0.45,
        0.6,
        0.7,
        0.8,
        0.85,
        0.9, // 100-104
      ];
      break;

    default:
      labels = Array.from({ length: 11 }, (_, i) => i * 10);
      riskScores = Array.from({ length: 11 }, (_, i) => i / 10);
  }

  // Update chart labels and data
  window.explorationChart.data.labels = labels;
  window.explorationChart.data.datasets[0].data = riskScores;

  // Update x-axis title
  let xAxisTitle = "";
  switch (vitalType) {
    case "heartRate":
      xAxisTitle = "Heart Rate (BPM)";
      break;
    case "bloodPressureSystolic":
      xAxisTitle = "Systolic Blood Pressure (mmHg)";
      break;
    case "bloodPressureDiastolic":
      xAxisTitle = "Diastolic Blood Pressure (mmHg)";
      break;
    case "respiratoryRate":
      xAxisTitle = "Respiratory Rate (breaths/min)";
      break;
    case "oxygenSaturation":
      xAxisTitle = "Oxygen Saturation (%)";
      break;
    case "temperature":
      xAxisTitle = "Temperature (°F)";
      break;
  }

  window.explorationChart.options.scales.x.title.text = xAxisTitle;

  // Clear current value point
  window.explorationChart.data.datasets[1].data = Array(labels.length).fill(
    null
  );

  // Set current value point
  const pointIndex = findClosestIndex(labels, currentValue);
  if (pointIndex >= 0) {
    window.explorationChart.data.datasets[1].data[pointIndex] =
      riskScores[pointIndex];
  }

  // Update chart
  window.explorationChart.update();
}

/**
 * Helper function to find the closest index in an array
 */
function findClosestIndex(array, value) {
  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let i = 0; i < array.length; i++) {
    const distance = Math.abs(array[i] - value);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Generate and download an explanation report
 */
function generateExplanationReport() {
  // In a real system, this would generate a PDF or detailed report
  // For demo purposes, show an alert
  alert(
    "Generating explanation report... This feature would generate a detailed PDF report of the AI analysis."
  );
}
