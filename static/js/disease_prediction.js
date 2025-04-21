/**
 * Disease Prediction JavaScript
 * Handles the symptoms input and disease prediction functionality
 * Enhanced with differential diagnosis capabilities
 */

// Store prediction history
let predictionHistory = [];
let currentDifferentialDiagnoses = [];

// Initialize disease prediction module when document is ready
document.addEventListener("DOMContentLoaded", function () {
  // Initialize the main components
  initializeTabs();
  initializeSymptomSelector();
  initializePredictionButton();
  initializeSymptomCombos();
});

/**
 * Initialize tab functionality
 */
function initializeTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabPanels = document.querySelectorAll(".tab-panel");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      tabButtons.forEach((btn) => btn.classList.remove("active"));

      // Add active class to clicked button
      this.classList.add("active");

      // Hide all panels
      tabPanels.forEach((panel) => panel.classList.remove("active"));

      // Show panel corresponding to clicked button
      const panelId = this.id.replace("-tab", "-panel");
      document.getElementById(panelId)?.classList.add("active");
    });
  });
}

/**
 * Initialize the symptom selector with Select2
 */
function initializeSymptomSelector() {
  // Fetch all available symptoms for the selector
  fetch("/api/disease-prediction/symptoms")
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Sort symptoms alphabetically
        const symptoms = data.symptoms.sort();

        // Create the Select2 dropdown
        $("#symptoms-select").select2({
          placeholder: "Type or select symptoms...",
          tags: false,
          data: symptoms.map((symptom) => ({ id: symptom, text: symptom })),
          width: "100%",
        });

        // Handle selection changes
        $("#symptoms-select").on("change", updateSelectedSymptoms);
      } else {
        console.error("Error fetching symptoms:", data.error);
      }
    })
    .catch((error) => {
      console.error("Error fetching symptoms:", error);
    });
}

/**
 * Update the selected symptoms display
 */
function updateSelectedSymptoms() {
  const selectedSymptoms = $("#symptoms-select").select2("data");
  const container = document.getElementById("selected-symptoms-list");

  if (!container) return;

  if (selectedSymptoms.length === 0) {
    container.innerHTML =
      '<p class="no-symptoms-message">No symptoms selected</p>';
    return;
  }

  container.innerHTML = "";

  selectedSymptoms.forEach((symptom) => {
    const tag = document.createElement("div");
    tag.className = "symptom-tag";
    tag.innerHTML = `
            ${symptom.text}
            <span class="remove-symptom" data-symptom="${symptom.id}">×</span>
        `;
    container.appendChild(tag);
  });

  // Add event listeners to remove buttons
  const removeButtons = container.querySelectorAll(".remove-symptom");
  removeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const symptomToRemove = this.getAttribute("data-symptom");

      // Get current selections
      const selections = $("#symptoms-select").select2("data");

      // Remove the symptom
      const filtered = selections.filter((s) => s.id !== symptomToRemove);

      // Set the new selection
      const newSelections = filtered.map((s) => s.id);
      $("#symptoms-select").val(newSelections).trigger("change");
    });
  });

  // Enable/disable predict button based on selections
  const predictButton = document.getElementById("predict-button");
  if (predictButton) {
    predictButton.disabled = selectedSymptoms.length === 0;
  }
}

/**
 * Initialize the predict button event listener
 */
function initializePredictionButton() {
  const predictButton = document.getElementById("predict-button");
  if (!predictButton) return;

  predictButton.addEventListener("click", function () {
    const selectedSymptoms = $("#symptoms-select")
      .select2("data")
      .map((s) => s.id);

    if (selectedSymptoms.length === 0) {
      alert("Please select at least one symptom before prediction.");
      return;
    }

    predictDisease(selectedSymptoms);
  });
}

/**
 * Initialize symptom combination quick-selectors
 */
function initializeSymptomCombos() {
  const combos = document.querySelectorAll(".symptom-combo");

  combos.forEach((combo) => {
    combo.addEventListener("click", function () {
      const symptoms = this.getAttribute("data-symptoms")
        .split(",")
        .map((s) => s.trim());

      // Update the Select2 dropdown with these symptoms
      $("#symptoms-select").val(symptoms).trigger("change");
    });
  });
}

/**
 * Predict disease based on selected symptoms
 * Enhanced to support differential diagnoses
 */
function predictDisease(symptoms) {
  const resultsContainer = document.getElementById("prediction-results");
  if (!resultsContainer) return;

  // Show loading state
  resultsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Analyzing symptoms and generating differential diagnoses...</p>
        </div>
    `;

  // Send to server with number of differential diagnoses to return
  fetch("/api/disease-prediction/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symptoms: symptoms,
      num_diagnoses: 5, // Request 5 differential diagnoses
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Store the differential diagnoses for later use
      if (data.success && data.differential_diagnoses) {
        currentDifferentialDiagnoses = data.differential_diagnoses;
      }

      // Display the results
      displayPredictionResults(data);

      // Add to history if prediction was successful
      if (data.success) {
        predictionHistory.unshift(data);
        updatePredictionHistory();
      }
    })
    .catch((error) => {
      console.error("Error predicting disease:", error);

      resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error analyzing symptoms. Please try again.</p>
            </div>
        `;
    });
}

/**
 * Format confidence percentage for display
 */
function formatConfidence(confidence) {
  return (confidence * 100).toFixed(1) + "%";
}

/**
 * Get confidence level class based on percentage
 */
function getConfidenceClass(confidence) {
  if (confidence >= 0.7) return "high-confidence";
  if (confidence >= 0.4) return "medium-confidence";
  return "low-confidence";
}

/**
 * Get confidence level label
 */
function getConfidenceLabel(confidence) {
  if (confidence >= 0.7) return "High";
  if (confidence >= 0.4) return "Medium";
  return "Low";
}

/**
 * Display disease prediction results with differential diagnoses
 */
function displayPredictionResults(data) {
  const resultsContainer = document.getElementById("prediction-results");
  if (!resultsContainer) return;

  // Check if prediction was successful
  if (!data.success) {
    resultsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error: ${data.error || "Prediction failed"}</p>
            </div>
        `;

    // If there were unrecognized symptoms, show them
    if (data.unrecognized_symptoms && data.unrecognized_symptoms.length > 0) {
      resultsContainer.innerHTML += `
                <div class="unrecognized-symptoms">
                    <p>The following symptoms were not recognized:</p>
                    <ul>
                        ${data.unrecognized_symptoms
                          .map((s) => `<li>${s}</li>`)
                          .join("")}
                    </ul>
                    <p>Please check the spelling or select from the suggested symptoms.</p>
                </div>
            `;
    }

    return;
  }

  // Get prediction data
  const disease = data.predicted_disease;
  const description = data.description;
  const precautions = data.precautions || [];
  const medications = data.medications || [];
  const diet = data.diet || [];
  const workout = data.workout || [];
  const correctedSymptoms = data.corrected_symptoms || [];
  const differentialDiagnoses = data.differential_diagnoses || [];

  // Create the disease icon based on the disease type
  let diseaseIcon = "user-md";

  // Determine appropriate icon based on disease name (simplified logic)
  if (
    disease.toLowerCase().includes("cold") ||
    disease.toLowerCase().includes("flu") ||
    disease.toLowerCase().includes("fever") ||
    disease.toLowerCase().includes("pneumonia")
  ) {
    diseaseIcon = "lungs";
  } else if (
    disease.toLowerCase().includes("heart") ||
    disease.toLowerCase().includes("blood")
  ) {
    diseaseIcon = "heartbeat";
  } else if (
    disease.toLowerCase().includes("stomach") ||
    disease.toLowerCase().includes("liver") ||
    disease.toLowerCase().includes("gastro") ||
    disease.toLowerCase().includes("hepatitis")
  ) {
    diseaseIcon = "stomach";
  } else if (
    disease.toLowerCase().includes("skin") ||
    disease.toLowerCase().includes("rash") ||
    disease.toLowerCase().includes("pox")
  ) {
    diseaseIcon = "allergies";
  } else if (disease.toLowerCase().includes("diabetes")) {
    diseaseIcon = "syringe";
  } else if (
    disease.toLowerCase().includes("brain") ||
    disease.toLowerCase().includes("neuro") ||
    disease.toLowerCase().includes("migraine")
  ) {
    diseaseIcon = "brain";
  } else if (disease.toLowerCase().includes("thyroid")) {
    diseaseIcon = "shield-virus";
  }

  // Get the primary confidence score
  const primaryConfidence =
    differentialDiagnoses.length > 0
      ? differentialDiagnoses.find((d) => d.disease === disease)?.confidence ||
        0
      : 0;

  // Generate HTML for the results
  let html = `
        <div class="prediction-result">
            <div class="prediction-header">
                <div class="disease-icon">
                    <i class="fas fa-${diseaseIcon}"></i>
                </div>
                <div>
                    <h4>${disease}</h4>
                    <p>Based on ${correctedSymptoms.length} symptoms</p>
                </div>
                <div class="confidence-badge ${getConfidenceClass(
                  primaryConfidence
                )}">
                    AI Confidence: ${getConfidenceLabel(
                      primaryConfidence
                    )} (${formatConfidence(primaryConfidence)})
                </div>
            </div>
            
            <!-- Differential Diagnosis Section -->
            <div class="differential-diagnosis-section">
                <h5><i class="fas fa-stethoscope"></i> Differential Diagnosis</h5>
                <p class="differential-note">The AI has identified the following potential conditions based on your symptoms:</p>
                
                <div class="differential-diagnoses-list">
                    ${differentialDiagnoses
                      .map(
                        (diagnosis, index) => `
                        <div class="differential-diagnosis-item ${
                          index === 0 ? "primary-diagnosis" : ""
                        }">
                            <div class="diagnosis-info">
                                <div class="diagnosis-name">${
                                  diagnosis.disease
                                }</div>
                                <div class="diagnosis-confidence-bar">
                                    <div class="confidence-fill ${getConfidenceClass(
                                      diagnosis.confidence
                                    )}" 
                                         style="width: ${
                                           diagnosis.confidence * 100
                                         }%"></div>
                                </div>
                                <div class="diagnosis-confidence-value ${getConfidenceClass(
                                  diagnosis.confidence
                                )}">
                                    ${formatConfidence(diagnosis.confidence)}
                                </div>
                            </div>
                            <button class="btn-view-details" data-disease="${
                              diagnosis.disease
                            }">
                                View Details
                            </button>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                
                <div class="differential-explanation">
                    <p><i class="fas fa-info-circle"></i> <strong>What is a differential diagnosis?</strong> 
                    A differential diagnosis is a list of possible conditions that could explain a patient's 
                    symptoms, ranked by probability. This more accurately represents how medical diagnostics work 
                    in real clinical settings.</p>
                </div>
            </div>
            
            <div class="prediction-details">
                <!-- Disease Description -->
                <div class="prediction-section">
                    <h5><i class="fas fa-info-circle"></i> Description</h5>
                    <p>${
                      description ||
                      "No description available for this disease."
                    }</p>
                </div>
                
                <!-- Precautions -->
                <div class="prediction-section">
                    <h5><i class="fas fa-shield-alt"></i> Recommended Precautions</h5>
                    ${
                      precautions.length > 0
                        ? `<ul class="recommendation-list">
                            ${precautions.map((p) => `<li>${p}</li>`).join("")}
                        </ul>`
                        : "<p>No specific precautions available for this disease.</p>"
                    }
                </div>
                
                <!-- Medications -->
                <div class="prediction-section">
                    <h5><i class="fas fa-pills"></i> Potential Medications</h5>
                    ${
                      medications.length > 0
                        ? `<div class="medication-list">
                            ${medications
                              .map(
                                (m) =>
                                  `<div class="medication-item"><i class="fas fa-capsules"></i>${m}</div>`
                              )
                              .join("")}
                        </div>`
                        : "<p>No specific medications information available.</p>"
                    }
                    <p class="medication-note"><small><i class="fas fa-info-circle"></i> Medication should only be taken as prescribed by a healthcare professional.</small></p>
                </div>
                
                <!-- Diet Recommendations -->
                <div class="prediction-section">
                    <h5><i class="fas fa-utensils"></i> Dietary Recommendations</h5>
                    ${
                      diet.length > 0
                        ? `<div class="diet-list">
                            ${diet
                              .map(
                                (d) =>
                                  `<div class="diet-item"><i class="fas fa-apple-alt"></i>${d}</div>`
                              )
                              .join("")}
                        </div>`
                        : "<p>No specific diet recommendations available for this disease.</p>"
                    }
                </div>
                
                <!-- Exercise Recommendations -->
                <div class="prediction-section">
                    <h5><i class="fas fa-running"></i> Exercise Recommendations</h5>
                    ${
                      workout.length > 0
                        ? `<div class="workout-list">
                            ${workout
                              .map(
                                (w) =>
                                  `<div class="workout-item"><i class="fas fa-dumbbell"></i>${w}</div>`
                              )
                              .join("")}
                        </div>`
                        : "<p>No specific exercise recommendations available for this disease.</p>"
                    }
                </div>
                
                <!-- Disclaimer -->
                <div class="disclaimer-note">
                    <i class="fas fa-exclamation-triangle"></i>
                    This is an AI-assisted prediction based on your symptoms and should not replace professional medical diagnosis. Please consult a healthcare provider for proper diagnosis and treatment.
                </div>
            </div>
        </div>
    `;

  // Update the container
  resultsContainer.innerHTML = html;

  // Add event listeners to the "View Details" buttons
  const viewDetailsButtons =
    resultsContainer.querySelectorAll(".btn-view-details");
  viewDetailsButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const diseaseName = this.getAttribute("data-disease");
      loadDiseaseDetails(diseaseName);
    });
  });
}

/**
 * Load details for a specific disease from the differential diagnosis
 */
function loadDiseaseDetails(diseaseName) {
  const resultsContainer = document.getElementById("prediction-results");
  if (!resultsContainer) return;

  // Show loading state
  resultsContainer.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading details for ${diseaseName}...</p>
        </div>
    `;

  // Fetch the disease details
  fetch(
    `/api/disease-prediction/disease-info/${encodeURIComponent(diseaseName)}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (!data.success) {
        throw new Error(data.error || "Failed to load disease information");
      }

      // Get disease information
      const disease = data.disease;
      const description = data.description;
      const precautions = data.precautions || [];
      const medications = data.medications || [];
      const diet = data.diet || [];
      const workout = data.workout || [];

      // Find confidence from stored differential diagnoses
      const diagnosisInfo = currentDifferentialDiagnoses.find(
        (d) => d.disease === disease
      );
      const confidence = diagnosisInfo ? diagnosisInfo.confidence : 0;

      // Create the disease icon based on the disease type
      let diseaseIcon = "user-md";

      // Determine appropriate icon based on disease name (simplified logic)
      if (
        disease.toLowerCase().includes("cold") ||
        disease.toLowerCase().includes("flu") ||
        disease.toLowerCase().includes("fever") ||
        disease.toLowerCase().includes("pneumonia")
      ) {
        diseaseIcon = "lungs";
      } else if (
        disease.toLowerCase().includes("heart") ||
        disease.toLowerCase().includes("blood")
      ) {
        diseaseIcon = "heartbeat";
      } else if (
        disease.toLowerCase().includes("stomach") ||
        disease.toLowerCase().includes("liver") ||
        disease.toLowerCase().includes("gastro") ||
        disease.toLowerCase().includes("hepatitis")
      ) {
        diseaseIcon = "stomach";
      } else if (
        disease.toLowerCase().includes("skin") ||
        disease.toLowerCase().includes("rash") ||
        disease.toLowerCase().includes("pox")
      ) {
        diseaseIcon = "allergies";
      } else if (disease.toLowerCase().includes("diabetes")) {
        diseaseIcon = "syringe";
      } else if (
        disease.toLowerCase().includes("brain") ||
        disease.toLowerCase().includes("neuro") ||
        disease.toLowerCase().includes("migraine")
      ) {
        diseaseIcon = "brain";
      } else if (disease.toLowerCase().includes("thyroid")) {
        diseaseIcon = "shield-virus";
      }

      // Generate HTML for disease details
      let html = `
                <div class="prediction-result">
                    <div class="prediction-header">
                        <div class="disease-icon">
                            <i class="fas fa-${diseaseIcon}"></i>
                        </div>
                        <div>
                            <h4>${disease}</h4>
                            <p class="differential-note">From differential diagnosis</p>
                        </div>
                        <div class="confidence-badge ${getConfidenceClass(
                          confidence
                        )}">
                            AI Confidence: ${formatConfidence(confidence)}
                        </div>
                    </div>
                    
                    <!-- Return to differential diagnosis link -->
                    <div class="return-link">
                        <a href="#" id="back-to-differential"><i class="fas fa-arrow-left"></i> Back to Differential Diagnosis</a>
                    </div>
                    
                    <div class="prediction-details">
                        <!-- Disease Description -->
                        <div class="prediction-section">
                            <h5><i class="fas fa-info-circle"></i> Description</h5>
                            <p>${
                              description ||
                              "No description available for this disease."
                            }</p>
                        </div>
                        
                        <!-- Precautions -->
                        <div class="prediction-section">
                            <h5><i class="fas fa-shield-alt"></i> Recommended Precautions</h5>
                            ${
                              precautions.length > 0
                                ? `<ul class="recommendation-list">
                                    ${precautions
                                      .map((p) => `<li>${p}</li>`)
                                      .join("")}
                                </ul>`
                                : "<p>No specific precautions available for this disease.</p>"
                            }
                        </div>
                        
                        <!-- Medications -->
                        <div class="prediction-section">
                            <h5><i class="fas fa-pills"></i> Potential Medications</h5>
                            ${
                              medications.length > 0
                                ? `<div class="medication-list">
                                    ${medications
                                      .map(
                                        (m) =>
                                          `<div class="medication-item"><i class="fas fa-capsules"></i>${m}</div>`
                                      )
                                      .join("")}
                                </div>`
                                : "<p>No specific medications information available.</p>"
                            }
                            <p class="medication-note"><small><i class="fas fa-info-circle"></i> Medication should only be taken as prescribed by a healthcare professional.</small></p>
                        </div>
                        
                        <!-- Diet Recommendations -->
                        <div class="prediction-section">
                            <h5><i class="fas fa-utensils"></i> Dietary Recommendations</h5>
                            ${
                              diet.length > 0
                                ? `<div class="diet-list">
                                    ${diet
                                      .map(
                                        (d) =>
                                          `<div class="diet-item"><i class="fas fa-apple-alt"></i>${d}</div>`
                                      )
                                      .join("")}
                                </div>`
                                : "<p>No specific diet recommendations available for this disease.</p>"
                            }
                        </div>
                        
                        <!-- Exercise Recommendations -->
                        <div class="prediction-section">
                            <h5><i class="fas fa-running"></i> Exercise Recommendations</h5>
                            ${
                              workout.length > 0
                                ? `<div class="workout-list">
                                    ${workout
                                      .map(
                                        (w) =>
                                          `<div class="workout-item"><i class="fas fa-dumbbell"></i>${w}</div>`
                                      )
                                      .join("")}
                                </div>`
                                : "<p>No specific exercise recommendations available for this disease.</p>"
                            }
                        </div>
                        
                        <!-- Disclaimer -->
                        <div class="disclaimer-note">
                            <i class="fas fa-exclamation-triangle"></i>
                            This is an AI-assisted prediction based on your symptoms and should not replace professional medical diagnosis. Please consult a healthcare provider for proper diagnosis and treatment.
                        </div>
                    </div>
                </div>
            `;

      // Update the results container
      resultsContainer.innerHTML = html;

      // Add event listener to the "Back to Differential Diagnosis" link
      const backLink = document.getElementById("back-to-differential");
      if (backLink) {
        backLink.addEventListener("click", function (e) {
          e.preventDefault();

          // Re-predict with current symptoms to show differential diagnosis
          const selectedSymptoms = $("#symptoms-select")
            .select2("data")
            .map((s) => s.id);
          predictDisease(selectedSymptoms);
        });
      }
    })
    .catch((error) => {
      console.error("Error loading disease details:", error);

      resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading disease details. Please try again.</p>
                    <button id="back-to-differential" class="btn-secondary">
                        <i class="fas fa-arrow-left"></i> Back to Previous Results
                    </button>
                </div>
            `;

      // Add event listener to the back button
      const backButton = document.getElementById("back-to-differential");
      if (backButton) {
        backButton.addEventListener("click", function () {
          const selectedSymptoms = $("#symptoms-select")
            .select2("data")
            .map((s) => s.id);
          predictDisease(selectedSymptoms);
        });
      }
    });
}

/**
 * Update the prediction history panel
 */
function updatePredictionHistory() {
  const historyContainer = document.getElementById("prediction-history-list");
  if (!historyContainer) return;

  if (predictionHistory.length === 0) {
    historyContainer.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <p>No prediction history available for this patient</p>
            </div>
        `;
    return;
  }

  historyContainer.innerHTML = "";

  predictionHistory.forEach((prediction, index) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";

    const timestamp = prediction.timestamp
      ? new Date(prediction.timestamp).toLocaleString()
      : "Unknown time";

    // Get primary disease and its confidence
    const primaryDisease = prediction.predicted_disease;
    let primaryConfidence = 0;

    if (
      prediction.differential_diagnoses &&
      prediction.differential_diagnoses.length > 0
    ) {
      const primaryDiagnosis = prediction.differential_diagnoses.find(
        (d) => d.disease === primaryDisease
      );
      if (primaryDiagnosis) {
        primaryConfidence = primaryDiagnosis.confidence;
      }
    }

    // Create differential diagnosis badges for the top 3 conditions
    let differentialBadges = "";
    if (
      prediction.differential_diagnoses &&
      prediction.differential_diagnoses.length > 0
    ) {
      differentialBadges = `
                <div class="history-differentials">
                    ${prediction.differential_diagnoses
                      .slice(0, 3)
                      .map(
                        (diagnosis) => `
                        <div class="history-differential-badge ${getConfidenceClass(
                          diagnosis.confidence
                        )}">
                            ${diagnosis.disease} (${formatConfidence(
                          diagnosis.confidence
                        )})
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `;
    }

    historyItem.innerHTML = `
            <div class="history-item-header">
                <h4>${primaryDisease}</h4>
                <span class="history-timestamp">${timestamp}</span>
            </div>
            
            <div class="history-confidence ${getConfidenceClass(
              primaryConfidence
            )}">
                Confidence: ${formatConfidence(primaryConfidence)}
            </div>
            
            ${differentialBadges}
            
            <div class="history-symptoms">
                ${prediction.corrected_symptoms
                  .map((s) => `<div class="history-symptom">${s}</div>`)
                  .join("")}
            </div>
            
            <button class="history-view-details" data-index="${index}">
                <i class="fas fa-eye"></i> View Details
            </button>
        `;

    historyContainer.appendChild(historyItem);
  });

  // Add event listeners to view details buttons
  const viewButtons = historyContainer.querySelectorAll(
    ".history-view-details"
  );
  viewButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const index = parseInt(this.getAttribute("data-index"));

      // Switch to the disease prediction tab
      document.getElementById("disease-prediction-tab").click();

      // Update the current differential diagnoses with the historical ones
      if (predictionHistory[index].differential_diagnoses) {
        currentDifferentialDiagnoses =
          predictionHistory[index].differential_diagnoses;
      }

      // Display the selected prediction
      displayPredictionResults(predictionHistory[index]);

      // Update the symptom selector to match
      const symptoms = predictionHistory[index].corrected_symptoms;
      $("#symptoms-select").val(symptoms).trigger("change");
    });
  });
}