from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit
import json
import numpy as np
import pandas as pd
import time
import threading
from datetime import datetime, timedelta

# Import our modules
from utils.data_generator import VitalsGenerator
from models.enhanced_anomaly_detector import EnhancedAnomalyDetector as AnomalyDetector
from models.lstm_predictor import LSTMPredictor
from models.risk_calculator import RiskCalculator
from models.ecg_analyzer import ECGAnalyzer
from utils.helpers import make_json_serializable

# Import the simulator and explainable AI routes
from routes.simulator_routes import simulator_bp
from routes.explainable_ai_routes import explainable_ai_bp, register_socketio_handlers


app = Flask(__name__)
app.config['SECRET_KEY'] = 'healthcare-monitoring-secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

# Register blueprints
app.register_blueprint(simulator_bp)
app.register_blueprint(explainable_ai_bp)

# Register socketio handlers for explainable AI
register_socketio_handlers(socketio)

# Initialize our patient data and models
vitals_generator = VitalsGenerator()
anomaly_detector = AnomalyDetector()
lstm_predictor = LSTMPredictor()
risk_calculator = RiskCalculator()
ecg_analyzer = ECGAnalyzer()

# Store some recent data for initial display and analysis
patient_data_history = {
    'timestamps': [],
    'heart_rate': [],
    'blood_pressure_systolic': [],
    'blood_pressure_diastolic': [],
    'respiratory_rate': [],
    'oxygen_saturation': [],
    'temperature': [],
    'ecg_data': []
}

# Alerts storage
alerts = []

# Generate initial data history (past 24 hours with 5 min intervals)
def generate_initial_data():
    now = datetime.now()
    for i in range(288):  # 24 hours * 12 (5-min intervals)
        timestamp = now - timedelta(minutes=5*(287-i))
        patient_data_history['timestamps'].append(timestamp.strftime("%Y-%m-%d %H:%M:%S"))
        
        # Generate vital signs with some realistic variation over time
        data = vitals_generator.generate_vitals(timestamp=timestamp)
        
        # Store data
        patient_data_history['heart_rate'].append(data['heart_rate'])
        patient_data_history['blood_pressure_systolic'].append(data['blood_pressure'][0])
        patient_data_history['blood_pressure_diastolic'].append(data['blood_pressure'][1])
        patient_data_history['respiratory_rate'].append(data['respiratory_rate'])
        patient_data_history['oxygen_saturation'].append(data['oxygen_saturation'])
        patient_data_history['temperature'].append(data['temperature'])
        
        # Store simplified ECG data (just a few sample points)
        patient_data_history['ecg_data'].append(data['ecg_data'][:20])  # Store only first 20 points for history

# Continuous data generation and analysis
def background_monitoring():
    while True:
        # Generate new vitals data
        current_data = vitals_generator.generate_vitals()
        
        # Update history
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patient_data_history['timestamps'].append(current_time)
        patient_data_history['heart_rate'].append(current_data['heart_rate'])
        patient_data_history['blood_pressure_systolic'].append(current_data['blood_pressure'][0])
        patient_data_history['blood_pressure_diastolic'].append(current_data['blood_pressure'][1])
        patient_data_history['respiratory_rate'].append(current_data['respiratory_rate'])
        patient_data_history['oxygen_saturation'].append(current_data['oxygen_saturation'])
        patient_data_history['temperature'].append(current_data['temperature'])
        patient_data_history['ecg_data'].append(current_data['ecg_data'][:20])
        
        # Keep only last 24 hours of data
        if len(patient_data_history['timestamps']) > 288:
            for key in patient_data_history:
                patient_data_history[key] = patient_data_history[key][-288:]
        
        # Run AI analysis
        # 1. Anomaly detection
        anomaly_results = anomaly_detector.detect(current_data, patient_data_history)
        
        # 2. LSTM prediction for next hour
        predictions = lstm_predictor.predict(patient_data_history)
        
        # 3. Risk calculation
        risk_score, risk_factors = risk_calculator.calculate_risk(current_data, predictions, anomaly_results)
        
        # 4. ECG analysis
        ecg_analysis = ecg_analyzer.analyze(current_data['ecg_data'])
        
        # Modified alert check with minimum risk threshold
        if risk_score > 0.15 or (risk_score > 0.05 and any(val for key, val in anomaly_results.items() if isinstance(val, bool) and val)):
            alert = {
                'timestamp': current_time,
                'risk_score': risk_score,
                'message': f"Abnormal vital signs detected with {int(risk_score*100)}% risk score",
                'risk_factors': risk_factors,
                'vitals': make_json_serializable(current_data)
            }
            alerts.append(alert)
            # Keep only recent 10 alerts
            if len(alerts) > 10:
                alerts.pop(0)
        
        # Package all the data for the frontend
        emit_data = {
            'current_vitals': make_json_serializable(current_data),
            'predictions': make_json_serializable(predictions),
            'anomaly_results': make_json_serializable(anomaly_results),
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'ecg_analysis': make_json_serializable(ecg_analysis),
            'alerts': make_json_serializable(alerts)
        }
        
        # Emit to all connected clients
        socketio.emit('vitals_update', emit_data)
        
        # Wait before next update
        time.sleep(3)  # Update every 3 seconds

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/history')
def history():
    return render_template('history.html')

@app.route('/settings')
def settings():
    return render_template('settings.html')

@app.route('/api/data/history')
def get_history():
    return jsonify(make_json_serializable(patient_data_history))

@app.route('/api/alerts')
def get_alerts():
    return jsonify(make_json_serializable(alerts))

@app.route('/api/risk-history')
def get_risk_history():
    """Generate and return historical risk score data"""
    # This would normally come from a database, but we'll generate it for the demo
    risk_history = []
    
    timestamps = patient_data_history['timestamps']
    heart_rate = patient_data_history['heart_rate']
    systolic = patient_data_history['blood_pressure_systolic']
    diastolic = patient_data_history['blood_pressure_diastolic']
    oxygen = patient_data_history['oxygen_saturation']
    respiratory = patient_data_history['respiratory_rate']
    
    # Generate synthetic risk scores based on the vital signs
    for i in range(len(timestamps)):
        # Simple algorithm to calculate risk from vital signs
        hr_risk = 0
        if heart_rate[i] < 60 or heart_rate[i] > 100:
            hr_risk = min(1, abs(heart_rate[i] - 80) / 40) * 0.2
            
        bp_risk = 0
        if systolic[i] < 90 or systolic[i] > 140 or diastolic[i] < 60 or diastolic[i] > 90:
            systolic_risk = min(1, abs(systolic[i] - 120) / 50)
            diastolic_risk = min(1, abs(diastolic[i] - 80) / 30)
            bp_risk = max(systolic_risk, diastolic_risk) * 0.2
        
        oxygen_risk = 0
        if oxygen[i] < 95:
            oxygen_risk = min(1, (95 - oxygen[i]) / 10) * 0.3
            
        resp_risk = 0
        if respiratory[i] < 12 or respiratory[i] > 20:
            resp_risk = min(1, abs(respiratory[i] - 16) / 8) * 0.2
            
        # Add some randomness for visual interest
        random_factor = np.random.random() * 0.1
        total_risk = min(0.95, max(0.05, hr_risk + bp_risk + oxygen_risk + resp_risk + random_factor))
        
        risk_history.append({
            'timestamp': timestamps[i],
            'risk_score': total_risk
        })
    
    return jsonify(make_json_serializable(risk_history))

@app.route('/api/settings', methods=['GET', 'POST'])
def handle_settings():
    """Get or update system settings"""
    if request.method == 'POST':
        # In a real application, this would update settings in a database
        # For this demo, we'll just return success
        settings = request.json
        return jsonify({'status': 'success', 'message': 'Settings updated successfully'})
    else:
        # Return default settings
        default_settings = {
            'alertThresholds': {
                'heartRate': {'min': 60, 'max': 100},
                'bloodPressure': {
                    'systolicMin': 90, 'systolicMax': 140,
                    'diastolicMin': 60, 'diastolicMax': 90
                },
                'oxygenSaturation': {'min': 95},
                'respiratoryRate': {'min': 12, 'max': 20},
                'temperature': {'min': 97, 'max': 99}
            },
            'aiModelSettings': {
                'anomalySensitivity': 0.05,
                'predictionHorizon': 12,
                'usePatientBaseline': True,
                'enableAdvancedECG': True
            },
            'displaySettings': {
                'updateFrequency': 3,
                'showPredictions': True,
                'enableSoundAlerts': True,
                'chartPoints': 20
            }
        }
        return jsonify(default_settings)

@app.route('/documentation')
def documentation():
    return render_template('documentation.html')

@socketio.on('connect')
def handle_connect():
    # Send initial data to newly connected client
    emit('initial_data', {
        'patient_data_history': make_json_serializable(patient_data_history),
        'alerts': make_json_serializable(alerts)
    })

@socketio.on('simulate_vitals')
def handle_simulated_vitals(data):
    """
    Handle simulated vital signs from the simulator page.
    This allows the simulator to inject data into the real-time monitoring system.
    """
    # Create a structured current_data object from simulator data
    current_data = {
        'heart_rate': data['heartRate'],
        'blood_pressure': [data['bloodPressure'][0], data['bloodPressure'][1]],
        'respiratory_rate': data['respiratoryRate'],
        'oxygen_saturation': data['oxygenSaturation'],
        'temperature': data['temperature'],
        'ecg_data': data.get('ecgData', [0] * 250)  # Default empty ECG if not provided
    }
    
    # Run AI analysis on simulated data
    anomaly_results = anomaly_detector.detect(current_data, patient_data_history)
    predictions = lstm_predictor.predict(patient_data_history)
    risk_score, risk_factors = risk_calculator.calculate_risk(current_data, predictions, anomaly_results)
    ecg_analysis = ecg_analyzer.analyze(current_data['ecg_data'])
    
    # Return analysis results to the simulator
    emit('simulation_analysis', {
        'anomaly_results': make_json_serializable(anomaly_results),
        'predictions': make_json_serializable(predictions),
        'risk_score': risk_score,
        'risk_factors': risk_factors,
        'ecg_analysis': make_json_serializable(ecg_analysis)
    })
    
    # Optionally update the main dashboard for all clients
    # This allows the simulator to affect the real dashboard
    if data.get('updateDashboard', False):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        emit_data = {
            'current_vitals': make_json_serializable(current_data),
            'predictions': make_json_serializable(predictions),
            'anomaly_results': make_json_serializable(anomaly_results),
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'ecg_analysis': make_json_serializable(ecg_analysis),
            'alerts': make_json_serializable(alerts)
        }
        socketio.emit('vitals_update', emit_data)

if __name__ == '__main__':
    # Generate initial historical data
    generate_initial_data()
    
    # Start background monitoring in a separate thread
    monitoring_thread = threading.Thread(target=background_monitoring)
    monitoring_thread.daemon = True
    monitoring_thread.start()
    
    # Start the Flask app
    socketio.run(app, debug=True)