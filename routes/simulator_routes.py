from flask import render_template, Blueprint, jsonify, request

# Create a Blueprint for simulator routes
simulator_bp = Blueprint('simulator', __name__)

@simulator_bp.route('/simulator')
def simulator():
    """Render the patient scenario simulator page"""
    return render_template('simulator.html')

@simulator_bp.route('/api/simulator/scenarios')
def get_scenarios():
    """API endpoint to get available scenarios (optional - scenarios are defined in JS)"""
    # This is a fallback if you want to define scenarios on the server instead
    scenarios = [
        {
            "id": "normal",
            "title": "Healthy Patient",
            "description": "Normal vital signs with minor variations",
            "category": "normal"
        },
        {
            "id": "tachycardia",
            "title": "Tachycardia",
            "description": "Elevated heart rate that progressively worsens",
            "category": "warning"
        },
        {
            "id": "sepsis",
            "title": "Early Sepsis",
            "description": "Developing infection with septic response",
            "category": "critical"
        },
        {
            "id": "hypoxia",
            "title": "Respiratory Distress",
            "description": "Decreasing oxygen levels with respiratory compensation",
            "category": "critical"
        }
        # Other scenarios would be listed here
    ]
    
    return jsonify(scenarios)

@simulator_bp.route('/api/simulator/vitals', methods=['POST'])
def process_vitals():
    """
    API endpoint to process custom vital signs and return AI analysis
    This can be used if you want to offload processing to the server
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    vitals = request.json
    
    # Calculate risk score based on the vitals
    # This is a simplified version of what's in the JS file
    risk_score = 0.05
    risk_factors = []
    
    # Heart rate risk
    heart_rate = vitals.get('heartRate', 75)
    if heart_rate > 120:
        risk_score += 0.15
        risk_factors.append(f"Elevated heart rate: {heart_rate} BPM")
    elif heart_rate > 100:
        risk_score += 0.1
    elif heart_rate < 50:
        risk_score += 0.15
        risk_factors.append(f"Low heart rate: {heart_rate} BPM")
    
    # Blood pressure risk
    systolic = vitals.get('bloodPressure', [120, 80])[0]
    diastolic = vitals.get('bloodPressure', [120, 80])[1]
    if systolic > 180:
        risk_score += 0.2
        risk_factors.append(f"Hypertensive crisis: {systolic}/{diastolic} mmHg")
    elif systolic > 140:
        risk_score += 0.1
    elif systolic < 90:
        risk_score += 0.2
        risk_factors.append(f"Hypotension: {systolic}/{diastolic} mmHg")
    
    # Respiratory rate risk
    respiratory_rate = vitals.get('respiratoryRate', 16)
    if respiratory_rate > 24:
        risk_score += 0.15
        risk_factors.append(f"Tachypnea: {respiratory_rate} breaths/min")
    elif respiratory_rate < 10:
        risk_score += 0.2
        risk_factors.append(f"Bradypnea: {respiratory_rate} breaths/min")
    
    # Oxygen saturation risk
    oxygen = vitals.get('oxygenSaturation', 98)
    if oxygen < 90:
        risk_score += 0.3
        risk_factors.append(f"Severe hypoxemia: {oxygen}% O₂ saturation")
    elif oxygen < 94:
        risk_score += 0.15
        risk_factors.append(f"Hypoxemia: {oxygen}% O₂ saturation")
    
    # Temperature risk
    temperature = vitals.get('temperature', 98.6)
    if temperature > 102:
        risk_score += 0.15
        risk_factors.append(f"High fever: {temperature}°F")
    elif temperature > 100.4:
        risk_score += 0.1
        risk_factors.append(f"Fever: {temperature}°F")
    elif temperature < 96:
        risk_score += 0.15
        risk_factors.append(f"Hypothermia: {temperature}°F")
    
    # ECG pattern risk
    ecg_pattern = vitals.get('ecgPattern', 'normal')
    if ecg_pattern == 'afib':
        risk_score += 0.15
        risk_factors.append("Atrial fibrillation detected on ECG")
    elif ecg_pattern == 'st_elevation':
        risk_score += 0.25
        risk_factors.append("ST elevation detected on ECG - possible myocardial infarction")
    
    # Cap risk score at 0.95
    risk_score = min(0.95, risk_score)
    
    # Return analysis
    return jsonify({
        "riskScore": risk_score,
        "riskFactors": risk_factors
    })