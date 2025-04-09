import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime

class HealthcareDataPreprocessor:
    """
    Preprocessor for healthcare monitoring data to prepare it for LSTM modeling.
    Handles normalization, sequence creation, and feature extraction.
    """
    
    def __init__(self, sequence_length=24, prediction_horizon=12, feature_columns=None):
        """
        Initialize the data preprocessor.
        
        Args:
            sequence_length (int): Number of time steps to use for prediction
            prediction_horizon (int): Number of time steps to predict ahead
            feature_columns (list): List of column names to use as features
        """
        self.sequence_length = sequence_length
        self.prediction_horizon = prediction_horizon
        
        # Default feature columns if none provided
        if feature_columns is None:
            self.feature_columns = [
                'heart_rate', 
                'blood_pressure_systolic', 
                'blood_pressure_diastolic',
                'respiratory_rate',
                'oxygen_saturation'
                # 'temperature' - can be added if needed
            ]
        else:
            self.feature_columns = feature_columns
        
        # Initialize scalers for each feature
        self.scalers = {feature: MinMaxScaler(feature_range=(0, 1)) 
                        for feature in self.feature_columns}
    
    def convert_to_dataframe(self, patient_data_history):
        """
        Convert the patient_data_history dictionary to a pandas DataFrame.
        
        Args:
            patient_data_history (dict): Dictionary with time series data
            
        Returns:
            pd.DataFrame: DataFrame with timestamps and features
        """
        # Create initial dataframe
        df = pd.DataFrame({
            'timestamp': patient_data_history['timestamps'],
            'heart_rate': patient_data_history['heart_rate'],
            'blood_pressure_systolic': patient_data_history['blood_pressure_systolic'],
            'blood_pressure_diastolic': patient_data_history['blood_pressure_diastolic'],
            'respiratory_rate': patient_data_history['respiratory_rate'],
            'oxygen_saturation': patient_data_history['oxygen_saturation'],
            'temperature': patient_data_history['temperature']
        })
        
        # Convert timestamp strings to datetime objects
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp to ensure chronological order
        df = df.sort_values('timestamp')
        
        return df
    
    def normalize_data(self, df):
        """
        Normalize each feature to [0,1] range.
        
        Args:
            df (pd.DataFrame): DataFrame with features
            
        Returns:
            pd.DataFrame: DataFrame with normalized features
        """
        normalized_df = df.copy()
        
        # Normalize each feature separately
        for feature in self.feature_columns:
            feature_data = df[feature].values.reshape(-1, 1)
            self.scalers[feature].fit(feature_data)
            normalized_df[feature] = self.scalers[feature].transform(feature_data)
        
        return normalized_df
    
    def create_sequences(self, df):
        """
        Create sequences for LSTM training from normalized dataframe.
        
        Args:
            df (pd.DataFrame): DataFrame with normalized features
            
        Returns:
            tuple: (X, y) where X is input sequences and y is target sequences
        """
        X = []
        y = []
        
        # Extract feature arrays
        feature_data = df[self.feature_columns].values
        
        # Create sequences
        for i in range(len(df) - self.sequence_length - self.prediction_horizon + 1):
            # Input sequence
            X.append(feature_data[i:i+self.sequence_length])
            
            # Target sequence (next prediction_horizon time steps for all features)
            target_sequence = feature_data[i+self.sequence_length:i+self.sequence_length+self.prediction_horizon]
            # Flatten the target sequence for multi-output prediction
            y.append(target_sequence.flatten())
        
        return np.array(X), np.array(y)
    
    def inverse_transform_predictions(self, predictions):
        """
        Rescale predictions back to original scale.
        
        Args:
            predictions (numpy.ndarray): Predicted values in normalized scale
                                        Shape: [samples, prediction_horizon * features]
        
        Returns:
            dict: Dictionary with denormalized predictions for each feature
        """
        # Reshape predictions for each feature
        predictions_shaped = predictions.reshape((-1, self.prediction_horizon, len(self.feature_columns)))
        
        # Create dictionary to store denormalized predictions
        results = {
            'timestamps': [],
            'heart_rate': [],
            'blood_pressure_systolic': [],
            'blood_pressure_diastolic': [],
            'respiratory_rate': [],
            'oxygen_saturation': []
        }
        
        # Generate future timestamps (placeholder - would be replaced with actual logic)
        base_time = datetime.now()
        for i in range(self.prediction_horizon):
            # This assumes 3 seconds between readings, adjust as needed
            future_time = base_time.timestamp() + (i * 3)
            formatted_time = datetime.fromtimestamp(future_time).strftime("%Y-%m-%d %H:%M:%S")
            results['timestamps'].append(formatted_time)
        
        # Denormalize each feature
        for i, feature in enumerate(self.feature_columns):
            # Extract predictions for this feature
            feature_predictions = predictions_shaped[0, :, i].reshape(-1, 1)
            
            # Inverse transform to original scale
            denormalized = self.scalers[feature].inverse_transform(feature_predictions).flatten()
            
            # Store in results dictionary
            results[feature] = denormalized.tolist()
        
        return results
    
    def preprocess_real_time_data(self, patient_data_history):
        """
        Preprocess real-time data for prediction.
        
        Args:
            patient_data_history (dict): Dictionary with patient's history
            
        Returns:
            numpy.ndarray: Preprocessed input for LSTM prediction
        """
        # Convert to dataframe
        df = self.convert_to_dataframe(patient_data_history)
        
        # Normalize data
        normalized_df = self.normalize_data(df)
        
        # Use the last sequence_length time steps as input
        if len(normalized_df) >= self.sequence_length:
            input_data = normalized_df[self.feature_columns].values[-self.sequence_length:]
            input_sequence = np.array([input_data])
            return input_sequence
        else:
            raise ValueError(f"Not enough data points. Need at least {self.sequence_length} time steps.")