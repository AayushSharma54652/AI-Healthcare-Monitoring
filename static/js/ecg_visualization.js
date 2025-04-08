// Advanced ECG visualization and analysis
class ECGVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.ecgData = [];
    this.abnormalRegions = [];
    this.annotations = [];

    // Display settings
    this.gridColor = "#f0f0f0";
    this.ecgColor = "#ef4444";
    this.abnormalColor = "rgba(239, 68, 68, 0.3)";
    this.annotationColor = "#3b82f6";

    // Initialize
    this.resizeCanvas();
    window.addEventListener("resize", () => this.resizeCanvas());
  }

  // Resize canvas to fit container
  resizeCanvas() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
    this.render();
  }

  // Set ECG data
  setData(ecgData, abnormalRegions = [], annotations = []) {
    this.ecgData = ecgData;
    this.abnormalRegions = abnormalRegions;
    this.annotations = annotations;
    this.render();
  }

  // Render ECG on canvas
  // Render ECG on canvas
  render() {
    if (!this.ecgData || this.ecgData.length === 0) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background grid
    this.drawGrid();

    // Calculate scaling factors
    const xScale = width / this.ecgData.length;
    const yScale = height / 2.5;
    const yOffset = height / 2;

    // Draw abnormal regions if any
    this.abnormalRegions.forEach((region) => {
      const startX = region.start * xScale;
      const endX = region.end * xScale;
      ctx.fillStyle = this.abnormalColor;
      ctx.fillRect(startX, 0, endX - startX, height);
    });

    // Draw ECG line
    ctx.beginPath();
    ctx.strokeStyle = this.ecgColor;
    ctx.lineWidth = 2;

    for (let i = 0; i < this.ecgData.length; i++) {
      const x = i * xScale;
      const y = yOffset - this.ecgData[i] * yScale;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Draw annotations
    this.annotations.forEach((annotation) => {
      const x = annotation.position * xScale;
      const y = 20;

      // Draw marker
      ctx.beginPath();
      ctx.strokeStyle = this.annotationColor;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Draw label
      ctx.fillStyle = this.annotationColor;
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(annotation.label, x, y);
    });
  }

  // Draw ECG background grid
  drawGrid() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.strokeStyle = this.gridColor;
    ctx.lineWidth = 0.5;

    // Draw vertical grid lines
    const verticalSpacing = width / 25;
    for (let x = 0; x <= width; x += verticalSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    const horizontalSpacing = height / 10;
    for (let y = 0; y <= height; y += horizontalSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw darker lines every 5 small squares
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += verticalSpacing * 5) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += horizontalSpacing * 5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Analyze ECG and identify key features
  analyzeECG(ecgData) {
    if (!ecgData || ecgData.length === 0) return null;

    // Find R peaks (simplified algorithm)
    const rPeaks = this.findRPeaks(ecgData);

    // Calculate heart rate
    const heartRate = this.calculateHeartRate(rPeaks, ecgData.length);

    // Find abnormal regions
    const abnormalRegions = this.findAbnormalRegions(ecgData, rPeaks);

    // Generate annotations
    const annotations = this.generateAnnotations(rPeaks, abnormalRegions);

    return {
      heartRate,
      rPeaks,
      abnormalRegions,
      annotations,
    };
  }

  // Find R peaks in ECG data (simplified algorithm)
  findRPeaks(ecgData) {
    const peaks = [];
    const threshold = 0.5; // Adjustable threshold
    const minDistance = 30; // Minimum samples between peaks

    for (let i = 1; i < ecgData.length - 1; i++) {
      if (
        ecgData[i] > threshold &&
        ecgData[i] > ecgData[i - 1] &&
        ecgData[i] > ecgData[i + 1]
      ) {
        // Check if this peak is far enough from the previous one
        if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
          peaks.push(i);
        }
      }
    }

    return peaks;
  }

  // Calculate heart rate from R peaks
  calculateHeartRate(rPeaks, totalSamples) {
    if (rPeaks.length < 2) return null;

    // Calculate average RR interval in samples
    let totalRR = 0;
    for (let i = 1; i < rPeaks.length; i++) {
      totalRR += rPeaks[i] - rPeaks[i - 1];
    }

    const avgRR = totalRR / (rPeaks.length - 1);

    // Convert to heart rate (assuming 125 samples per second)
    const samplingRate = 125;
    const heartRate = (60 * samplingRate) / avgRR;

    return heartRate;
  }

  // Find regions with abnormal patterns
  findAbnormalRegions(ecgData, rPeaks) {
    const abnormalRegions = [];

    // Check for irregular RR intervals
    const rrIntervals = [];
    for (let i = 1; i < rPeaks.length; i++) {
      rrIntervals.push(rPeaks[i] - rPeaks[i - 1]);
    }

    if (rrIntervals.length > 2) {
      const avgRR = rrIntervals.reduce((a, b) => a + b) / rrIntervals.length;
      const stdRR = Math.sqrt(
        rrIntervals.reduce((a, b) => a + Math.pow(b - avgRR, 2), 0) /
          rrIntervals.length
      );

      // High RR variability indicates arrhythmia
      if (stdRR / avgRR > 0.2) {
        for (let i = 1; i < rPeaks.length; i++) {
          if (Math.abs(rrIntervals[i - 1] - avgRR) > avgRR * 0.2) {
            abnormalRegions.push({
              start: rPeaks[i - 1],
              end: rPeaks[i],
              type: "irregular_rr",
            });
          }
        }
      }
    }

    // Check for abnormal ST segments (simplified)
    for (let i = 0; i < rPeaks.length; i++) {
      const rPeak = rPeaks[i];
      const stSegmentStart = Math.min(ecgData.length - 1, rPeak + 15); // ~120ms after R peak
      const stSegmentEnd = Math.min(ecgData.length - 1, rPeak + 30); // ~240ms after R peak

      // Calculate average ST segment level
      let stSum = 0;
      for (let j = stSegmentStart; j <= stSegmentEnd; j++) {
        stSum += ecgData[j];
      }
      const stAvg = stSum / (stSegmentEnd - stSegmentStart + 1);

      // Check for ST elevation or depression
      if (stAvg > 0.2 || stAvg < -0.1) {
        abnormalRegions.push({
          start: stSegmentStart,
          end: stSegmentEnd,
          type: stAvg > 0 ? "st_elevation" : "st_depression",
        });
      }
    }

    return abnormalRegions;
  }

  // Generate annotations for ECG
  generateAnnotations(rPeaks, abnormalRegions) {
    const annotations = [];

    // Mark R peaks
    rPeaks.forEach((peak, index) => {
      annotations.push({
        position: peak,
        label: `R${index + 1}`,
      });
    });

    // Mark abnormal regions
    abnormalRegions.forEach((region, index) => {
      let label = "";
      switch (region.type) {
        case "irregular_rr":
          label = "IRR";
          break;
        case "st_elevation":
          label = "ST↑";
          break;
        case "st_depression":
          label = "ST↓";
          break;
        default:
          label = "ABN";
      }

      annotations.push({
        position: (region.start + region.end) / 2,
        label: label,
      });
    });

    return annotations;
  }
}

// Enhance existing ECG chart with advanced visualization
function enhanceECGChart(chart, ecgData, analysisResults) {
  // Update the chart data
  chart.data.datasets[0].data = ecgData;
  chart.update();

  // Get the canvas element and create an ECG visualizer
  const canvasId = chart.canvas.id;
  const visualizer = window.ecgVisualizer || new ECGVisualizer(canvasId);
  window.ecgVisualizer = visualizer;

  // Process analysis results if available
  let abnormalRegions = [];
  let annotations = [];

  if (analysisResults) {
    // Convert analysis results to visualizer format
    if (
      analysisResults.conditions &&
      !analysisResults.conditions.includes("normal")
    ) {
      // Mark potential abnormal regions based on conditions
      if (analysisResults.conditions.includes("afib")) {
        // For atrial fibrillation, mark sections with irregular rhythm
        abnormalRegions.push({
          start: Math.floor(ecgData.length * 0.3),
          end: Math.floor(ecgData.length * 0.7),
          type: "irregular_rr",
        });
      }

      if (analysisResults.conditions.includes("st_elevation")) {
        // Mark ST segment elevation
        abnormalRegions.push({
          start: Math.floor(ecgData.length * 0.4),
          end: Math.floor(ecgData.length * 0.6),
          type: "st_elevation",
        });
      }

      if (analysisResults.conditions.includes("st_depression")) {
        // Mark ST segment depression
        abnormalRegions.push({
          start: Math.floor(ecgData.length * 0.5),
          end: Math.floor(ecgData.length * 0.7),
          type: "st_depression",
        });
      }
    }

    // Add condition annotations
    if (analysisResults.conditions && analysisResults.conditions.length > 0) {
      analysisResults.conditions.forEach((condition, index) => {
        if (condition !== "normal") {
          annotations.push({
            position: Math.floor(ecgData.length * (0.2 + index * 0.2)),
            label: condition.toUpperCase(),
          });
        }
      });
    }
  } else {
    // Use the advanced analysis built into the visualizer
    const analysis = visualizer.analyzeECG(ecgData);
    if (analysis) {
      abnormalRegions = analysis.abnormalRegions;
      annotations = analysis.annotations;
    }
  }

  // Update the ECG visualizer
  visualizer.setData(ecgData, abnormalRegions, annotations);
}

// Update ECG chart with new data and analysis
function updateECGChart(chart, ecgData, ecgAnalysis) {
  if (typeof enhanceECGChart === "function") {
    enhanceECGChart(chart, ecgData, ecgAnalysis);
  } else {
    // Fallback to basic update if advanced visualization is not available
    chart.data.datasets[0].data = ecgData;
    chart.update();
  }
}
