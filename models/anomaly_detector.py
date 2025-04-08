import numpy as np
from sklearn.ensemble import IsolationForest
import pandas as pd

class AnomalyDetector:
    def __init__(self):
        # Initialize models
        self.isolation_forest = {
            'heart_rate': IsolationForest(contamination=0.05, random_state=42),
            'blood_pressure': IsolationForest(contamination=0.05, random_state=42),
            'respiratory_rate': IsolationForest(contamination=0.05, random_state=42),
            'oxygen_saturation': IsolationForest(contamination=0.05, random_state=42),
            'temperature': IsolationForest(contamination=0.05, random_state=42)
        }
        
        # Normal ranges for quick checks
        self.normal_ranges = {
            'heart_rate': (60, 100),
            'blood_pressure_systolic': (90, 140),
            'blood_pressure_diastolic': (60, 90),
            'respiratory_rate': (12, 20),
            'oxygen_saturation': (95, 100),
            'temperature': (97, 99)  # Fahrenheit
        }
        
        # Track if models have been trained
        self.models_trained = False
    
    def _train_models(self, history):
        """Train anomaly detection models on historical data"""
        # Prepare data for training
        heart_rate_data = np.array(history['heart_rate']).reshape(-1, 1)
        blood_pressure_data = np.column_stack((
            history['blood_pressure_systolic'],
            history['blood_pressure_diastolic']
        ))
        respiratory_rate_data = np.array(history['respiratory_rate']).reshape(-1, 1)
        oxygen_saturation_data = np.array(history['oxygen_saturation']).reshape(-1, 1)
        temperature_data = np.array(history['temperature']).reshape(-1, 1)
        
        # Train models
        self.isolation_forest['heart_rate'].fit(heart_rate_data)
        self.isolation_forest['blood_pressure'].fit(blood_pressure_data)
        self.isolation_forest['respiratory_rate'].fit(respiratory_rate_data)
        self.isolation_forest['oxygen_saturation'].fit(oxygen_saturation_data)
        self.isolation_forest['temperature'].fit(temperature_data)
        
        self.models_trained = True
    
    def _check_range_anomalies(self, current_data):
        """Simple check if values are outside normal ranges"""
        anomalies = {}
        
        anomalies['heart_rate'] = not (self.normal_ranges['heart_rate'][0] <= 
                                      current_data['heart_rate'] <= 
                                      self.normal_ranges['heart_rate'][1])
        
        anomalies['blood_pressure_systolic'] = not (self.normal_ranges['blood_pressure_systolic'][0] <= 
                                                   current_data['blood_pressure'][0] <= 
                                                   self.normal_ranges['blood_pressure_systolic'][1])
        
        anomalies['blood_pressure_diastolic'] = not (self.normal_ranges['blood_pressure_diastolic'][0] <= 
                                                    current_data['blood_pressure'][1] <= 
                                                    self.normal_ranges['blood_pressure_diastolic'][1])
        
        anomalies['respiratory_rate'] = not (self.normal_ranges['respiratory_rate'][0] <= 
                                            current_data['respiratory_rate'] <= 
                                            self.normal_ranges['respiratory_rate'][1])
        
        anomalies['oxygen_saturation'] = not (self.normal_ranges['oxygen_saturation'][0] <= 
                                             current_data['oxygen_saturation'] <= 
                                             self.normal_ranges['oxygen_saturation'][1])
        
        anomalies['temperature'] = not (self.normal_ranges['temperature'][0] <= 
                                       current_data['temperature'] <= 
                                       self.normal_ranges['temperature'][1])
        
        return anomalies
    
    def _check_model_anomalies(self, current_data):
        """Use trained models to detect anomalies"""
        anomalies = {}
        
        # Prepare current data points
        heart_rate_point = np.array([current_data['heart_rate']]).reshape(1, -1)
        blood_pressure_point = np.array([
            current_data['blood_pressure'][0],
            current_data['blood_pressure'][1]
        ]).reshape(1, -1)
        respiratory_rate_point = np.array([current_data['respiratory_rate']]).reshape(1, -1)
        oxygen_saturation_point = np.array([current_data['oxygen_saturation']]).reshape(1, -1)
        temperature_point = np.array([current_data['temperature']]).reshape(1, -1)
        
        # Predict anomalies (1 is normal, -1 is anomaly)
        heart_rate_pred = self.isolation_forest['heart_rate'].predict(heart_rate_point)[0] == -1
        blood_pressure_pred = self.isolation_forest['blood_pressure'].predict(blood_pressure_point)[0] == -1
        respiratory_rate_pred = self.isolation_forest['respiratory_rate'].predict(respiratory_rate_point)[0] == -1
        oxygen_saturation_pred = self.isolation_forest['oxygen_saturation'].predict(oxygen_saturation_point)[0] == -1
        temperature_pred = self.isolation_forest['temperature'].predict(temperature_point)[0] == -1
        
        # Get anomaly scores (lower is more anomalous)
        heart_rate_score = self.isolation_forest['heart_rate'].decision_function(heart_rate_point)[0]
        blood_pressure_score = self.isolation_forest['blood_pressure'].decision_function(blood_pressure_point)[0]
        respiratory_rate_score = self.isolation_forest['respiratory_rate'].decision_function(respiratory_rate_point)[0]
        oxygen_saturation_score = self.isolation_forest['oxygen_saturation'].decision_function(oxygen_saturation_point)[0]
        temperature_score = self.isolation_forest['temperature'].decision_function(temperature_point)[0]
        
        # Store results
        anomalies['heart_rate'] = {
            'is_anomaly': heart_rate_pred,
            'score': heart_rate_score
        }
        
        anomalies['blood_pressure'] = {
            'is_anomaly': blood_pressure_pred,
            'score': blood_pressure_score
        }
        
        anomalies['respiratory_rate'] = {
            'is_anomaly': respiratory_rate_pred,
            'score': respiratory_rate_score
        }
        
        anomalies['oxygen_saturation'] = {
            'is_anomaly': oxygen_saturation_pred,
            'score': oxygen_saturation_score
        }
        
        anomalies['temperature'] = {
            'is_anomaly': temperature_pred,
            'score': temperature_score
        }
        
        return anomalies
    
    def detect(self, current_data, history):
        """Detect anomalies in the current vital signs"""
        # Train models if not already trained
        if not self.models_trained and len(history['heart_rate']) > 30:
            self._train_models(history)
        
        # Simple range check for basic anomalies
        range_anomalies = self._check_range_anomalies(current_data)
        
        # Model-based anomaly detection if models are trained
        if self.models_trained:
            model_anomalies = self._check_model_anomalies(current_data)
            
            # Combine results (use more sophisticated model results when available)
            results = {
                'heart_rate': model_anomalies['heart_rate']['is_anomaly'],
                'blood_pressure_systolic': model_anomalies['blood_pressure']['is_anomaly'],
                'blood_pressure_diastolic': model_anomalies['blood_pressure']['is_anomaly'],
                'respiratory_rate': model_anomalies['respiratory_rate']['is_anomaly'],
                'oxygen_saturation': model_anomalies['oxygen_saturation']['is_anomaly'],
                'temperature': model_anomalies['temperature']['is_anomaly'],
                'scores': {
                    'heart_rate': model_anomalies['heart_rate']['score'],
                    'blood_pressure': model_anomalies['blood_pressure']['score'],
                    'respiratory_rate': model_anomalies['respiratory_rate']['score'],
                    'oxygen_saturation': model_anomalies['oxygen_saturation']['score'],
                    'temperature': model_anomalies['temperature']['score']
                }
            }
        else:
            # Use simple range check results if models aren't trained yet
            results = range_anomalies
            results['scores'] = {
                'heart_rate': 0,
                'blood_pressure': 0,
                'respiratory_rate': 0,
                'oxygen_saturation': 0,
                'temperature': 0
            }
        
        return results