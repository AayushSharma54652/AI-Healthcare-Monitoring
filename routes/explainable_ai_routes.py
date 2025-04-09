from flask import Blueprint, render_template, jsonify, request
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import json
import random

# Import helper for serializing data
from utils.helpers import make_json_serializable

# Create Blueprint for explainable AI routes
explainable_ai_bp = Blueprint('explainable_ai', __name__)

@explainable_ai_bp.route('/explainable-ai')
def explainable_ai():
    """Render the explainable AI dashboard page"""
    return render_template('explainable_ai.html')

@explainable_ai_bp.route('/api/explainable-ai/data')
def get_explanation_data():
    """API endpoint to get explainable AI data"""
    # In a production system, this would use real models to generate explanations
    # For demo purposes, we'll generate sample data
    
    # Get query parameters (risk score and vital signs if provided)
    risk_score = request.args.get('risk_score', 0.25, type=float)
    heart_rate = request.args.get('heart_rate', 85, type=float)
    systolic = request.args.get('systolic', 130, type=float)
    diastolic = request.args.get('diastolic', 85, type=float)
    resp_rate = request.args.get('respiratory_rate', 18, type=float)
    oxygen = request.args.get('oxygen_saturation', 96, type=float)
    temperature = request.args.get('temperature', 99.2, type=float)
    
    # Generate feature attribution
    feature_attribution = generate_feature_attribution(
        risk_score, heart_rate, systolic, diastolic, resp_rate, oxygen, temperature
    )
    
    # Generate counterfactual explanations
    counterfactuals = generate_counterfactuals(
        risk_score, heart_rate, systolic, diastolic, resp_rate, oxygen, temperature
    )
    
    # Generate confidence intervals for predictions
    confidence_intervals = generate_confidence_intervals(risk_score)
    
    # Generate similar cases
    similar_cases = generate_similar_cases(
        heart_rate, systolic, diastolic, resp_rate, oxygen, temperature
    )
    
    # Generate decision path (simplified for demo)
    decision_path = generate_decision_path(
        risk_score, heart_rate, systolic, diastolic, resp_rate, oxygen, temperature
    )
    
    # Determine risk factors based on attribution
    risk_factors = []
    for feature, data in feature_attribution.items():
        if data['impact'] == 'positive' and data['attribution'] > 0.1:
            if feature == 'heartRate':
                risk_factors.append(f"Elevated heart rate ({data['value']} BPM)")
            elif feature == 'bloodPressureSystolic':
                risk_factors.append(f"Elevated systolic blood pressure ({data['value']} mmHg)")
            elif feature == 'bloodPressureDiastolic':
                risk_factors.append(f"Elevated diastolic blood pressure ({data['value']} mmHg)")
            elif feature == 'respiratoryRate':
                risk_factors.append(f"Elevated respiratory rate ({data['value']} breaths/min)")
            elif feature == 'oxygenSaturation':
                if data['value'] < 95:
                    risk_factors.append(f"Low oxygen saturation ({data['value']}%)")
            elif feature == 'temperature':
                if data['value'] > 99:
                    risk_factors.append(f"Elevated temperature ({data['value']}°F)")
    
    # Assemble the explanation data
    explanation_data = {
        'riskScore': risk_score,
        'riskFactors': risk_factors,
        'currentVitals': {
            'heartRate': heart_rate,
            'bloodPressure': [systolic, diastolic],
            'respiratoryRate': resp_rate,
            'oxygenSaturation': oxygen,
            'temperature': temperature
        },
        'featureAttribution': feature_attribution,
        'counterfactuals': counterfactuals,
        'confidenceIntervals': confidence_intervals,
        'similarCases': similar_cases,
        'decisionPath': decision_path
    }
    
    return jsonify(make_json_serializable(explanation_data))

def generate_feature_attribution(risk_score, hr, sys_bp, dia_bp, resp, oxygen, temp):
    """Generate feature attribution based on vital signs"""
    # In a real system, this would use SHAP values or other attribution methods
    # For demo, we'll create plausible attributions that sum to approximately 1
    
    # Base attribution - just distribute the risk based on how abnormal each value is
    attributions = {}
    
    # Heart rate attribution
    hr_normal_low, hr_normal_high = 60, 100
    if hr < hr_normal_low:
        hr_att = 0.2 * min(1, (hr_normal_low - hr) / 20)
        hr_impact = 'positive'
    elif hr > hr_normal_high:
        hr_att = 0.2 * min(1, (hr - hr_normal_high) / 20)
        hr_impact = 'positive'
    else:
        hr_att = 0.05
        hr_impact = 'neutral'
    
    # Systolic BP attribution
    sys_normal_low, sys_normal_high = 90, 140
    if sys_bp < sys_normal_low:
        sys_att = 0.15 * min(1, (sys_normal_low - sys_bp) / 20)
        sys_impact = 'positive'
    elif sys_bp > sys_normal_high:
        sys_att = 0.15 * min(1, (sys_bp - sys_normal_high) / 20)
        sys_impact = 'positive'
    else:
        sys_att = 0.05
        sys_impact = 'neutral'
    
    # Diastolic BP attribution
    dia_normal_low, dia_normal_high = 60, 90
    if dia_bp < dia_normal_low:
        dia_att = 0.1 * min(1, (dia_normal_low - dia_bp) / 15)
        dia_impact = 'positive'
    elif dia_bp > dia_normal_high:
        dia_att = 0.1 * min(1, (dia_bp - dia_normal_high) / 15)
        dia_impact = 'positive'
    else:
        dia_att = 0.05
        dia_impact = 'neutral'
    
    # Respiratory rate attribution
    resp_normal_low, resp_normal_high = 12, 20
    if resp < resp_normal_low:
        resp_att = 0.15 * min(1, (resp_normal_low - resp) / 4)
        resp_impact = 'positive'
    elif resp > resp_normal_high:
        resp_att = 0.15 * min(1, (resp - resp_normal_high) / 6)
        resp_impact = 'positive'
    else:
        resp_att = 0.05
        resp_impact = 'neutral'
    
    # Oxygen saturation attribution
    oxygen_normal = 95
    if oxygen < oxygen_normal:
        oxygen_att = 0.3 * min(1, (oxygen_normal - oxygen) / 10)
        oxygen_impact = 'positive'
    else:
        oxygen_att = 0.05
        oxygen_impact = 'neutral'
    
    # Temperature attribution
    temp_normal_low, temp_normal_high = 97, 99
    if temp < temp_normal_low:
        temp_att = 0.1 * min(1, (temp_normal_low - temp) / 3)
        temp_impact = 'positive'
    elif temp > temp_normal_high:
        temp_att = 0.1 * min(1, (temp - temp_normal_high) / 3)
        temp_impact = 'positive'
    else:
        temp_att = 0.05
        temp_impact = 'neutral'
    
    # Total attribution
    total_att = hr_att + sys_att + dia_att + resp_att + oxygen_att + temp_att
    
    # Normalize attributions to sum to 1
    hr_att /= total_att
    sys_att /= total_att
    dia_att /= total_att
    resp_att /= total_att
    oxygen_att /= total_att
    temp_att /= total_att
    
    # Create attribution data
    attributions = {
        'heartRate': {
            'value': hr,
            'normalRange': [hr_normal_low, hr_normal_high],
            'attribution': hr_att,
            'impact': hr_impact
        },
        'bloodPressureSystolic': {
            'value': sys_bp,
            'normalRange': [sys_normal_low, sys_normal_high],
            'attribution': sys_att,
            'impact': sys_impact
        },
        'bloodPressureDiastolic': {
            'value': dia_bp,
            'normalRange': [dia_normal_low, dia_normal_high],
            'attribution': dia_att,
            'impact': dia_impact
        },
        'respiratoryRate': {
            'value': resp,
            'normalRange': [resp_normal_low, resp_normal_high],
            'attribution': resp_att,
            'impact': resp_impact
        },
        'oxygenSaturation': {
            'value': oxygen,
            'normalRange': [oxygen_normal, 100],
            'attribution': oxygen_att,
            'impact': oxygen_impact
        },
        'temperature': {
            'value': temp,
            'normalRange': [temp_normal_low, temp_normal_high],
            'attribution': temp_att,
            'impact': temp_impact
        }
    }
    
    return attributions

def generate_counterfactuals(risk_score, hr, sys_bp, dia_bp, resp, oxygen, temp):
    """Generate counterfactual explanations"""
    counterfactuals = []
    
    # Heart rate counterfactuals
    hr_normal_low, hr_normal_high = 60, 100
    if hr > hr_normal_high:
        reduced_hr = max(hr_normal_high, hr - 20)
        risk_reduction = 0.15 * min(1, (hr - hr_normal_high) / 20)
        counterfactuals.append({
            'text': f"If heart rate decreased to {reduced_hr} BPM",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    elif hr < hr_normal_low:
        increased_hr = min(hr_normal_low, hr + 15)
        risk_reduction = 0.15 * min(1, (hr_normal_low - hr) / 20)
        counterfactuals.append({
            'text': f"If heart rate increased to {increased_hr} BPM",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    
    # Oxygen saturation counterfactuals
    oxygen_normal = 95
    if oxygen < oxygen_normal:
        increased_oxygen = min(98, oxygen + 4)
        risk_reduction = 0.25 * min(1, (oxygen_normal - oxygen) / 10)
        counterfactuals.append({
            'text': f"If oxygen saturation increased to {increased_oxygen}%",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    
    # Respiratory rate counterfactuals
    resp_normal_low, resp_normal_high = 12, 20
    if resp > resp_normal_high:
        reduced_resp = max(resp_normal_high, resp - 6)
        risk_reduction = 0.15 * min(1, (resp - resp_normal_high) / 6)
        counterfactuals.append({
            'text': f"If respiratory rate decreased to {reduced_resp} breaths/min",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    elif resp < resp_normal_low:
        increased_resp = min(resp_normal_low, resp + 4)
        risk_reduction = 0.15 * min(1, (resp_normal_low - resp) / 4)
        counterfactuals.append({
            'text': f"If respiratory rate increased to {increased_resp} breaths/min",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    
    # Blood pressure counterfactuals
    sys_normal_low, sys_normal_high = 90, 140
    if sys_bp > sys_normal_high:
        reduced_sys = max(sys_normal_high, sys_bp - 20)
        risk_reduction = 0.15 * min(1, (sys_bp - sys_normal_high) / 20)
        counterfactuals.append({
            'text': f"If systolic blood pressure decreased to {reduced_sys} mmHg",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    elif sys_bp < sys_normal_low:
        increased_sys = min(sys_normal_low, sys_bp + 15)
        risk_reduction = 0.15 * min(1, (sys_normal_low - sys_bp) / 20)
        counterfactuals.append({
            'text': f"If systolic blood pressure increased to {increased_sys} mmHg",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    
    # Temperature counterfactuals
    temp_normal_high = 99
    if temp > temp_normal_high:
        reduced_temp = max(98.6, temp - 1.5)
        risk_reduction = 0.1 * min(1, (temp - temp_normal_high) / 3)
        counterfactuals.append({
            'text': f"If temperature decreased to {reduced_temp}°F",
            'riskChange': -risk_reduction,
            'type': 'positive'
        })
    
    # Also add a negative counterfactual (what would increase risk)
    if hr < 100:
        increased_hr = hr + 30
        risk_increase = 0.2
        counterfactuals.append({
            'text': f"If heart rate increased to {increased_hr} BPM",
            'riskChange': risk_increase,
            'type': 'negative'
        })
    elif oxygen > 92:
        decreased_oxygen = max(85, oxygen - 8)
        risk_increase = 0.3
        counterfactuals.append({
            'text': f"If oxygen saturation decreased to {decreased_oxygen}%",
            'riskChange': risk_increase,
            'type': 'negative'
        })
    
    return counterfactuals

def generate_confidence_intervals(risk_score):
    """Generate confidence intervals for predictions"""
    # Time horizons in minutes
    time_horizons = ['Now', '+5m', '+10m', '+15m', '+20m', '+25m', '+30m']
    
    # Generate predictions with increasing uncertainty
    base_predictions = []
    lower_bound = []
    upper_bound = []
    
    # Determine trend direction based on risk score
    if risk_score < 0.3:
        # Low risk trending slightly higher
        trend = 0.03
    elif risk_score > 0.7:
        # High risk trending slightly lower (regression to the mean)
        trend = -0.03
    else:
        # Medium risk could go either way
        trend = 0.04
    
    # Generate predictions with trend and randomness
    current = risk_score
    for i in range(len(time_horizons)):
        # Add trend and small random component
        next_pred = current + trend * (i+1) + random.uniform(-0.01, 0.01)
        
        # Keep within bounds
        next_pred = max(0.05, min(0.95, next_pred))
        
        base_predictions.append(next_pred)
        
        # Uncertainty increases with prediction horizon
        uncertainty = 0.02 + (i * 0.02)
        lower_bound.append(max(0.01, next_pred - uncertainty))
        upper_bound.append(min(0.99, next_pred + uncertainty))
        
        # Update current for next iteration
        current = next_pred
    
    # Determine confidence level based on data consistency
    if max(upper_bound) - min(lower_bound) < 0.3:
        confidence = 'high'
    elif max(upper_bound) - min(lower_bound) < 0.5:
        confidence = 'medium'
    else:
        confidence = 'low'
    
    return {
        'timeHorizons': time_horizons,
        'predictions': base_predictions,
        'lowerBound': lower_bound,
        'upperBound': upper_bound,
        'confidence': confidence
    }

def generate_similar_cases(hr, sys_bp, dia_bp, resp, oxygen, temp):
    """Generate similar patient cases"""
    # In a real system, this would use clustering or similarity metrics on a database of cases
    # For demo, we'll use rule-based logic to identify relevant clinical patterns
    
    similar_cases = []
    
    # Check for respiratory distress pattern
    if oxygen < 94 and resp > 20:
        similarity = min(1.0, 0.8 + (0.2 * (95 - oxygen) / 10))
        similar_cases.append({
            'name': 'Respiratory Distress',
            'similarity': similarity,
            'description': 'Declining oxygen saturation with compensatory increased respiratory rate'
        })
    
    # Check for early sepsis pattern
    if hr > 90 and temp > 100 and resp > 20:
        sepsis_indicators = [
            hr > 90,
            temp > 100,
            resp > 20,
            sys_bp < 100
        ]
        sepsis_score = sum(sepsis_indicators) / 4
        similar_cases.append({
            'name': 'Early Sepsis',
            'similarity': 0.5 + (0.5 * sepsis_score),
            'description': 'Rising heart rate, elevated temperature, increased respiratory rate'
        })
    
    # Check for hypertensive crisis pattern
    if sys_bp > 160 or dia_bp > 100:
        htn_score = max(
            (sys_bp - 140) / 60,
            (dia_bp - 90) / 30
        )
        similar_cases.append({
            'name': 'Hypertensive Episode',
            'similarity': min(0.95, 0.6 + (0.4 * htn_score)),
            'description': 'Elevated blood pressure with potential end-organ impact'
        })
    
    # Check for cardiac strain pattern
    if hr > 100 and sys_bp > 140:
        similar_cases.append({
            'name': 'Cardiac Strain',
            'similarity': 0.7,
            'description': 'Tachycardia with elevated blood pressure indicating increased cardiac workload'
        })
    
    # Add general decompensation if several abnormal vitals
    abnormal_count = sum([
        hr < 60 or hr > 100,
        sys_bp < 90 or sys_bp > 140,
        dia_bp < 60 or dia_bp > 90,
        resp < 12 or resp > 20,
        oxygen < 95,
        temp < 97 or temp > 99
    ])
    
    if abnormal_count >= 3:
        similar_cases.append({
            'name': 'General Decompensation',
            'similarity': min(0.9, 0.4 + (abnormal_count * 0.1)),
            'description': 'Multiple abnormal vital signs suggesting overall decline'
        })
    
    # Ensure we have at least one similar case
    if not similar_cases:
        similar_cases.append({
            'name': 'Healthy Pattern',
            'similarity': 0.8,
            'description': 'Vital signs within or near normal ranges'
        })
    
    # Sort by similarity (descending)
    similar_cases.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Return top 3 most similar cases
    return similar_cases[:3]

def generate_decision_path(risk_score, hr, sys_bp, dia_bp, resp, oxygen, temp):
    """Generate a decision path visualization"""
    # In a real system, this would extract the decision path from a trained model
    # For demo, we'll create a simplified representation
    
    # Create nodes for the decision tree
    nodes = [
        {
            'id': 0,
            'name': 'Root',
            'description': 'Initial assessment',
            'condition': True,
            'type': 'root'
        }
    ]
    
    # Decision nodes based on vital signs
    if oxygen < 95:
        nodes.append({
            'id': len(nodes),
            'name': 'Oxygen Check',
            'description': f'Oxygen saturation = {oxygen}%',
            'condition': f'Oxygen < 95%',
            'type': 'feature',
            'parent': 0
        })
        oxygen_node_id = len(nodes) - 1
        
        if oxygen < 90:
            nodes.append({
                'id': len(nodes),
                'name': 'Severe Hypoxemia',
                'description': 'Oxygen saturation severely decreased',
                'condition': f'Oxygen < 90%',
                'type': 'condition',
                'parent': oxygen_node_id
            })
            
            nodes.append({
                'id': len(nodes),
                'name': 'High Risk',
                'description': 'Major risk factor detected',
                'contribution': 0.3,
                'type': 'leaf',
                'parent': len(nodes) - 1
            })
        else:
            nodes.append({
                'id': len(nodes),
                'name': 'Mild Hypoxemia',
                'description': 'Oxygen saturation mildly decreased',
                'condition': f'Oxygen < 95%',
                'type': 'condition',
                'parent': oxygen_node_id
            })
            
            nodes.append({
                'id': len(nodes),
                'name': 'Moderate Risk',
                'description': 'Significant risk factor detected',
                'contribution': 0.2,
                'type': 'leaf',
                'parent': len(nodes) - 1
            })
    
    if hr > 100 or hr < 60:
        nodes.append({
            'id': len(nodes),
            'name': 'Heart Rate Check',
            'description': f'Heart rate = {hr} BPM',
            'condition': f'Heart Rate {">"    if hr > 100 else "60"} BPM',
            'type': 'feature',
            'parent': 0
        })
        hr_node_id = len(nodes) - 1
        
        if hr > 120 or hr < 50:
            nodes.append({
                'id': len(nodes),
                'name': f'{"Tachycardia" if hr > 120 else "Bradycardia"}',
                'description': f'Heart rate severely {"elevated" if hr > 120 else "decreased"}',
                'condition': f'Heart Rate {">" if hr > 120 else "<"} {"120" if hr > 120 else "50"} BPM',
                'type': 'condition',
                'parent': hr_node_id
            })
            
            nodes.append({
                'id': len(nodes),
                'name': 'High Risk',
                'description': 'Major risk factor detected',
                'contribution': 0.25,
                'type': 'leaf',
                'parent': len(nodes) - 1
            })
        else:
            nodes.append({
                'id': len(nodes),
                'name': f'Mild {"Tachycardia" if hr > 100 else "Bradycardia"}',
                'description': f'Heart rate mildly {"elevated" if hr > 100 else "decreased"}',
                'condition': f'Heart Rate {">" if hr > 100 else "<"} {"100" if hr > 100 else "60"} BPM',
                'type': 'condition',
                'parent': hr_node_id
            })
            
            nodes.append({
                'id': len(nodes),
                'name': 'Moderate Risk',
                'description': 'Significant risk factor detected',
                'contribution': 0.15,
                'type': 'leaf',
                'parent': len(nodes) - 1
            })
    
    # Connect the nodes with links
    links = []
    for node in nodes:
        if 'parent' in node:
            links.append({
                'source': node['parent'],
                'target': node['id']
            })
    
    return {
        'nodes': nodes,
        'links': links
    }

# Socket.IO event handler for explanation data
def register_socketio_handlers(socketio):
    @socketio.on('request_explanation_data')
    def handle_explanation_request(data=None):
        """Handle requests for explainable AI data"""
        # Extract data from the request if provided
        if data and isinstance(data, dict):
            vitals = data.get('vitals', {})
            risk_score = data.get('risk_score', 0.25)
            
            # Extract vital signs
            heart_rate = vitals.get('heart_rate', 75)
            systolic = vitals.get('blood_pressure', [120, 80])[0]
            diastolic = vitals.get('blood_pressure', [120, 80])[1]
            respiratory_rate = vitals.get('respiratory_rate', 16)
            oxygen_saturation = vitals.get('oxygen_saturation', 98)
            temperature = vitals.get('temperature', 98.6)
        else:
            # Use default values if no data provided
            risk_score = 0.25
            heart_rate = 75
            systolic = 120
            diastolic = 80
            respiratory_rate = 16
            oxygen_saturation = 98
            temperature = 98.6
        
        # Generate explanation data
        feature_attribution = generate_feature_attribution(
            risk_score, heart_rate, systolic, diastolic, respiratory_rate, oxygen_saturation, temperature
        )
        
        counterfactuals = generate_counterfactuals(
            risk_score, heart_rate, systolic, diastolic, respiratory_rate, oxygen_saturation, temperature
        )
        
        confidence_intervals = generate_confidence_intervals(risk_score)
        
        similar_cases = generate_similar_cases(
            heart_rate, systolic, diastolic, respiratory_rate, oxygen_saturation, temperature
        )
        
        decision_path = generate_decision_path(
            risk_score, heart_rate, systolic, diastolic, respiratory_rate, oxygen_saturation, temperature
        )
        
        # Determine risk factors based on attribution
        risk_factors = []
        for feature, data in feature_attribution.items():
            if data['impact'] == 'positive' and data['attribution'] > 0.1:
                if feature == 'heartRate':
                    risk_factors.append(f"Elevated heart rate ({data['value']} BPM)")
                elif feature == 'bloodPressureSystolic':
                    risk_factors.append(f"Elevated systolic blood pressure ({data['value']} mmHg)")
                elif feature == 'bloodPressureDiastolic':
                    risk_factors.append(f"Elevated diastolic blood pressure ({data['value']} mmHg)")
                elif feature == 'respiratoryRate':
                    risk_factors.append(f"Elevated respiratory rate ({data['value']} breaths/min)")
                elif feature == 'oxygenSaturation':
                    if data['value'] < 95:
                        risk_factors.append(f"Low oxygen saturation ({data['value']}%)")
                elif feature == 'temperature':
                    if data['value'] > 99:
                        risk_factors.append(f"Elevated temperature ({data['value']}°F)")
        
        # Assemble the explanation data
        explanation_data = {
            'riskScore': risk_score,
            'riskFactors': risk_factors,
            'currentVitals': {
                'heartRate': heart_rate,
                'bloodPressure': [systolic, diastolic],
                'respiratoryRate': respiratory_rate,
                'oxygenSaturation': oxygen_saturation,
                'temperature': temperature
            },
            'featureAttribution': feature_attribution,
            'counterfactuals': counterfactuals,
            'confidenceIntervals': confidence_intervals,
            'similarCases': similar_cases,
            'decisionPath': decision_path
        }
        
        # Emit the explanation data
        socketio.emit('explanation_data', make_json_serializable(explanation_data))