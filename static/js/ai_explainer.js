// AI Explainer component
function updateAIExplanation(currentData, anomalyResults, riskScore, riskFactors) {
    const explainerContent = document.getElementById('ai-explainer-content');
    const importanceBars = document.getElementById('feature-importance-bars');
    
    if (!explainerContent || !importanceBars) return;
    
    // Generate explanation text based on current data and risk
    let explanationText = "";
    
    if (riskScore < 0.3) {
      explanationText = "The AI system detects normal vital signs within expected ranges. ";
    } else if (riskScore < 0.7) {
      explanationText = "The AI system has identified some abnormal patterns that require attention. ";
    } else {
      explanationText = "The AI system has detected significant abnormalities in vital signs. Immediate attention recommended. ";
    }
    
    // Add specific explanations based on risk factors
    if (riskFactors && riskFactors.length > 0) {
      explanationText += "Key findings include: " + riskFactors.join(". ") + ". ";
    }
    
    // Add predictive insights
    explanationText += "Based on trend analysis, the AI predicts ";
    
    // Simple prediction based on current state
    if (riskScore > 0.5) {
      explanationText += "potential escalation if current trends continue without intervention.";
    } else {
      explanationText += "stable conditions in the near term.";
    }
    
    // Update the explanation text
    explainerContent.innerHTML = `<p>${explanationText}</p>`;
    
    // Calculate feature importance
    const features = [
      { name: 'Heart Rate', value: currentData.heart_rate, importance: 0 },
      { name: 'Blood Pressure', value: `${currentData.blood_pressure[0]}/${currentData.blood_pressure[1]}`, importance: 0 },
      { name: 'Oxygen', value: currentData.oxygen_saturation + '%', importance: 0 },
      { name: 'Respiratory Rate', value: currentData.respiratory_rate, importance: 0 },
      { name: 'Temperature', value: currentData.temperature + '°F', importance: 0 }
    ];
    
    // Assign importance based on anomaly detection and risk factors
    features.forEach(feature => {
      let importance = 0;
      
      switch(feature.name) {
        case 'Heart Rate':
          importance = anomalyResults.heart_rate ? 0.8 : 0.2;
          if (riskFactors.some(f => f.includes('heart rate'))) importance = 0.9;
          break;
        case 'Blood Pressure':
          importance = anomalyResults.blood_pressure_systolic || anomalyResults.blood_pressure_diastolic ? 0.8 : 0.2;
          if (riskFactors.some(f => f.includes('pressure'))) importance = 0.9;
          break;
        case 'Oxygen':
          importance = anomalyResults.oxygen_saturation ? 0.8 : 0.2;
          if (riskFactors.some(f => f.includes('oxygen'))) importance = 0.9;
          break;
        case 'Respiratory Rate':
          importance = anomalyResults.respiratory_rate ? 0.8 : 0.2;
          if (riskFactors.some(f => f.includes('respiratory'))) importance = 0.9;
          break;
        case 'Temperature':
          importance = anomalyResults.temperature ? 0.8 : 0.2;
          if (riskFactors.some(f => f.includes('temperature'))) importance = 0.9;
          break;
      }
      
      feature.importance = importance;
    });
    
    // Sort by importance
    features.sort((a, b) => b.importance - a.importance);
    
    // Generate HTML for importance bars
    importanceBars.innerHTML = '';
    features.forEach(feature => {
      const barWidth = Math.round(feature.importance * 100);
      const barColor = barWidth > 75 ? '#ef4444' : barWidth > 40 ? '#f59e0b' : '#10b981';
      
      const barHTML = `
        <div class="importance-item">
          <div class="importance-label">${feature.name} (${feature.value})</div>
          <div class="importance-bar-container">
            <div class="importance-bar" style="width: ${barWidth}%; background-color: ${barColor}"></div>
            <span class="importance-value">${barWidth}%</span>
          </div>
        </div>
      `;
      
      importanceBars.innerHTML += barHTML;
    });
  }