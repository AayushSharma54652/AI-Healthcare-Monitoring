# Healthcare Monitoring API Service

A comprehensive healthcare monitoring API that provides vital signs analysis, disease prediction, medical image analysis, and multimodal data fusion. This API can be integrated with any application, regardless of the technology stack.

## Features

- 💓 **Vital Signs Monitoring**: Track and analyze patient vital signs
- 🔍 **Anomaly Detection**: AI-powered detection of abnormal vital signs
- 📊 **Predictive Analytics**: Predict future vital sign trends
- 🩺 **Disease Prediction**: Predict diseases based on symptoms
- 🏥 **Medical Image Analysis**: 
  - Pneumonia detection from chest X-rays
  - Brain tumor detection from MRI scans
  - Kidney stone detection from CT scans
- 🎵 **Medical Audio Analysis**: Analyze breathing sounds, heart sounds, coughing, and voice
- ⌚ **Wearable Device Integration**: Connect to and retrieve data from various wearable devices
- 🔄 **Multimodal Data Fusion**: Combine data from different sources for comprehensive patient assessment

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
3. Make sure the directory structure is set up correctly:
   ```
   /healthcare_api_service.py    # Main API file
   /static/                      # Static files directory
     /swagger.yaml               # API documentation
   ```
4. Run the API service:
   ```
   python healthcare_api_service.py
   ```

## API Documentation

Access the interactive Swagger documentation at:
```
http://localhost:5001/api/docs
```

This provides a complete reference for all available endpoints with examples.

## Key Endpoints

### Vital Signs Monitoring

- `GET /api/vitals/simulate` - Generate simulated vital signs for testing
- `POST /api/vitals/submit` - Submit actual vital signs for a patient
- `GET /api/vitals/history` - Get historical vital signs for a patient
- `GET /api/vitals/alerts` - Get alerts for a patient

### Disease Prediction

- `GET /api/disease-prediction/symptoms` - Get list of available symptoms
- `POST /api/disease-prediction/predict` - Predict diseases based on symptoms

### Medical Image Analysis

- `POST /api/image-analysis/pneumonia` - Analyze chest X-ray for pneumonia
- `POST /api/image-analysis/brain-tumor` - Analyze MRI for brain tumor
- `POST /api/image-analysis/kidney-stone` - Analyze CT scan for kidney stones
- `POST /api/image-analysis/general` - General medical image analysis

### Medical Audio Analysis

- `POST /api/audio-analysis` - Analyze medical audio recordings

### Wearable Device Integration

- `POST /api/wearable/connect` - Connect to a wearable device
- `POST /api/wearable/disconnect` - Disconnect from a wearable device
- `GET /api/wearable/data` - Get data from a wearable device

### Multimodal Data Fusion

- `GET /api/fusion/patient-summary` - Get comprehensive patient summary
- `GET /api/fusion/trend-analysis` - Get trend analysis for a patient parameter

## Usage Examples

### Python Example

```python
import requests
import json

# Base URL for the API
API_URL = "http://localhost:5001/api"

# 1. Submit vital signs for a patient
def submit_vitals(patient_id, heart_rate, blood_pressure, respiratory_rate, oxygen_saturation, temperature):
    url = f"{API_URL}/vitals/submit"
    payload = {
        "patient_id": patient_id,
        "heart_rate": heart_rate,
        "blood_pressure": blood_pressure,
        "respiratory_rate": respiratory_rate,
        "oxygen_saturation": oxygen_saturation,
        "temperature": temperature
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# 2. Predict disease based on symptoms
def predict_disease(symptoms, num_diagnoses=5):
    url = f"{API_URL}/disease-prediction/predict"
    payload = {
        "symptoms": symptoms,
        "num_diagnoses": num_diagnoses
    }
    
    response = requests.post(url, json=payload)
    return response.json()

# 3. Analyze a medical image (pneumonia detection)
def analyze_pneumonia(image_path, patient_id="test_patient"):
    url = f"{API_URL}/image-analysis/pneumonia"
    
    with open(image_path, "rb") as image_file:
        files = {"image": image_file}
        data = {"patient_id": patient_id}
        
        response = requests.post(url, files=files, data=data)
        return response.json()

# Example usage
vitals_result = submit_vitals(
    "patient123", 
    75,                # heart rate 
    [120, 80],         # blood pressure (systolic, diastolic)
    16,                # respiratory rate
    98,                # oxygen saturation
    98.6               # temperature
)
print("Vitals Analysis:", json.dumps(vitals_result, indent=2))

disease_result = predict_disease(["fever", "cough", "headache", "fatigue"])
print("Disease Prediction:", json.dumps(disease_result, indent=2))
```

### JavaScript Example

```javascript
// Base URL for the API
const API_URL = "http://localhost:5001/api";

// 1. Submit vital signs for a patient
async function submitVitals(patientId, heartRate, bloodPressure, respiratoryRate, oxygenSaturation, temperature) {
  const url = `${API_URL}/vitals/submit`;
  const payload = {
    patient_id: patientId,
    heart_rate: heartRate,
    blood_pressure: bloodPressure,
    respiratory_rate: respiratoryRate,
    oxygen_saturation: oxygenSaturation,
    temperature: temperature
  };
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  
  return response.json();
}

// 2. Get patient history
async function getVitalsHistory(patientId) {
  const url = `${API_URL}/vitals/history?patient_id=${patientId}`;
  
  const response = await fetch(url);
  return response.json();
}

// 3. Analyze a medical image
async function analyzeImage(imageFile, type, patientId) {
  const url = `${API_URL}/image-analysis/${type}`;
  const formData = new FormData();
  
  formData.append('image', imageFile);
  formData.append('patient_id', patientId);
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
}

// Example usage
// This would typically be in an async function or using promises
submitVitals("patient123", 75, [120, 80], 16, 98, 98.6)
  .then(result => {
    console.log("Vitals Analysis:", result);
  })
  .catch(error => {
    console.error("Error:", error);
  });

// When working with file inputs in a form
document.getElementById('analyzeButton').addEventListener('click', async () => {
  const imageFile = document.getElementById('imageInput').files[0];
  const patientId = document.getElementById('patientId').value;
  
  if (imageFile) {
    try {
      const result = await analyzeImage(imageFile, 'pneumonia', patientId);
      displayResults(result);
    } catch (error) {
      console.error("Error analyzing image:", error);
    }
  } else {
    alert("Please select an image file");
  }
});
```

## Integration with React

### Example React Component

```jsx
import React, { useState, useEffect } from 'react';

const PatientMonitor = ({ patientId }) => {
  const [vitals, setVitals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Function to get patient vitals
    const fetchVitals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5001/api/vitals/history?patient_id=${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch patient data');
        }
        
        const data = await response.json();
        setVitals(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial fetch
    fetchVitals();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchVitals, 10000); // Update every 10 seconds
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, [patientId]);
  
  if (loading) return <div>Loading patient data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!vitals) return <div>No data available</div>;
  
  // Get the most recent values
  const latestIndex = vitals.timestamps.length - 1;
  const latestVitals = {
    heartRate: vitals.heart_rate[latestIndex],
    systolic: vitals.blood_pressure_systolic[latestIndex],
    diastolic: vitals.blood_pressure_diastolic[latestIndex],
    respiratoryRate: vitals.respiratory_rate[latestIndex],
    oxygenSaturation: vitals.oxygen_saturation[latestIndex],
    temperature: vitals.temperature[latestIndex],
    timestamp: vitals.timestamps[latestIndex]
  };
  
  return (
    <div className="patient-monitor">
      <h2>Patient ID: {patientId}</h2>
      <p>Last updated: {latestVitals.timestamp}</p>
      
      <div className="vitals-grid">
        <div className="vital-box">
          <h3>Heart Rate</h3>
          <p className="vital-value">{latestVitals.heartRate} <span>BPM</span></p>
        </div>
        
        <div className="vital-box">
          <h3>Blood Pressure</h3>
          <p className="vital-value">{latestVitals.systolic}/{latestVitals.diastolic} <span>mmHg</span></p>
        </div>
        
        <div className="vital-box">
          <h3>Respiratory Rate</h3>
          <p className="vital-value">{latestVitals.respiratoryRate} <span>breaths/min</span></p>
        </div>
        
        <div className="vital-box">
          <h3>Oxygen Saturation</h3>
          <p className="vital-value">{latestVitals.oxygenSaturation} <span>%</span></p>
        </div>
        
        <div className="vital-box">
          <h3>Temperature</h3>
          <p className="vital-value">{latestVitals.temperature} <span>°F</span></p>
        </div>
      </div>
      
      <button onClick={() => window.location.href = `/patient/${patientId}/details`}>
        View Detailed Analysis
      </button>
    </div>
  );
};

export default PatientMonitor;
```

## Docker Support

You can containerize this API for easier deployment:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5001

CMD ["python", "healthcare_api_service.py"]
```

Build and run:
```bash
docker build -t healthcare-api .
docker run -p 5001:5001 healthcare-api
```

## Security Considerations

For production deployment, implement these security measures:

1. **API Authentication**: Add JWT or OAuth2 authentication
2. **HTTPS**: Use SSL/TLS for all connections
3. **Input Validation**: Validate all input parameters
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Logging**: Add comprehensive logging for audit trails
6. **Data Encryption**: Encrypt sensitive patient data
7. **HIPAA Compliance**: Ensure all aspects of the API meet HIPAA requirements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.