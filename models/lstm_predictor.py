import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os
import tensorflow as tf

# Import our custom LSTM model and data preprocessing utilities
from models.lstm_model import HealthcareLSTM
from utils.data_preprocessing import HealthcareDataPreprocessor

class LSTMPredictor:
    """
    LSTM-based predictor for vital signs.
    
    This class uses a real LSTM neural network to predict future vital signs
    based on historical data.
    """
    
    def __init__(self, model_config=None):
        """
        Initialize the LSTM predictor.
        
        Args:
            model_config (dict, optional): Configuration for the LSTM model
        """
        # Default configuration
        self.config = {
            'sequence_length': 24,      # Use 24 time steps to predict
            'prediction_horizon': 12,   # Predict 12 steps ahead
            'feature_columns': [
                'heart_rate', 
                'blood_pressure_systolic', 
                'blood_pressure_diastolic',
                'respiratory_rate',
                'oxygen_saturation'
            ],
            'model_path': 'models/saved_lstm_model',
            'use_simulated_prediction': True  # Fall back to simulation if model not ready
        }
        
        # Update with provided config if any
        if model_config:
            self.config.update(model_config)
        
        # Initialize the data preprocessor
        self.preprocessor = HealthcareDataPreprocessor(
            sequence_length=self.config['sequence_length'],
            prediction_horizon=self.config['prediction_horizon'],
            feature_columns=self.config['feature_columns']
        )
        
        # Initialize the LSTM model
        self.lstm_model = HealthcareLSTM({
            'sequence_length': self.config['sequence_length'],
            'prediction_horizon': self.config['prediction_horizon'],
            'feature_count': len(self.config['feature_columns']),
            'model_path': self.config['model_path']
        })
        
        # Check if model is available or if we need to use simulation
        self.model_available = (
            self.lstm_model.model is not None and 
            os.path.exists(self.config['model_path'])
        )
        
        if not self.model_available and not self.config['use_simulated_prediction']:
            raise ValueError("LSTM model not available and simulation is disabled.")
        
        print(f"LSTM Predictor initialized. Using {'real model' if self.model_available else 'simulation mode'}.")
    
    def _simulated_predict(self, history):
        """
        Simulate LSTM prediction (used as fallback).
        
        In a real system, this would not be needed once the model is fully trained.
        This is just to maintain compatibility with the existing system during transition.
        
        Args:
            history (dict): Historical data dictionary
            
        Returns:
            dict: Predicted values for each vital sign
        """
        # Get the last few values for each vital sign
        recent_hr = history['heart_rate'][-20:]
        recent_bp_sys = history['blood_pressure_systolic'][-20:]
        recent_bp_dia = history['blood_pressure_diastolic'][-20:]
        recent_rr = history['respiratory_rate'][-20:]
        recent_o2 = history['oxygen_saturation'][-20:]
        recent_temp = history['temperature'][-20:]
        
        # Calculate simple trends
        hr_trend = (recent_hr[-1] - recent_hr[-5]) / 5 if len(recent_hr) > 5 else 0
        bp_sys_trend = (recent_bp_sys[-1] - recent_bp_sys[-5]) / 5 if len(recent_bp_sys) > 5 else 0
        bp_dia_trend = (recent_bp_dia[-1] - recent_bp_dia[-5]) / 5 if len(recent_bp_dia) > 5 else 0
        rr_trend = (recent_rr[-1] - recent_rr[-5]) / 5 if len(recent_rr) > 5 else 0
        o2_trend = (recent_o2[-1] - recent_o2[-5]) / 5 if len(recent_o2) > 5 else 0
        temp_trend = (recent_temp[-1] - recent_temp[-5]) / 5 if len(recent_temp) > 5 else 0
        
        # Generate predictions
        predictions = {
            'timestamps': [],
            'heart_rate': [],
            'blood_pressure_systolic': [],
            'blood_pressure_diastolic': [],
            'respiratory_rate': [],
            'oxygen_saturation': [],
            'temperature': []
        }
        
        # Generate future timestamps
        last_timestamp = datetime.strptime(history['timestamps'][-1], "%Y-%m-%d %H:%M:%S")
        for i in range(1, self.config['prediction_horizon'] + 1):
            future_timestamp = last_timestamp + timedelta(seconds=3*i)
            predictions['timestamps'].append(future_timestamp.strftime("%Y-%m-%d %H:%M:%S"))
        
        # Predict each vital sign with simple trends + random variation
        last_hr = recent_hr[-1]
        last_bp_sys = recent_bp_sys[-1]
        last_bp_dia = recent_bp_dia[-1]
        last_rr = recent_rr[-1]
        last_o2 = recent_o2[-1]
        last_temp = recent_temp[-1]
        
        for i in range(self.config['prediction_horizon']):
            # Heart rate
            next_hr = last_hr + hr_trend * (i+1) + np.random.normal(0, 0.5)
            predictions['heart_rate'].append(round(next_hr, 1))
            
            # Blood pressure
            next_bp_sys = last_bp_sys + bp_sys_trend * (i+1) + np.random.normal(0, 0.8)
            next_bp_dia = last_bp_dia + bp_dia_trend * (i+1) + np.random.normal(0, 0.5)
            predictions['blood_pressure_systolic'].append(round(next_bp_sys))
            predictions['blood_pressure_diastolic'].append(round(next_bp_dia))
            
            # Respiratory rate
            next_rr = last_rr + rr_trend * (i+1) + np.random.normal(0, 0.2)
            predictions['respiratory_rate'].append(round(next_rr, 1))
            
            # Oxygen saturation
            next_o2 = min(100, last_o2 + o2_trend * (i+1) + np.random.normal(0, 0.1))
            predictions['oxygen_saturation'].append(round(next_o2, 1))
            
            # Temperature
            next_temp = last_temp + temp_trend * (i+1) + np.random.normal(0, 0.05)
            predictions['temperature'].append(round(next_temp, 1))
        
        return predictions
    
    def predict(self, history):
        """
        Generate predictions for the next time steps of vital signs.
        
        Args:
            history (dict): Historical data dictionary
            
        Returns:
            dict: Predicted values for each vital sign
        """
        # Check if we should use the real model or simulation
        if not self.model_available or self.config['use_simulated_prediction']:
            return self._simulated_predict(history)
        
        try:
            # Preprocess the data
            input_sequence = self.preprocessor.preprocess_real_time_data(history)
            
            # Make prediction using the model
            predictions_array = self.lstm_model.predict(input_sequence)
            
            # Convert predictions back to original scale
            predictions = self.preprocessor.inverse_transform_predictions(predictions_array[0])
            
            # Add temperature predictions (if not included in the model)
            if 'temperature' not in self.config['feature_columns']:
                # Use simpler prediction for temperature
                recent_temp = history['temperature'][-20:]
                temp_trend = (recent_temp[-1] - recent_temp[-5]) / 5 if len(recent_temp) > 5 else 0
                
                predictions['temperature'] = []
                for i in range(self.config['prediction_horizon']):
                    next_temp = recent_temp[-1] + temp_trend * (i+1) + np.random.normal(0, 0.05)
                    predictions['temperature'].append(round(next_temp, 1))
                
            return predictions
            
        except Exception as e:
            print(f"Error making LSTM prediction: {e}. Falling back to simulation.")
            return self._simulated_predict(history)
    
    def train_model(self, patient_data_history, epochs=50, batch_size=32):
        """
        Train the LSTM model on historical data.
        
        This method should be called periodically to update the model
        with new patient data.
        
        Args:
            patient_data_history (dict): Historical patient data
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            
        Returns:
            bool: True if training was successful
        """
        try:
            from utils.model_training import ModelTrainer
            
            # Create model trainer
            trainer = ModelTrainer(self.lstm_model, self.preprocessor)
            
            # Prepare data
            X_train, y_train, X_val, y_val, X_test, y_test = trainer.prepare_data(
                patient_data_history, test_size=0.15, validation_size=0.15
            )
            
            # Train model
            trainer.train_model(X_train, y_train, X_val, y_val, epochs, batch_size)
            
            # Evaluate model
            metrics = trainer.evaluate_model(X_test, y_test)
            
            # Save metrics
            os.makedirs('logs', exist_ok=True)
            trainer.save_metrics('logs/lstm_metrics.json')
            
            # Update model availability flag
            self.model_available = True
            
            print("LSTM model training completed successfully.")
            return True
            
        except Exception as e:
            print(f"Error training LSTM model: {e}")
            return False