import numpy as np
import pandas as pd
from datetime import datetime, timedelta

class LSTMPredictor:
    """
    Simulated LSTM predictor for vital signs
    
    Note: In a real system, this would use TensorFlow or PyTorch to implement
    actual LSTM networks. For this demo, we'll simulate the predictions.
    """
    
    def __init__(self):
        # In a real system, we would load pre-trained models here
        self.prediction_horizon = 12  # Predict 12 readings ahead (36 seconds at 3s intervals)
    
    def _preprocess_data(self, history):
        """Convert history dict to dataframe for analysis"""
        df = pd.DataFrame({
            'timestamp': history['timestamps'],
            'heart_rate': history['heart_rate'],
            'blood_pressure_systolic': history['blood_pressure_systolic'],
            'blood_pressure_diastolic': history['blood_pressure_diastolic'],
            'respiratory_rate': history['respiratory_rate'],
            'oxygen_saturation': history['oxygen_saturation'],
            'temperature': history['temperature']
        })
        
        # Convert timestamp strings to datetime objects
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    
    def _predict_next_values(self, series, num_points=12):
        """
        Simulate LSTM prediction for a time series
        
        In a real system, this would use an actual LSTM model to predict future values.
        For demo purposes, we're using a simple linear trend + last value prediction.
        """
        # Get the last few values
        recent_values = series[-20:]
        
        # Calculate a simple trend
        if len(recent_values) > 5:
            trend = (recent_values[-1] - recent_values[-5]) / 5
        else:
            trend = 0
        
        # Predict future values with slight random variation
        predictions = []
        last_value = recent_values[-1]
        
        for i in range(num_points):
            next_value = last_value + trend * (i+1) + np.random.normal(0, 0.5)
            predictions.append(next_value)
            
        return predictions
    
    def predict(self, history):
        """Generate predictions for the next hour of vital signs"""
        # Preprocess historical data
        df = self._preprocess_data(history)
        
        # Make predictions for each vital sign
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
        last_timestamp = df['timestamp'].iloc[-1]
        for i in range(1, self.prediction_horizon + 1):
            future_timestamp = last_timestamp + timedelta(seconds=3*i)
            predictions['timestamps'].append(future_timestamp.strftime("%Y-%m-%d %H:%M:%S"))
        
        # Predict each vital sign
        predictions['heart_rate'] = self._predict_next_values(df['heart_rate'].values)
        predictions['blood_pressure_systolic'] = self._predict_next_values(df['blood_pressure_systolic'].values)
        predictions['blood_pressure_diastolic'] = self._predict_next_values(df['blood_pressure_diastolic'].values)
        predictions['respiratory_rate'] = self._predict_next_values(df['respiratory_rate'].values)
        predictions['oxygen_saturation'] = self._predict_next_values(df['oxygen_saturation'].values)
        predictions['temperature'] = self._predict_next_values(df['temperature'].values)
        
        # Round the values for display
        predictions['heart_rate'] = [round(x, 1) for x in predictions['heart_rate']]
        predictions['blood_pressure_systolic'] = [round(x) for x in predictions['blood_pressure_systolic']]
        predictions['blood_pressure_diastolic'] = [round(x) for x in predictions['blood_pressure_diastolic']]
        predictions['respiratory_rate'] = [round(x, 1) for x in predictions['respiratory_rate']]
        predictions['oxygen_saturation'] = [round(x, 1) for x in predictions['oxygen_saturation']]
        predictions['temperature'] = [round(x, 1) for x in predictions['temperature']]
        
        return predictions