/**
 * Simulator.js - Patient Scenario Simulator for AI Healthcare Monitoring System
 * This script manages the simulation of patient scenarios, vital sign manipulation,
 * and visual display of the healthcare monitoring system's AI responses.
 */

// Simulator state
const SimulatorState = {
  // Currently selected scenario
  currentScenario: null,
  // Simulation status
  isRunning: false,
  isPaused: false,
  simulationTime: 0,
  simulationSpeed: 1,
  // Current vital signs
  currentVitals: {
    heartRate: 75,
    bloodPressure: [120, 80],
    respiratoryRate: 16,
    oxygenSaturation: 98,
    temperature: 98.6,
    ecgPattern: "normal",
  },
  // For manual override mode
  manualMode: false,
  // For handling the simulation loop
  simulationInterval: null,
  // Risk assessment
  riskScore: 0.05,
  riskFactors: [],
};

// ECG visualization setup
const ECGVisualizer = {
  chart: null,
  data: [],

  // Initialize the ECG chart
  initialize: function () {
    const ctx = document.getElementById("monitor-ecg").getContext("2d");

    this.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: Array(100).fill(""),
        datasets: [
          {
            label: "ECG",
            data: Array(100).fill(0),
            borderColor: "#4ACF50",
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0,
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: false,
          },
          y: {
            display: false,
            min: -0.5,
            max: 1.5,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
        animation: {
          duration: 0,
        },
      },
    });
  },

  // Update the ECG with a new pattern
  updateECG: function (patternType) {
    // Generate ECG data based on the pattern type
    this.data = this.generateECGPattern(
      patternType,
      SimulatorState.currentVitals.heartRate
    );

    // Update the chart
    this.chart.data.datasets[0].data = this.data.slice(0, 100);
    this.chart.update();
  },

  // Generate ECG pattern based on type and heart rate
  generateECGPattern: function (patternType, heartRate) {
    // Convert heart rate to RR interval in samples
    // For our simulation, we'll use 100 samples for a normal heart rate of 75 BPM
    const rrInterval = Math.round((75 * 100) / heartRate);
    let ecgPattern = [];

    switch (patternType) {
      case "normal":
        // Normal sinus rhythm
        ecgPattern = this.generateNormalSinus(rrInterval);
        break;
      case "tachycardia":
        // Tachycardia - faster but regular rhythm
        ecgPattern = this.generateNormalSinus(rrInterval);
        break;
      case "bradycardia":
        // Bradycardia - slower but regular rhythm
        ecgPattern = this.generateNormalSinus(rrInterval);
        break;
      case "afib":
        // Atrial fibrillation - irregular rhythm with no P waves
        ecgPattern = this.generateAFib(rrInterval);
        break;
      case "pvc":
        // Premature ventricular contractions - occasional abnormal beats
        ecgPattern = this.generatePVC(rrInterval);
        break;
      case "st_elevation":
        // ST elevation - potential MI indicator
        ecgPattern = this.generateSTElevation(rrInterval);
        break;
      case "st_depression":
        // ST depression - potential ischemia indicator
        ecgPattern = this.generateSTDepression(rrInterval);
        break;
      default:
        // Default to normal rhythm if unknown pattern
        ecgPattern = this.generateNormalSinus(rrInterval);
    }

    return ecgPattern;
  },

  // Generate a normal sinus rhythm pattern
  generateNormalSinus: function (rrInterval) {
    const pattern = [];
    const baselineNoise = 0.02;

    // Generate multiple heartbeats to fill the display
    for (let beat = 0; beat < 5; beat++) {
      // P wave (atrial depolarization)
      for (let i = 0; i < 10; i++) {
        const pWave = 0.15 * Math.sin((Math.PI * i) / 10);
        pattern.push(pWave + (Math.random() - 0.5) * baselineNoise);
      }

      // PR segment (conduction delay)
      for (let i = 0; i < 5; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // QRS complex (ventricular depolarization)
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise); // Q wave
      pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2); // R wave
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise); // S wave

      // ST segment
      for (let i = 0; i < 8; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // T wave (ventricular repolarization)
      for (let i = 0; i < 10; i++) {
        const tWave = 0.2 * Math.sin((Math.PI * i) / 10);
        pattern.push(tWave + (Math.random() - 0.5) * baselineNoise);
      }

      // TP segment (rest)
      const remainingPoints = rrInterval - (pattern.length % rrInterval);
      for (let i = 0; i < remainingPoints; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }
    }

    return pattern;
  },

  // Generate atrial fibrillation pattern
  generateAFib: function (baseRRInterval) {
    const pattern = [];
    const baselineNoise = 0.03;

    // Generate multiple heartbeats with irregular RR intervals
    for (let beat = 0; beat < 8; beat++) {
      // Random variation in RR interval for irregularity
      const rrVariation = Math.random() * 20 - 10;
      const rrInterval = Math.max(25, baseRRInterval + rrVariation);

      // No distinct P waves in AFib, just fibrillatory waves
      for (let i = 0; i < 15; i++) {
        const fWave = 0.05 * Math.sin((Math.PI * i) / 5 + Math.random());
        pattern.push(fWave + (Math.random() - 0.5) * baselineNoise * 2);
      }

      // QRS complex (ventricular depolarization)
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise); // Q wave
      pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2); // R wave
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise); // S wave

      // ST segment
      for (let i = 0; i < 8; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // T wave (ventricular repolarization)
      for (let i = 0; i < 10; i++) {
        const tWave = 0.2 * Math.sin((Math.PI * i) / 10);
        pattern.push(tWave + (Math.random() - 0.5) * baselineNoise);
      }

      // Remaining segment until next beat
      const remainingPoints = rrInterval - (pattern.length % rrInterval);
      for (let i = 0; i < remainingPoints; i++) {
        const fWave = 0.05 * Math.sin((Math.PI * i) / 3 + Math.random());
        pattern.push(fWave + (Math.random() - 0.5) * baselineNoise * 2);
      }
    }

    return pattern;
  },

  // Generate PVC pattern (premature ventricular contraction)
  generatePVC: function (rrInterval) {
    const pattern = [];
    const baselineNoise = 0.02;

    // First generate 2 normal beats
    for (let beat = 0; beat < 2; beat++) {
      // P wave
      for (let i = 0; i < 10; i++) {
        const pWave = 0.15 * Math.sin((Math.PI * i) / 10);
        pattern.push(pWave + (Math.random() - 0.5) * baselineNoise);
      }

      // PR segment
      for (let i = 0; i < 5; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // QRS complex
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);
      pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2);
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);

      // ST segment
      for (let i = 0; i < 8; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // T wave
      for (let i = 0; i < 10; i++) {
        const tWave = 0.2 * Math.sin((Math.PI * i) / 10);
        pattern.push(tWave + (Math.random() - 0.5) * baselineNoise);
      }

      // TP segment
      const remainingPoints = rrInterval - (pattern.length % rrInterval);
      for (let i = 0; i < remainingPoints; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }
    }

    // Now add a PVC
    // No P wave before a PVC

    // Wide, bizarre QRS complex
    pattern.push(-0.2 + (Math.random() - 0.5) * baselineNoise); // Deep Q
    pattern.push(1.5 + (Math.random() - 0.5) * baselineNoise * 2); // Tall R
    pattern.push(-0.3 + (Math.random() - 0.5) * baselineNoise); // Deep S
    pattern.push(-0.2 + (Math.random() - 0.5) * baselineNoise); // Wide complex
    pattern.push(-0.1 + (Math.random() - 0.5) * baselineNoise); // Wide complex

    // ST segment and T wave (often in opposite direction)
    for (let i = 0; i < 15; i++) {
      const tWave = -0.3 * Math.sin((Math.PI * i) / 15);
      pattern.push(tWave + (Math.random() - 0.5) * baselineNoise);
    }

    // Compensatory pause
    for (let i = 0; i < rrInterval * 1.5; i++) {
      pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
    }

    // Add another normal beat
    // P wave
    for (let i = 0; i < 10; i++) {
      const pWave = 0.15 * Math.sin((Math.PI * i) / 10);
      pattern.push(pWave + (Math.random() - 0.5) * baselineNoise);
    }

    // PR segment
    for (let i = 0; i < 5; i++) {
      pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
    }

    // QRS complex
    pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);
    pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2);
    pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);

    // ST segment
    for (let i = 0; i < 8; i++) {
      pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
    }

    // T wave
    for (let i = 0; i < 10; i++) {
      const tWave = 0.2 * Math.sin((Math.PI * i) / 10);
      pattern.push(tWave + (Math.random() - 0.5) * baselineNoise);
    }

    return pattern;
  },

  // Generate ST elevation pattern (potential MI)
  generateSTElevation: function (rrInterval) {
    const pattern = [];
    const baselineNoise = 0.02;

    // Generate multiple heartbeats
    for (let beat = 0; beat < 5; beat++) {
      // P wave
      for (let i = 0; i < 10; i++) {
        const pWave = 0.15 * Math.sin((Math.PI * i) / 10);
        pattern.push(pWave + (Math.random() - 0.5) * baselineNoise);
      }

      // PR segment
      for (let i = 0; i < 5; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // QRS complex
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);
      pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2);
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);

      // ST segment - elevated
      for (let i = 0; i < 8; i++) {
        pattern.push(0.2 + (Math.random() - 0.5) * baselineNoise); // ST elevation
      }

      // T wave
      for (let i = 0; i < 10; i++) {
        const tWave = 0.25 * Math.sin((Math.PI * i) / 10); // Hyperacute T wave
        pattern.push(0.2 + tWave + (Math.random() - 0.5) * baselineNoise);
      }

      // TP segment
      const remainingPoints = rrInterval - (pattern.length % rrInterval);
      for (let i = 0; i < remainingPoints; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }
    }

    return pattern;
  },

  // Generate ST depression pattern (potential ischemia)
  generateSTDepression: function (rrInterval) {
    const pattern = [];
    const baselineNoise = 0.02;

    // Generate multiple heartbeats
    for (let beat = 0; beat < 5; beat++) {
      // P wave
      for (let i = 0; i < 10; i++) {
        const pWave = 0.15 * Math.sin((Math.PI * i) / 10);
        pattern.push(pWave + (Math.random() - 0.5) * baselineNoise);
      }

      // PR segment
      for (let i = 0; i < 5; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }

      // QRS complex
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);
      pattern.push(1 + (Math.random() - 0.5) * baselineNoise * 2);
      pattern.push(-0.05 + (Math.random() - 0.5) * baselineNoise);

      // ST segment - depressed
      for (let i = 0; i < 8; i++) {
        pattern.push(-0.15 + (Math.random() - 0.5) * baselineNoise); // ST depression
      }

      // T wave
      for (let i = 0; i < 10; i++) {
        const tWave = 0.2 * Math.sin((Math.PI * i) / 10);
        pattern.push(-0.05 + tWave + (Math.random() - 0.5) * baselineNoise);
      }

      // TP segment
      const remainingPoints = rrInterval - (pattern.length % rrInterval);
      for (let i = 0; i < remainingPoints; i++) {
        pattern.push(0 + (Math.random() - 0.5) * baselineNoise);
      }
    }

    return pattern;
  },
};

// Main simulator controller
const SimulatorController = {
  // Initialize the simulator
  initialize: function () {
    this.loadScenarios();
    this.setupEventListeners();
    this.updateControlsDisplay();
    ECGVisualizer.initialize();
    ECGVisualizer.updateECG("normal");
  },

  // Load available scenarios into the UI
  loadScenarios: function () {
    const scenarioCardsContainer = document.getElementById("scenario-cards");
    scenarioCardsContainer.innerHTML = "";

    PatientScenarios.forEach((scenario) => {
      const card = document.createElement("div");
      card.classList.add("scenario-card", scenario.category);
      card.dataset.scenarioId = scenario.id;

      card.innerHTML = `
                <div class="scenario-icon"><i class="fas ${scenario.icon}"></i></div>
                <div class="scenario-title">${scenario.title}</div>
                <div class="scenario-description">${scenario.description}</div>
            `;

      card.addEventListener("click", () => {
        this.selectScenario(scenario.id);
      });

      scenarioCardsContainer.appendChild(card);
    });
  },

  // Set up event listeners for UI controls
  setupEventListeners: function () {
    // Simulation control buttons
    document
      .getElementById("start-simulation")
      .addEventListener("click", () => this.startSimulation());
    document
      .getElementById("pause-simulation")
      .addEventListener("click", () => this.pauseSimulation());
    document
      .getElementById("reset-simulation")
      .addEventListener("click", () => this.resetSimulation());

    // Simulation speed buttons
    document
      .getElementById("speed-slow")
      .addEventListener("click", () => this.setSimulationSpeed(0.5));
    document
      .getElementById("speed-normal")
      .addEventListener("click", () => this.setSimulationSpeed(1));
    document
      .getElementById("speed-fast")
      .addEventListener("click", () => this.setSimulationSpeed(2));
    document
      .getElementById("speed-very-fast")
      .addEventListener("click", () => this.setSimulationSpeed(5));

    // Manual control sliders
    const sliderIds = [
      "heart-rate",
      "systolic",
      "diastolic",
      "respiratory",
      "oxygen",
      "temperature",
    ];
    sliderIds.forEach((id) => {
      const slider = document.getElementById(`${id}-control`);
      const valueDisplay = document.getElementById(`${id}-value`);

      slider.addEventListener("input", () => {
        // Update the display value
        if (id === "heart-rate") {
          valueDisplay.textContent = `${slider.value} BPM`;
        } else if (id === "systolic" || id === "diastolic") {
          valueDisplay.textContent = `${slider.value} mmHg`;
        } else if (id === "respiratory") {
          valueDisplay.textContent = `${slider.value} breaths/min`;
        } else if (id === "oxygen") {
          valueDisplay.textContent = `${slider.value} %`;
        } else if (id === "temperature") {
          valueDisplay.textContent = `${slider.value} °F`;
        }
      });
    });

    // ECG pattern selection
    document.getElementById("ecg-pattern").addEventListener("change", (e) => {
      const selectedPattern = e.target.value;
      ECGVisualizer.updateECG(selectedPattern);
    });

    // Apply manual changes button
    document.getElementById("apply-vitals").addEventListener("click", () => {
      this.applyManualVitals();
    });

    // Reset vitals button
    document.getElementById("reset-vitals").addEventListener("click", () => {
      this.resetVitalsToDefault();
    });
  },

  // Select a patient scenario
  selectScenario: function (scenarioId) {
    // Clear previous selection
    document.querySelectorAll(".scenario-card").forEach((card) => {
      card.classList.remove("selected");
    });

    // Add selected class to new scenario
    const selectedCard = document.querySelector(
      `.scenario-card[data-scenario-id="${scenarioId}"]`
    );
    if (selectedCard) {
      selectedCard.classList.add("selected");
    }

    // Set current scenario
    SimulatorState.currentScenario = ScenarioUtils.getScenarioById(scenarioId);

    // Reset simulation time
    SimulatorState.simulationTime = 0;

    // Update the clinical and AI explanations
    document.getElementById("clinical-explanation").innerHTML =
      SimulatorState.currentScenario.clinicalExplanation;
    document.getElementById("ai-explanation").innerHTML =
      SimulatorState.currentScenario.aiExplanation;

    // Reset controls to initial scenario values
    this.resetVitalsToScenario();
    this.updateControlsDisplay();

    // Update monitoring display
    this.updateMonitorDisplay();
  },

  // Start the simulation
  startSimulation: function () {
    if (!SimulatorState.currentScenario) {
      alert("Please select a scenario first.");
      return;
    }

    if (SimulatorState.isPaused) {
      // Resume from paused state
      SimulatorState.isPaused = false;
      document.getElementById("pause-simulation").textContent = "Pause";
      document.getElementById("pause-simulation").innerHTML =
        '<i class="fas fa-pause"></i> Pause';
    } else {
      // Start from beginning
      SimulatorState.simulationTime = 0;
      SimulatorState.manualMode = false; // Exit manual mode
    }

    SimulatorState.isRunning = true;

    // Update UI
    document.getElementById("start-simulation").disabled = true;
    document.getElementById("pause-simulation").disabled = false;
    document.getElementById("reset-simulation").disabled = false;

    // Start simulation loop
    if (SimulatorState.simulationInterval) {
      clearInterval(SimulatorState.simulationInterval);
    }

    SimulatorState.simulationInterval = setInterval(() => {
      this.simulationStep();
    }, 1000 / SimulatorState.simulationSpeed);
  },

  // Pause the simulation
  pauseSimulation: function () {
    if (!SimulatorState.isRunning) return;

    if (SimulatorState.isPaused) {
      // Resume
      SimulatorState.isPaused = false;
      document.getElementById("pause-simulation").innerHTML =
        '<i class="fas fa-pause"></i> Pause';

      // Restart the interval
      SimulatorState.simulationInterval = setInterval(() => {
        this.simulationStep();
      }, 1000 / SimulatorState.simulationSpeed);
    } else {
      // Pause
      SimulatorState.isPaused = true;
      document.getElementById("pause-simulation").innerHTML =
        '<i class="fas fa-play"></i> Resume';

      // Clear the interval
      if (SimulatorState.simulationInterval) {
        clearInterval(SimulatorState.simulationInterval);
        SimulatorState.simulationInterval = null;
      }
    }
  },

  // Reset the simulation
  resetSimulation: function () {
    // Stop the simulation
    if (SimulatorState.simulationInterval) {
      clearInterval(SimulatorState.simulationInterval);
      SimulatorState.simulationInterval = null;
    }

    // Reset state
    SimulatorState.isRunning = false;
    SimulatorState.isPaused = false;
    SimulatorState.simulationTime = 0;

    // Reset UI
    document.getElementById("start-simulation").disabled = false;
    document.getElementById("pause-simulation").disabled = true;
    document.getElementById("reset-simulation").disabled = true;
    document.getElementById("pause-simulation").innerHTML =
      '<i class="fas fa-pause"></i> Pause';

    // Reset vitals to initial scenario values
    this.resetVitalsToScenario();
    this.updateControlsDisplay();
    this.updateMonitorDisplay();
  },

  // Set simulation speed
  setSimulationSpeed: function (speed) {
    SimulatorState.simulationSpeed = speed;

    // Update UI to highlight selected speed
    document.querySelectorAll(".time-control-buttons .btn").forEach((btn) => {
      btn.classList.remove("btn-primary");
      btn.classList.add("btn-small");
    });

    let buttonId;
    switch (speed) {
      case 0.5:
        buttonId = "speed-slow";
        break;
      case 1:
        buttonId = "speed-normal";
        break;
      case 2:
        buttonId = "speed-fast";
        break;
      case 5:
        buttonId = "speed-very-fast";
        break;
    }

    document.getElementById(buttonId).classList.add("btn-primary");

    // If simulation is running, restart with new speed
    if (SimulatorState.isRunning && !SimulatorState.isPaused) {
      if (SimulatorState.simulationInterval) {
        clearInterval(SimulatorState.simulationInterval);
      }

      SimulatorState.simulationInterval = setInterval(() => {
        this.simulationStep();
      }, 1000 / SimulatorState.simulationSpeed);
    }
  },

  // Single simulation step
  simulationStep: function () {
    // Increment simulation time (in seconds)
    SimulatorState.simulationTime += 1;

    // Check if we've reached the end of the scenario
    const scenarioDuration = SimulatorState.currentScenario.duration * 60; // Convert minutes to seconds
    if (SimulatorState.simulationTime >= scenarioDuration) {
      // End the simulation
      this.resetSimulation();
      return;
    }

    // Update vitals based on simulation time
    if (!SimulatorState.manualMode) {
      const interpolatedVitals = ScenarioUtils.interpolateVitals(
        SimulatorState.currentScenario,
        SimulatorState.simulationTime
      );

      // Add some random noise for realism
      const vitalsWithNoise = ScenarioUtils.addNoise(interpolatedVitals);

      // Update current vitals
      SimulatorState.currentVitals = {
        heartRate: vitalsWithNoise.heartRate,
        bloodPressure: vitalsWithNoise.bloodPressure,
        respiratoryRate: vitalsWithNoise.respiratoryRate,
        oxygenSaturation: vitalsWithNoise.oxygenSaturation,
        temperature: vitalsWithNoise.temperature,
        ecgPattern: vitalsWithNoise.ecgPattern,
      };
    }

    // Calculate risk score based on vital signs
    this.calculateRiskScore();

    // Update UI displays
    this.updateControlsDisplay();
    this.updateMonitorDisplay();
    ECGVisualizer.updateECG(SimulatorState.currentVitals.ecgPattern);
  },

  // Apply manual vital sign changes
  applyManualVitals: function () {
    SimulatorState.manualMode = true;

    // Get values from sliders
    const heartRate = parseFloat(
      document.getElementById("heart-rate-control").value
    );
    const systolic = parseFloat(
      document.getElementById("systolic-control").value
    );
    const diastolic = parseFloat(
      document.getElementById("diastolic-control").value
    );
    const respiratory = parseFloat(
      document.getElementById("respiratory-control").value
    );
    const oxygen = parseFloat(document.getElementById("oxygen-control").value);
    const temperature = parseFloat(
      document.getElementById("temperature-control").value
    );
    const ecgPattern = document.getElementById("ecg-pattern").value;

    // Update current vitals
    SimulatorState.currentVitals = {
      heartRate: heartRate,
      bloodPressure: [systolic, diastolic],
      respiratoryRate: respiratory,
      oxygenSaturation: oxygen,
      temperature: temperature,
      ecgPattern: ecgPattern,
    };

    // Calculate risk score based on new vitals
    this.calculateRiskScore();

    // Update displays
    this.updateMonitorDisplay();
    ECGVisualizer.updateECG(ecgPattern);
  },

  // Reset vitals to default normal values
  resetVitalsToDefault: function () {
    document.getElementById("heart-rate-control").value = 75;
    document.getElementById("systolic-control").value = 120;
    document.getElementById("diastolic-control").value = 80;
    document.getElementById("respiratory-control").value = 16;
    document.getElementById("oxygen-control").value = 98;
    document.getElementById("temperature-control").value = 98.6;
    document.getElementById("ecg-pattern").value = "normal";

    // Update displayed values
    document.getElementById("heart-rate-value").textContent = "75 BPM";
    document.getElementById("systolic-value").textContent = "120 mmHg";
    document.getElementById("diastolic-value").textContent = "80 mmHg";
    document.getElementById("respiratory-value").textContent = "16 breaths/min";
    document.getElementById("oxygen-value").textContent = "98 %";
    document.getElementById("temperature-value").textContent = "98.6 °F";

    // If in manual mode, apply these changes
    if (SimulatorState.manualMode) {
      this.applyManualVitals();
    }
  },

  // Reset vitals to scenario starting values
  resetVitalsToScenario: function () {
    if (!SimulatorState.currentScenario) return;

    const initialVitals = SimulatorState.currentScenario.vitalSigns[0];

    // Update control values
    document.getElementById("heart-rate-control").value =
      initialVitals.heartRate;
    document.getElementById("systolic-control").value =
      initialVitals.bloodPressure[0];
    document.getElementById("diastolic-control").value =
      initialVitals.bloodPressure[1];
    document.getElementById("respiratory-control").value =
      initialVitals.respiratoryRate;
    document.getElementById("oxygen-control").value =
      initialVitals.oxygenSaturation;
    document.getElementById("temperature-control").value =
      initialVitals.temperature;
    document.getElementById("ecg-pattern").value = initialVitals.ecgPattern;

    // Update current vitals
    SimulatorState.currentVitals = {
      heartRate: initialVitals.heartRate,
      bloodPressure: initialVitals.bloodPressure.slice(),
      respiratoryRate: initialVitals.respiratoryRate,
      oxygenSaturation: initialVitals.oxygenSaturation,
      temperature: initialVitals.temperature,
      ecgPattern: initialVitals.ecgPattern,
    };

    // Calculate initial risk score
    this.calculateRiskScore();
  },

  // Update control display values
  updateControlsDisplay: function () {
    // Update slider display values
    document.getElementById(
      "heart-rate-value"
    ).textContent = `${SimulatorState.currentVitals.heartRate} BPM`;
    document.getElementById(
      "systolic-value"
    ).textContent = `${SimulatorState.currentVitals.bloodPressure[0]} mmHg`;
    document.getElementById(
      "diastolic-value"
    ).textContent = `${SimulatorState.currentVitals.bloodPressure[1]} mmHg`;
    document.getElementById(
      "respiratory-value"
    ).textContent = `${SimulatorState.currentVitals.respiratoryRate} breaths/min`;
    document.getElementById(
      "oxygen-value"
    ).textContent = `${SimulatorState.currentVitals.oxygenSaturation} %`;
    document.getElementById(
      "temperature-value"
    ).textContent = `${SimulatorState.currentVitals.temperature} °F`;

    // Update slider values
    document.getElementById("heart-rate-control").value =
      SimulatorState.currentVitals.heartRate;
    document.getElementById("systolic-control").value =
      SimulatorState.currentVitals.bloodPressure[0];
    document.getElementById("diastolic-control").value =
      SimulatorState.currentVitals.bloodPressure[1];
    document.getElementById("respiratory-control").value =
      SimulatorState.currentVitals.respiratoryRate;
    document.getElementById("oxygen-control").value =
      SimulatorState.currentVitals.oxygenSaturation;
    document.getElementById("temperature-control").value =
      SimulatorState.currentVitals.temperature;
    document.getElementById("ecg-pattern").value =
      SimulatorState.currentVitals.ecgPattern;
  },

  // Update monitor display
  updateMonitorDisplay: function () {
    // Update vital signs display
    document.getElementById(
      "monitor-hr"
    ).textContent = `${SimulatorState.currentVitals.heartRate} BPM`;
    document.getElementById(
      "monitor-bp"
    ).textContent = `${SimulatorState.currentVitals.bloodPressure[0]}/${SimulatorState.currentVitals.bloodPressure[1]} mmHg`;
    document.getElementById(
      "monitor-resp"
    ).textContent = `${SimulatorState.currentVitals.respiratoryRate} bpm`;
    document.getElementById(
      "monitor-o2"
    ).textContent = `${SimulatorState.currentVitals.oxygenSaturation} %`;
    document.getElementById(
      "monitor-temp"
    ).textContent = `${SimulatorState.currentVitals.temperature} °F`;

    // Update risk display
    document.getElementById("monitor-risk-value").textContent = `${Math.round(
      SimulatorState.riskScore * 100
    )}%`;
    document.getElementById("monitor-risk-fill").style.width = `${
      SimulatorState.riskScore * 100
    }%`;

    // Update risk factors
    if (SimulatorState.riskFactors.length > 0) {
      const riskFactorsList = SimulatorState.riskFactors
        .map((factor) => `<p>${factor}</p>`)
        .join("");
      document.getElementById("monitor-risk-factors").innerHTML =
        riskFactorsList;
    } else {
      document.getElementById("monitor-risk-factors").innerHTML =
        "<p>No risk factors detected</p>";
    }

    // Apply color coding based on risk level
    const riskFill = document.getElementById("monitor-risk-fill");
    if (SimulatorState.riskScore < 0.3) {
      riskFill.style.backgroundColor = "#2ecc71"; // Green
    } else if (SimulatorState.riskScore < 0.7) {
      riskFill.style.backgroundColor = "#f39c12"; // Yellow/Orange
    } else {
      riskFill.style.backgroundColor = "#e74c3c"; // Red
    }
  },

  // Calculate risk score based on vital signs
  calculateRiskScore: function () {
    // Reset risk factors
    SimulatorState.riskFactors = [];

    // Start with a base score
    let riskScore = 0.05;

    // Heart rate risk
    if (SimulatorState.currentVitals.heartRate > 120) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `Elevated heart rate: ${SimulatorState.currentVitals.heartRate} BPM`
      );
    } else if (SimulatorState.currentVitals.heartRate > 100) {
      riskScore += 0.1;
      SimulatorState.riskFactors.push(
        `Increased heart rate: ${SimulatorState.currentVitals.heartRate} BPM`
      );
    } else if (SimulatorState.currentVitals.heartRate < 50) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `Low heart rate: ${SimulatorState.currentVitals.heartRate} BPM`
      );
    } else if (SimulatorState.currentVitals.heartRate < 60) {
      riskScore += 0.05;
    }

    // Blood pressure risk
    if (SimulatorState.currentVitals.bloodPressure[0] > 180) {
      riskScore += 0.2;
      SimulatorState.riskFactors.push(
        `Hypertensive crisis: ${SimulatorState.currentVitals.bloodPressure[0]}/${SimulatorState.currentVitals.bloodPressure[1]} mmHg`
      );
    } else if (SimulatorState.currentVitals.bloodPressure[0] > 140) {
      riskScore += 0.1;
      SimulatorState.riskFactors.push(
        `Hypertension: ${SimulatorState.currentVitals.bloodPressure[0]}/${SimulatorState.currentVitals.bloodPressure[1]} mmHg`
      );
    } else if (SimulatorState.currentVitals.bloodPressure[0] < 90) {
      riskScore += 0.2;
      SimulatorState.riskFactors.push(
        `Hypotension: ${SimulatorState.currentVitals.bloodPressure[0]}/${SimulatorState.currentVitals.bloodPressure[1]} mmHg`
      );
    }

    // Respiratory rate risk
    if (SimulatorState.currentVitals.respiratoryRate > 24) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `Tachypnea: ${SimulatorState.currentVitals.respiratoryRate} breaths/min`
      );
    } else if (SimulatorState.currentVitals.respiratoryRate > 20) {
      riskScore += 0.1;
      SimulatorState.riskFactors.push(
        `Increased respiratory rate: ${SimulatorState.currentVitals.respiratoryRate} breaths/min`
      );
    } else if (SimulatorState.currentVitals.respiratoryRate < 10) {
      riskScore += 0.2;
      SimulatorState.riskFactors.push(
        `Bradypnea: ${SimulatorState.currentVitals.respiratoryRate} breaths/min`
      );
    } else if (SimulatorState.currentVitals.respiratoryRate < 12) {
      riskScore += 0.05;
    }

    // Oxygen saturation risk
    if (SimulatorState.currentVitals.oxygenSaturation < 90) {
      riskScore += 0.3;
      SimulatorState.riskFactors.push(
        `Severe hypoxemia: ${SimulatorState.currentVitals.oxygenSaturation}% O₂ saturation`
      );
    } else if (SimulatorState.currentVitals.oxygenSaturation < 94) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `Hypoxemia: ${SimulatorState.currentVitals.oxygenSaturation}% O₂ saturation`
      );
    } else if (SimulatorState.currentVitals.oxygenSaturation < 96) {
      riskScore += 0.05;
    }

    // Temperature risk
    if (SimulatorState.currentVitals.temperature > 102) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `High fever: ${SimulatorState.currentVitals.temperature}°F`
      );
    } else if (SimulatorState.currentVitals.temperature > 100.4) {
      riskScore += 0.1;
      SimulatorState.riskFactors.push(
        `Fever: ${SimulatorState.currentVitals.temperature}°F`
      );
    } else if (SimulatorState.currentVitals.temperature < 96) {
      riskScore += 0.15;
      SimulatorState.riskFactors.push(
        `Hypothermia: ${SimulatorState.currentVitals.temperature}°F`
      );
    } else if (SimulatorState.currentVitals.temperature < 97) {
      riskScore += 0.05;
    }

    // ECG pattern risk
    switch (SimulatorState.currentVitals.ecgPattern) {
      case "tachycardia":
        if (SimulatorState.currentVitals.heartRate > 120) {
          riskScore += 0.05; // Additional risk for ECG confirmation
        }
        break;
      case "bradycardia":
        if (SimulatorState.currentVitals.heartRate < 60) {
          riskScore += 0.05; // Additional risk for ECG confirmation
        }
        break;
      case "afib":
        riskScore += 0.15;
        SimulatorState.riskFactors.push("Atrial fibrillation detected on ECG");
        break;
      case "pvc":
        riskScore += 0.1;
        SimulatorState.riskFactors.push(
          "Premature ventricular contractions detected on ECG"
        );
        break;
      case "st_elevation":
        riskScore += 0.25;
        SimulatorState.riskFactors.push(
          "ST elevation detected on ECG - possible myocardial infarction"
        );
        break;
      case "st_depression":
        riskScore += 0.15;
        SimulatorState.riskFactors.push(
          "ST depression detected on ECG - possible myocardial ischemia"
        );
        break;
    }

    // Cap risk score at 0.95
    SimulatorState.riskScore = Math.min(0.95, riskScore);
  },
};

// Initialize simulator when page loads
document.addEventListener("DOMContentLoaded", function () {
  SimulatorController.initialize();
});
