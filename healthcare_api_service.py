from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
import json
import numpy as np
import pandas as pd
import time
from datetime import datetime, timedelta
import threading
import uuid
import os
import traceback
from werkzeug.utils import secure_filename
import io
from PIL import Image

# Import our healthcare monitoring modules
from utils.data_generator import VitalsGenerator
from models.enhanced_anomaly_detector import EnhancedAnomalyDetector as AnomalyDetector
from models.lstm_predictor import LSTMPredictor
from models.risk_calculator import RiskCalculator
from models.ecg_analyzer import ECGAnalyzer
from utils.helpers import make_json_serializable

# Disease prediction components
from routes.disease_prediction_routes import (
    correct_spelling, 
    symptoms_list_processed, 
    predict_diseases_with_confidence, 
    information
)

# Multimodal components
from models.multimodal.image_analyzer import MedicalImageAnalyzer
from models.multimodal.audio_analyzer import MedicalAudioAnalyzer
from models.multimodal.wearable_connector import WearableDeviceConnector
from utils.multimodal_processor import MultimodalDataProcessor
from utils.data_fusion import MultimodalDataFusion

# Specialized detectors
from models.multimodal.brain_tumor_detector import BrainTumorDetector
from models.multimodal.pneumonia_detector import PneumoniaDetector
from models.multimodal.kidney_stone_detector import KidneyStoneDetector

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['UPLOAD_FOLDER'] = 'temp'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('data/processed', exist_ok=True)
os.makedirs('static', exist_ok=True)

# Setup Swagger UI
SWAGGER_URL = '/api/docs'
API_URL = '/static/swagger.yaml'

swagger_ui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "Healthcare Monitoring API"
    }
)

app.register_blueprint(swagger_ui_blueprint, url_prefix=SWAGGER_URL)

# Initialize our models and components
print("Initializing healthcare monitoring components...")

# Vital signs components
vitals_generator = VitalsGenerator()
anomaly_detector = AnomalyDetector()
lstm_predictor = LSTMPredictor()
risk_calculator = RiskCalculator()
ecg_analyzer = ECGAnalyzer()

# Multimodal components
image_analyzer = MedicalImageAnalyzer()
audio_analyzer = MedicalAudioAnalyzer()
wearable_connector = WearableDeviceConnector()
data_processor = MultimodalDataProcessor()
data_fusion = MultimodalDataFusion()

# Specialized detectors
tumor_detector = BrainTumorDetector()
pneumonia_detector = PneumoniaDetector()
kidney_stone_detector = KidneyStoneDetector()

print("All components initialized successfully")

# Store some patient data for sessions
patient_data_history = {}
alerts = {}

# Helper function to get or create patient history
def get_or_create_patient_history(patient_id):
    if patient_id not in patient_data_history:
        patient_data_history[patient_id] = {
            'timestamps': [],
            'heart_rate': [],
            'blood_pressure_systolic': [],
            'blood_pressure_diastolic': [],
            'respiratory_rate': [],
            'oxygen_saturation': [],
            'temperature': [],
            'ecg_data': []
        }
        alerts[patient_id] = []
    return patient_data_history[patient_id]

# Helper function to check allowed files
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'wav', 'mp3'}

# Function to generate initial data history
def generate_initial_data(patient_id):
    """Generate initial 24 hours of data for a patient"""
    # Get the patient history
    patient_history = get_or_create_patient_history(patient_id)
    
    # Generate data for the past 24 hours with 5-minute intervals
    now = datetime.now()
    for i in range(288):  # 24 hours * 12 (5-min intervals)
        timestamp = now - timedelta(minutes=5*(287-i))
        patient_history['timestamps'].append(timestamp.strftime("%Y-%m-%d %H:%M:%S"))
        
        # Generate vital signs with some realistic variation over time
        data = vitals_generator.generate_vitals(timestamp=timestamp)
        
        # Store data
        patient_history['heart_rate'].append(data['heart_rate'])
        patient_history['blood_pressure_systolic'].append(data['blood_pressure'][0])
        patient_history['blood_pressure_diastolic'].append(data['blood_pressure'][1])
        patient_history['respiratory_rate'].append(data['respiratory_rate'])
        patient_history['oxygen_saturation'].append(data['oxygen_saturation'])
        patient_history['temperature'].append(data['temperature'])
        patient_history['ecg_data'].append(data['ecg_data'][:20])

# API ROUTES

@app.route('/')
def home():
    """API home page with basic information and links"""
    return jsonify({
        "service": "Healthcare Monitoring API",
        "version": "1.0.0",
        "description": "AI-powered healthcare monitoring API",
        "documentation": "/api/docs",
        "status": "online",
        "endpoints": {
            "info": "/api/status",
            "vitals": "/api/vitals/simulate, /api/vitals/submit, /api/vitals/history, /api/vitals/alerts",
            "disease_prediction": "/api/disease-prediction/symptoms, /api/disease-prediction/predict",
            "image_analysis": "/api/image-analysis/pneumonia, /api/image-analysis/brain-tumor, /api/image-analysis/kidney-stone",
            "audio_analysis": "/api/audio-analysis",
            "wearable": "/api/wearable/connect, /api/wearable/disconnect, /api/wearable/data",
            "fusion": "/api/fusion/patient-summary, /api/fusion/trend-analysis"
        },
        "message": "Please see the documentation at /api/docs for complete API information"
    })

@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

@app.route('/api/status')
def api_status():
    """Get API status"""
    return jsonify({
        "status": "online",
        "service": "Healthcare Monitoring API",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    })

# ===== VITALS MONITORING ROUTES =====

@app.route('/api/vitals/simulate')
def simulate_vitals():
    """Generate simulated vital signs for demo purposes"""
    try:
        patient_id = request.args.get('patient_id', 'demo_patient')
        
        # Generate vitals
        current_data = vitals_generator.generate_vitals()
        
        # Get patient history
        patient_history = get_or_create_patient_history(patient_id)
        
        # Add to history
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patient_history['timestamps'].append(current_time)
        patient_history['heart_rate'].append(current_data['heart_rate'])
        patient_history['blood_pressure_systolic'].append(current_data['blood_pressure'][0])
        patient_history['blood_pressure_diastolic'].append(current_data['blood_pressure'][1])
        patient_history['respiratory_rate'].append(current_data['respiratory_rate'])
        patient_history['oxygen_saturation'].append(current_data['oxygen_saturation'])
        patient_history['temperature'].append(current_data['temperature'])
        patient_history['ecg_data'].append(current_data['ecg_data'][:20])  # Store a sample of ECG
        
        # Limit history length
        max_history = 288  # 24 hours at 5-min intervals
        if len(patient_history['timestamps']) > max_history:
            for key in patient_history:
                patient_history[key] = patient_history[key][-max_history:]
        
        # Run AI analysis
        anomaly_results = anomaly_detector.detect(current_data, patient_history)
        predictions = lstm_predictor.predict(patient_history)
        risk_score, risk_factors = risk_calculator.calculate_risk(current_data, predictions, anomaly_results)
        ecg_analysis = ecg_analyzer.analyze(current_data['ecg_data'])
        
        # Check for alert conditions
        if risk_score > 0.15 or (risk_score > 0.05 and any(val for key, val in anomaly_results.items() if isinstance(val, bool) and val)):
            alert = {
                'timestamp': current_time,
                'risk_score': risk_score,
                'message': f"Abnormal vital signs detected with {int(risk_score*100)}% risk score",
                'risk_factors': risk_factors,
                'vitals': make_json_serializable(current_data)
            }
            if patient_id in alerts:
                alerts[patient_id].append(alert)
                # Keep only recent 10 alerts
                if len(alerts[patient_id]) > 10:
                    alerts[patient_id].pop(0)
            else:
                alerts[patient_id] = [alert]
        
        # Prepare response
        response = {
            'patient_id': patient_id,
            'current_vitals': make_json_serializable(current_data),
            'predictions': make_json_serializable(predictions),
            'anomaly_results': make_json_serializable(anomaly_results),
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'ecg_analysis': make_json_serializable(ecg_analysis),
            'alerts': make_json_serializable(alerts.get(patient_id, []))
        }
        
        return jsonify(response)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/vitals/submit', methods=['POST'])
def submit_vitals():
    """Submit actual vital signs for a patient"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        patient_id = data.get('patient_id', 'default_patient')
        
        # Required vital signs
        required_fields = ['heart_rate', 'blood_pressure', 'respiratory_rate', 'oxygen_saturation', 'temperature']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Prepare current data
        current_data = {
            'heart_rate': data['heart_rate'],
            'blood_pressure': data['blood_pressure'],
            'respiratory_rate': data['respiratory_rate'],
            'oxygen_saturation': data['oxygen_saturation'],
            'temperature': data['temperature'],
            'ecg_data': data.get('ecg_data', [0] * 250)  # Default to empty ECG if not provided
        }
        
        # Get patient history
        patient_history = get_or_create_patient_history(patient_id)
        
        # Add to history
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        patient_history['timestamps'].append(current_time)
        patient_history['heart_rate'].append(current_data['heart_rate'])
        patient_history['blood_pressure_systolic'].append(current_data['blood_pressure'][0])
        patient_history['blood_pressure_diastolic'].append(current_data['blood_pressure'][1])
        patient_history['respiratory_rate'].append(current_data['respiratory_rate'])
        patient_history['oxygen_saturation'].append(current_data['oxygen_saturation'])
        patient_history['temperature'].append(current_data['temperature'])
        patient_history['ecg_data'].append(current_data['ecg_data'][:20])
        
        # Run AI analysis
        anomaly_results = anomaly_detector.detect(current_data, patient_history)
        predictions = lstm_predictor.predict(patient_history)
        risk_score, risk_factors = risk_calculator.calculate_risk(current_data, predictions, anomaly_results)
        ecg_analysis = ecg_analyzer.analyze(current_data['ecg_data'])
        
        # Prepare response
        response = {
            'patient_id': patient_id,
            'timestamp': current_time,
            'anomaly_results': make_json_serializable(anomaly_results),
            'predictions': make_json_serializable(predictions),
            'risk_score': risk_score,
            'risk_factors': risk_factors,
            'ecg_analysis': make_json_serializable(ecg_analysis)
        }
        
        return jsonify(response)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/vitals/history')
def get_vitals_history():
    """Get vital signs history for a patient"""
    try:
        patient_id = request.args.get('patient_id', 'default_patient')
        
        # Get patient history
        patient_history = get_or_create_patient_history(patient_id)
        
        # If no data exists yet, generate some initial data
        if len(patient_history['timestamps']) == 0:
            generate_initial_data(patient_id)
            patient_history = get_or_create_patient_history(patient_id)
        
        # Return the history
        return jsonify(make_json_serializable(patient_history))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/vitals/alerts')
def get_vitals_alerts():
    """Get alerts for a patient"""
    try:
        patient_id = request.args.get('patient_id', 'default_patient')
        
        # Get patient alerts
        patient_alerts = alerts.get(patient_id, [])
        
        # Return the alerts
        return jsonify(make_json_serializable(patient_alerts))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ===== DISEASE PREDICTION ROUTES =====

@app.route('/api/disease-prediction/symptoms')
def get_symptoms():
    """Get available symptoms for autocomplete"""
    return jsonify({
        'success': True,
        'symptoms': list(symptoms_list_processed.keys())
    })

@app.route('/api/disease-prediction/predict', methods=['POST'])
def predict_disease():
    """Predict disease based on symptoms"""
    try:
        # Get the symptoms from the request
        data = request.json
        if not data or 'symptoms' not in data:
            return jsonify({
                'success': False,
                'error': 'No symptoms provided'
            }), 400
        
        # Get symptoms from request
        patient_symptoms = data['symptoms']
        
        # Get the number of differential diagnoses to return (default: 5)
        num_diagnoses = data.get('num_diagnoses', 5)
        
        # Check if there are enough symptoms
        if len(patient_symptoms) < 1:
            return jsonify({
                'success': False,
                'error': 'Please provide at least one symptom'
            }), 400
        
        # Correct the spelling of symptoms using fuzzy matching
        corrected_symptoms = []
        unrecognized_symptoms = []
        
        for symptom in patient_symptoms:
            corrected_symptom = correct_spelling(symptom.lower())
            if corrected_symptom:
                corrected_symptoms.append(corrected_symptom)
            else:
                unrecognized_symptoms.append(symptom)
        
        # Check if any symptoms were recognized
        if not corrected_symptoms:
            return jsonify({
                'success': False,
                'error': 'No recognized symptoms provided',
                'unrecognized_symptoms': unrecognized_symptoms
            }), 400
        
        # Predict multiple diseases with confidence scores
        differential_diagnoses = predict_diseases_with_confidence(corrected_symptoms, top_n=num_diagnoses)
        
        # Get the primary prediction (highest confidence)
        primary_prediction = differential_diagnoses[0]['disease'] if differential_diagnoses else None
        
        # Get the information about the primary predicted disease
        disease_description, disease_precautions, disease_medications, disease_diet, disease_workout = information(primary_prediction)
        
        # Format precautions list
        precautions_list = []
        if disease_precautions and len(disease_precautions) > 0:
            for precaution in disease_precautions[0]:
                if pd.notna(precaution):
                    precautions_list.append(precaution)
        
        # Return the result with differential diagnoses
        return jsonify({
            'success': True,
            'predicted_disease': primary_prediction,
            'description': disease_description,
            'precautions': precautions_list,
            'medications': disease_medications,
            'diet': disease_diet,
            'workout': disease_workout,
            'corrected_symptoms': corrected_symptoms,
            'unrecognized_symptoms': unrecognized_symptoms,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'differential_diagnoses': differential_diagnoses
        })
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== MEDICAL IMAGE ANALYSIS ROUTES =====

@app.route('/api/image-analysis/pneumonia', methods=['POST'])
def analyze_pneumonia():
    """Analyze chest X-ray for pneumonia"""
    try:
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image uploaded'
            }), 400
        
        image_file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        
        # Create temp directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"xray_{uuid.uuid4().hex}.jpg")
        image_file.save(temp_path)
        
        # Use the specialized pneumonia detector
        results = pneumonia_detector.detect_pneumonia(img_path=temp_path)
        
        # Add patient ID and timestamp
        results['patient_id'] = patient_id
        results['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Clean up the temporary file
        try:
            os.remove(temp_path)
        except Exception as e:
            print(f"Warning: Could not remove temp file {temp_path}: {e}")
        
        return jsonify(results)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/image-analysis/brain-tumor', methods=['POST'])
def analyze_brain_tumor():
    """Analyze MRI scan for brain tumor"""
    try:
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image uploaded'
            }), 400
        
        image_file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        
        # Create temp directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"mri_{uuid.uuid4().hex}.jpg")
        image_file.save(temp_path)
        
        # Analyze the image
        results = tumor_detector.detect_tumor(img_path=temp_path)
        
        # Add timestamp and patient ID
        results['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        results['patient_id'] = patient_id
        
        # Clean up the temporary file
        try:
            os.remove(temp_path)
        except Exception as e:
            print(f"Warning: Could not remove temp file {temp_path}: {e}")
        
        return jsonify(results)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/image-analysis/kidney-stone', methods=['POST'])
def analyze_kidney_stone():
    """Analyze CT scan for kidney stones"""
    try:
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image uploaded'
            }), 400
        
        image_file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        
        # Create temp directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"ct_{uuid.uuid4().hex}.jpg")
        image_file.save(temp_path)
        
        # Analyze the image
        results = kidney_stone_detector.detect_kidney_stone(img_path=temp_path)
        
        # Add timestamp and patient ID
        results['timestamp'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        results['patient_id'] = patient_id
        
        # Clean up the temporary file
        try:
            os.remove(temp_path)
        except Exception as e:
            print(f"Warning: Could not remove temp file {temp_path}: {e}")
        
        return jsonify(results)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/image-analysis/general', methods=['POST'])
def analyze_medical_image():
    """General medical image analysis for various modalities"""
    try:
        # Check if image was uploaded
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image uploaded'
            }), 400
        
        image_file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        modality = request.form.get('modality', 'xray')
        
        # Create temp directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{modality}_{uuid.uuid4().hex}.jpg")
        image_file.save(temp_path)
        
        # Process the image with the medical image analyzer
        metadata = {
            'patient_id': patient_id,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'source': 'api_upload',
            'filename': image_file.filename
        }
        
        processed_image = data_processor.process_medical_image(
            image_path=temp_path,
            modality=modality,
            metadata=metadata
        )
        
        # Get patient context for contextual analysis
        patient_context = {'vitals': patient_data_history.get(patient_id, {})}
        
        # Analyze image
        analysis_results = image_analyzer.analyze_image(
            temp_path,
            modality=modality,
            patient_context=patient_context
        )
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except Exception:
            pass
        
        # Combine results
        results = {
            'processed_image': processed_image,
            'analysis': analysis_results,
            'patient_id': patient_id,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Add to multimodal data fusion
        data_fusion.add_data('image', patient_id, analysis_results)
        
        return jsonify(make_json_serializable(results))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== AUDIO ANALYSIS ROUTES =====

@app.route('/api/audio-analysis', methods=['POST'])
def analyze_audio():
    """Analyze medical audio recordings"""
    try:
        # Check if file is uploaded
        if 'audio' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No audio uploaded'
            }), 400
        
        audio_file = request.files['audio']
        patient_id = request.form.get('patient_id', 'unknown')
        audio_type = request.form.get('audio_type', 'breathing')  # breathing, heart, cough, voice
        
        # Create temp directory if it doesn't exist
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the uploaded file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f"audio_{uuid.uuid4().hex}.wav")
        audio_file.save(temp_path)
        
        # Process audio with the audio analyzer
        metadata = {
            'patient_id': patient_id,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'source': 'api_upload',
            'filename': audio_file.filename
        }
        
        # Get patient context for contextual analysis
        patient_context = {'vitals': patient_data_history.get(patient_id, {})}
        
        # Analyze audio
        analysis_results = audio_analyzer.analyze_audio(
            temp_path,
            audio_type=audio_type,
            patient_context=patient_context
        )
        
        # Clean up temp file
        try:
            os.remove(temp_path)
        except Exception:
            pass
        
        # Add to multimodal data fusion
        data_fusion.add_data('audio', patient_id, analysis_results)
        
        return jsonify(make_json_serializable(analysis_results))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== WEARABLE DEVICE ROUTES =====

@app.route('/api/wearable/connect', methods=['POST'])
def connect_wearable():
    """Connect to a wearable device"""
    try:
        data = request.json
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Get required parameters
        device_id = data.get('device_id')
        device_type = data.get('device_type')
        patient_id = data.get('patient_id')
        connection_params = data.get('connection_params', {})
        
        if not device_id:
            return jsonify({'error': 'Device ID required'}), 400
        if not device_type:
            return jsonify({'error': 'Device type required'}), 400
        if not patient_id:
            return jsonify({'error': 'Patient ID required'}), 400
        
        # Add patient ID to connection params
        connection_params['patient_id'] = patient_id
        
        # Connect to the device
        success = wearable_connector.connect_device(device_id, device_type, connection_params)
        
        if success:
            return jsonify({
                'success': True,
                'message': f"Connected to {device_type} device {device_id}"
            })
        else:
            return jsonify({
                'success': False,
                'message': f"Failed to connect to {device_type} device {device_id}"
            }), 400
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/wearable/disconnect', methods=['POST'])
def disconnect_wearable():
    """Disconnect from a wearable device"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Get required parameters
        device_id = data.get('device_id')
        
        if not device_id:
            return jsonify({'error': 'Device ID required'}), 400
        
        # Disconnect from the device
        success = wearable_connector.disconnect_device(device_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': f"Disconnected from device {device_id}"
            })
        else:
            return jsonify({
                'success': False,
                'message': f"Failed to disconnect from device {device_id}"
            }), 400
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/wearable/data', methods=['GET'])
def get_wearable_data():
    """Get data from a connected wearable device"""
    try:
        # Get parameters
        device_id = request.args.get('device_id')
        data_type = request.args.get('data_type')  # Optional
        
        if not device_id:
            return jsonify({'error': 'Device ID required'}), 400
        
        # Get data from the device
        device_data = wearable_connector.get_device_data(device_id, data_type)
        
        return jsonify(make_json_serializable(device_data))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ===== MULTIMODAL DATA FUSION ROUTES =====

@app.route('/api/fusion/patient-summary', methods=['GET'])
def get_patient_summary():
    """Get a comprehensive patient summary with all available data"""
    try:
        # Get patient ID
        patient_id = request.args.get('patient_id')
        if not patient_id:
            return jsonify({'error': 'Patient ID required'}), 400
        
        # Get fusion results (integrated assessment)
        fusion_results = data_fusion.fuse_all_data(patient_id)
        
        # Get data quality report
        quality_report = data_fusion.get_data_quality_report(patient_id)
        
        # Get recent vitals
        recent_vitals = patient_data_history.get(patient_id, {})
        
        # Put together the complete patient summary
        patient_summary = {
            'patient_id': patient_id,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'fusion_results': fusion_results,
            'data_quality': quality_report,
            'vitals': recent_vitals,
        }
        
        return jsonify(make_json_serializable(patient_summary))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/fusion/trend-analysis', methods=['GET'])
def get_trend_analysis():
    """Get trend analysis for a patient parameter"""
    try:
        # Get parameters
        patient_id = request.args.get('patient_id')
        parameter = request.args.get('parameter')
        time_window = request.args.get('time_window', type=int)
        
        if not patient_id:
            return jsonify({'error': 'Patient ID required'}), 400
        if not parameter:
            return jsonify({'error': 'Parameter required'}), 400
        
        # Get trend analysis
        trend_results = data_fusion.get_trend_analysis(patient_id, parameter, time_window)
        
        return jsonify(make_json_serializable(trend_results))
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Start background thread for data monitoring if needed
def background_monitoring():
    """Background thread for continuous data generation and monitoring"""
    print("Starting background monitoring thread...")
    while True:
        # Generate new data for each patient
        for patient_id in list(patient_data_history.keys()):
            try:
                # Generate vitals
                current_data = vitals_generator.generate_vitals()
                
                # Get patient history
                patient_history = patient_data_history[patient_id]
                
                # Add to history
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                patient_history['timestamps'].append(current_time)
                patient_history['heart_rate'].append(current_data['heart_rate'])
                patient_history['blood_pressure_systolic'].append(current_data['blood_pressure'][0])
                patient_history['blood_pressure_diastolic'].append(current_data['blood_pressure'][1])
                patient_history['respiratory_rate'].append(current_data['respiratory_rate'])
                patient_history['oxygen_saturation'].append(current_data['oxygen_saturation'])
                patient_history['temperature'].append(current_data['temperature'])
                patient_history['ecg_data'].append(current_data['ecg_data'][:20])
                
                # Limit history length
                max_history = 288  # 24 hours at 5-min intervals
                if len(patient_history['timestamps']) > max_history:
                    for key in patient_history:
                        patient_history[key] = patient_history[key][-max_history:]
                
                # Run AI analysis for alerts
                anomaly_results = anomaly_detector.detect(current_data, patient_history)
                predictions = lstm_predictor.predict(patient_history)
                risk_score, risk_factors = risk_calculator.calculate_risk(current_data, predictions, anomaly_results)
                
                # Check for alert conditions
                if risk_score > 0.15 or (risk_score > 0.05 and any(val for key, val in anomaly_results.items() if isinstance(val, bool) and val)):
                    alert = {
                        'timestamp': current_time,
                        'risk_score': risk_score,
                        'message': f"Abnormal vital signs detected with {int(risk_score*100)}% risk score",
                        'risk_factors': risk_factors,
                        'vitals': make_json_serializable(current_data)
                    }
                    if patient_id in alerts:
                        alerts[patient_id].append(alert)
                        # Keep only recent 10 alerts
                        if len(alerts[patient_id]) > 10:
                            alerts[patient_id].pop(0)
                    else:
                        alerts[patient_id] = [alert]
            except Exception as e:
                print(f"Error in background monitoring for patient {patient_id}: {e}")
        
        # Sleep before next update
        time.sleep(10)  # Update every 10 seconds

# Run the Flask app
if __name__ == '__main__':
    # Create directories
    os.makedirs('temp', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('static', exist_ok=True)
    
    # Start background monitoring in a separate thread
    monitoring_thread = threading.Thread(target=background_monitoring)
    monitoring_thread.daemon = True
    monitoring_thread.start()
    
    # Run the app
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)