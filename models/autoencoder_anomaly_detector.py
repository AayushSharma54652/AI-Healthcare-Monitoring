import numpy as np
import pandas as pd
import os
from sklearn.preprocessing import MinMaxScaler
from models.deep_autoencoder import DeepAutoencoder

class AutoencoderAnomalyDetector:
    """
    Enhanced anomaly detection system using deep autoencoders.
    
    This class detects anomalies in vital signs using a deep autoencoder
    model that learns normal patterns and identifies deviations. It integrates
    with the existing anomaly detection system but provides more advanced
    and accurate detection capabilities.
    """
    
    def __init__(self, config=None):
        """
        Initialize the autoencoder anomaly detector.
        
        Args:
            config (dict, optional): Configuration parameters
        """
        # Default configuration
        self.config = {
            'model_path': 'models/vital_signs_autoencoder.keras',
            'use_enhanced_detection': True,  # Whether to use autoencoder or fall back to traditional detection
            'feature_columns': [
                'heart_rate', 
                'blood_pressure_systolic', 
                'blood_pressure_diastolic',
                'respiratory_rate',
                'oxygen_saturation'
            ],
            'normal_ranges': {
                'heart_rate': (60, 100),
                'blood_pressure_systolic': (90, 140),
                'blood_pressure_diastolic': (60, 90),
                'respiratory_rate': (12, 20),
                'oxygen_saturation': (95, 100),
                'temperature': (97, 99)  # Fahrenheit
            },
        }
        
        # Update config if provided
        if config:
            self.config.update(config)
            
        # Initialize autoencoder model
        self.autoencoder = DeepAutoencoder({
            'input_dim': len(self.config['feature_columns']),
            'encoding_dims': [32, 16, 8],
            'model_path': self.config['model_path']
        })
        
        # Track model training status
        self.model_trained = os.path.exists(self.config['model_path'])
        
        # For tracking training data distribution
        self.scalers = {feature: MinMaxScaler() for feature in self.config['feature_columns']}
        
        print(f"Autoencoder Anomaly Detector initialized. Model trained: {self.model_trained}")
    
    def _convert_to_features_array(self, current_data):
        """
        Convert current_data dictionary to features array for the autoencoder.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            numpy.ndarray: Features array with shape (1, n_features)
        """
        # Extract features in the right order
        features = []
        for feature in self.config['feature_columns']:
            if feature == 'heart_rate':
                features.append(current_data['heart_rate'])
            elif feature == 'blood_pressure_systolic':
                features.append(current_data['blood_pressure'][0])
            elif feature == 'blood_pressure_diastolic':
                features.append(current_data['blood_pressure'][1])
            elif feature == 'respiratory_rate':
                features.append(current_data['respiratory_rate'])
            elif feature == 'oxygen_saturation':
                features.append(current_data['oxygen_saturation'])
                
        return np.array([features])
    
    def _check_range_anomalies(self, current_data):
        """
        Simple check if values are outside normal ranges (traditional method).
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            dict: Anomaly detection results
        """
        anomalies = {}
        
        # Check heart rate
        anomalies['heart_rate'] = not (self.config['normal_ranges']['heart_rate'][0] <= 
                                      current_data['heart_rate'] <= 
                                      self.config['normal_ranges']['heart_rate'][1])
        
        # Check blood pressure
        anomalies['blood_pressure_systolic'] = not (self.config['normal_ranges']['blood_pressure_systolic'][0] <= 
                                                   current_data['blood_pressure'][0] <= 
                                                   self.config['normal_ranges']['blood_pressure_systolic'][1])
        
        anomalies['blood_pressure_diastolic'] = not (self.config['normal_ranges']['blood_pressure_diastolic'][0] <= 
                                                    current_data['blood_pressure'][1] <= 
                                                    self.config['normal_ranges']['blood_pressure_diastolic'][1])
        
        # Check respiratory rate
        anomalies['respiratory_rate'] = not (self.config['normal_ranges']['respiratory_rate'][0] <= 
                                            current_data['respiratory_rate'] <= 
                                            self.config['normal_ranges']['respiratory_rate'][1])
        
        # Check oxygen saturation
        anomalies['oxygen_saturation'] = not (self.config['normal_ranges']['oxygen_saturation'][0] <= 
                                             current_data['oxygen_saturation'] <= 
                                             self.config['normal_ranges']['oxygen_saturation'][1])
        
        # Check temperature
        anomalies['temperature'] = not (self.config['normal_ranges']['temperature'][0] <= 
                                       current_data['temperature'] <= 
                                       self.config['normal_ranges']['temperature'][1])
        
        return anomalies
    
    def _prepare_training_data(self, history):
        """
        Prepare training data from patient history.
        
        Args:
            history (dict): Dictionary with patient history data
            
        Returns:
            numpy.ndarray: Training data with shape (samples, features)
        """
        data = []
        
        # Extract data points
        for i in range(len(history['timestamps'])):
            features = []
            
            for feature in self.config['feature_columns']:
                if feature == 'heart_rate':
                    features.append(history['heart_rate'][i])
                elif feature == 'blood_pressure_systolic':
                    features.append(history['blood_pressure_systolic'][i])
                elif feature == 'blood_pressure_diastolic':
                    features.append(history['blood_pressure_diastolic'][i])
                elif feature == 'respiratory_rate':
                    features.append(history['respiratory_rate'][i])
                elif feature == 'oxygen_saturation':
                    features.append(history['oxygen_saturation'][i])
                    
            data.append(features)
            
        return np.array(data)
    
    def train(self, history, validation_split=0.2, epochs=50, batch_size=32):
        """
        Train the autoencoder model on historical data.
        
        Args:
            history (dict): Dictionary with patient history data
            validation_split (float): Portion of data to use for validation
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            
        Returns:
            bool: True if training was successful
        """
        try:
            # Prepare training data
            training_data = self._prepare_training_data(history)
            
            if len(training_data) < 50:
                print("Not enough data for training (need at least 50 samples)")
                return False
            
            print(f"Training autoencoder with {len(training_data)} samples")
            
            # Train the model
            self.autoencoder.train(
                training_data, 
                epochs=epochs,
                batch_size=batch_size
            )
            
            # Update trained flag
            self.model_trained = True
            
            print("Autoencoder model training completed")
            return True
            
        except Exception as e:
            print(f"Error training autoencoder: {e}")
            return False
    
    def detect(self, current_data, history=None):
        """
        Detect anomalies in the current vital signs.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            history (dict, optional): Dictionary with patient history data
                for training if model not already trained
                
        Returns:
            dict: Anomaly detection results
        """
        # Train model if not trained and history is provided
        if not self.model_trained and history and len(history['timestamps']) > 50:
            print("Model not trained. Training now...")
            self.train(history)
        
        # Use enhanced detection if model is trained and feature is enabled
        if self.model_trained and self.config['use_enhanced_detection']:
            return self._detect_with_autoencoder(current_data)
        else:
            # Fall back to traditional range-based detection
            return self._check_range_anomalies(current_data)
    
    def _detect_with_autoencoder(self, current_data):
        """
        Detect anomalies using the autoencoder model.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            dict: Anomaly detection results
        """
        # Convert to features array
        features = self._convert_to_features_array(current_data)
        
        # Detect anomalies
        detection_results = self.autoencoder.detect_anomalies(features)
        
        # Map results to expected output format
        results = {}
        
        # Overall anomaly status
        is_anomaly = detection_results['is_anomaly'][0]
        
        # Feature-specific anomalies
        anomalous_features = detection_results['anomalous_features'][0]
        feature_scores = detection_results['feature_scores'][0]
        
        # Map to output format expected by the system
        for i, feature in enumerate(self.config['feature_columns']):
            if feature == 'heart_rate':
                results['heart_rate'] = bool(anomalous_features[i])
            elif feature == 'blood_pressure_systolic':
                results['blood_pressure_systolic'] = bool(anomalous_features[i])
            elif feature == 'blood_pressure_diastolic':
                results['blood_pressure_diastolic'] = bool(anomalous_features[i])
            elif feature == 'respiratory_rate':
                results['respiratory_rate'] = bool(anomalous_features[i])
            elif feature == 'oxygen_saturation':
                results['oxygen_saturation'] = bool(anomalous_features[i])
        
        # Add temperature (not processed by autoencoder)
        results['temperature'] = not (self.config['normal_ranges']['temperature'][0] <= 
                                     current_data['temperature'] <= 
                                     self.config['normal_ranges']['temperature'][1])
        
        # Add scores for more detailed analysis
        results['scores'] = {
            'heart_rate': float(feature_scores[self.config['feature_columns'].index('heart_rate')]),
            'blood_pressure': max(
                float(feature_scores[self.config['feature_columns'].index('blood_pressure_systolic')]),
                float(feature_scores[self.config['feature_columns'].index('blood_pressure_diastolic')])
            ),
            'respiratory_rate': float(feature_scores[self.config['feature_columns'].index('respiratory_rate')]),
            'oxygen_saturation': float(feature_scores[self.config['feature_columns'].index('oxygen_saturation')]),
            'temperature': 0.0,  # Not processed by autoencoder
            'overall': float(detection_results['anomaly_score'][0])
        }
        
        # Add reconstruction data for visualization
        reconstructed_features = self.autoencoder.reconstruct(features)[0]
        results['reconstruction'] = {
            'heart_rate': float(reconstructed_features[self.config['feature_columns'].index('heart_rate')]),
            'blood_pressure_systolic': float(reconstructed_features[self.config['feature_columns'].index('blood_pressure_systolic')]),
            'blood_pressure_diastolic': float(reconstructed_features[self.config['feature_columns'].index('blood_pressure_diastolic')]),
            'respiratory_rate': float(reconstructed_features[self.config['feature_columns'].index('respiratory_rate')]),
            'oxygen_saturation': float(reconstructed_features[self.config['feature_columns'].index('oxygen_saturation')])
        }
        
        return results
    
    def get_latent_features(self, current_data):
        """
        Get latent space representation of current data.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            numpy.ndarray: Latent representation
        """
        if not self.model_trained:
            return None
            
        # Convert to features array
        features = self._convert_to_features_array(current_data)
        
        # Get latent representation
        return self.autoencoder.encode(features)[0]
    
    def visualize_current_data(self, current_data):
        """
        Create visualization of current data vs. reconstruction.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            matplotlib.figure.Figure: Matplotlib figure
        """
        if not self.model_trained:
            return None
            
        # Convert to features array
        features = self._convert_to_features_array(current_data)
        
        # Visualize
        return self.autoencoder.visualize_reconstructions(features)
    
    def explain_anomalies(self, current_data):
        """
        Generate human-readable explanation of detected anomalies.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            dict: Explanation of anomalies
        """
        if not self.model_trained or not self.config['use_enhanced_detection']:
            return None
            
        # Get anomaly detection results
        results = self._detect_with_autoencoder(current_data)
        
        # Initialize explanation
        explanation = {
            'is_anomaly': any(v for k, v in results.items() if k not in ['scores', 'reconstruction']),
            'anomalous_features': [],
            'details': [],
            'severity': 'normal',
            'summary': ''
        }
        
        # Check each feature
        for feature, is_anomalous in results.items():
            if feature in ['scores', 'reconstruction']:
                continue
                
            if is_anomalous:
                explanation['anomalous_features'].append(feature)
                
                # Get current and normal values
                if feature == 'heart_rate':
                    current_value = current_data['heart_rate']
                    normal_range = self.config['normal_ranges']['heart_rate']
                    expected_value = results['reconstruction']['heart_rate']
                    detail = f"Heart rate is {current_value} BPM (expected around {expected_value:.1f}, normal range: {normal_range[0]}-{normal_range[1]})"
                    
                elif feature == 'blood_pressure_systolic':
                    current_value = current_data['blood_pressure'][0]
                    normal_range = self.config['normal_ranges']['blood_pressure_systolic']
                    expected_value = results['reconstruction']['blood_pressure_systolic']
                    detail = f"Systolic blood pressure is {current_value} mmHg (expected around {expected_value:.1f}, normal range: {normal_range[0]}-{normal_range[1]})"
                    
                elif feature == 'blood_pressure_diastolic':
                    current_value = current_data['blood_pressure'][1]
                    normal_range = self.config['normal_ranges']['blood_pressure_diastolic']
                    expected_value = results['reconstruction']['blood_pressure_diastolic']
                    detail = f"Diastolic blood pressure is {current_value} mmHg (expected around {expected_value:.1f}, normal range: {normal_range[0]}-{normal_range[1]})"
                    
                elif feature == 'respiratory_rate':
                    current_value = current_data['respiratory_rate']
                    normal_range = self.config['normal_ranges']['respiratory_rate']
                    expected_value = results['reconstruction']['respiratory_rate']
                    detail = f"Respiratory rate is {current_value} breaths/min (expected around {expected_value:.1f}, normal range: {normal_range[0]}-{normal_range[1]})"
                    
                elif feature == 'oxygen_saturation':
                    current_value = current_data['oxygen_saturation']
                    normal_range = self.config['normal_ranges']['oxygen_saturation']
                    expected_value = results['reconstruction']['oxygen_saturation']
                    detail = f"Oxygen saturation is {current_value}% (expected around {expected_value:.1f}, normal range: {normal_range[0]}-{normal_range[1]})"
                    
                elif feature == 'temperature':
                    current_value = current_data['temperature']
                    normal_range = self.config['normal_ranges']['temperature']
                    # No reconstruction for temperature
                    detail = f"Temperature is {current_value}°F (normal range: {normal_range[0]}-{normal_range[1]})"
                
                explanation['details'].append(detail)
        
        # Determine severity based on scores
        if results['scores']['overall'] > 0.5:
            explanation['severity'] = 'critical'
        elif results['scores']['overall'] > 0.2:
            explanation['severity'] = 'warning'
        else:
            explanation['severity'] = 'normal'
            
        # Generate summary
        if explanation['is_anomaly']:
            if explanation['severity'] == 'critical':
                explanation['summary'] = f"Critical anomaly detected in {len(explanation['anomalous_features'])} vital signs"
            else:
                explanation['summary'] = f"Unusual pattern detected in {len(explanation['anomalous_features'])} vital signs"
        else:
            explanation['summary'] = "All vital signs within normal patterns"
            
        return explanation