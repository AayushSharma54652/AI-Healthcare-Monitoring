import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import os
import json
from datetime import datetime

class ModelTrainer:
    """
    Utility for training LSTM models on healthcare monitoring data.
    Handles the entire training process, including data splitting,
    model training, evaluation, and visualization of results.
    """
    
    def __init__(self, lstm_model, data_preprocessor):
        """
        Initialize the model trainer.
        
        Args:
            lstm_model: An instance of the HealthcareLSTM class
            data_preprocessor: An instance of the HealthcareDataPreprocessor class
        """
        self.lstm_model = lstm_model
        self.data_preprocessor = data_preprocessor
        self.training_history = None
        self.metrics = {}
    
    def prepare_data(self, patient_data_history, test_size=0.2, validation_size=0.2):
        """
        Prepare the data for training by creating sequences and splitting into sets.
        
        Args:
            patient_data_history (dict): Dictionary with patient history data
            test_size (float): Proportion of data to use for testing
            validation_size (float): Proportion of training data to use for validation
            
        Returns:
            tuple: (X_train, y_train, X_val, y_val, X_test, y_test)
        """
        # Convert to dataframe and normalize
        df = self.data_preprocessor.convert_to_dataframe(patient_data_history)
        normalized_df = self.data_preprocessor.normalize_data(df)
        
        # Create sequences
        X, y = self.data_preprocessor.create_sequences(normalized_df)
        
        # First split: training+validation and test
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y, test_size=test_size, shuffle=False  # No shuffle to preserve time series order
        )
        
        # Second split: training and validation
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=validation_size, shuffle=False
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        return X_train, y_train, X_val, y_val, X_test, y_test
    
    def train_model(self, X_train, y_train, X_val, y_val, epochs=50, batch_size=32):
        """
        Train the LSTM model on the prepared data.
        
        Args:
            X_train (numpy.ndarray): Training input sequences
            y_train (numpy.ndarray): Training target sequences
            X_val (numpy.ndarray): Validation input sequences
            y_val (numpy.ndarray): Validation target sequences
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            
        Returns:
            History object with training metrics
        """
        print("Starting model training...")
        self.training_history = self.lstm_model.train(
            X_train, y_train, X_val, y_val, epochs, batch_size
        )
        print("Model training completed.")
        return self.training_history
    
    def evaluate_model(self, X_test, y_test):
        """
        Evaluate the trained model on test data.
        
        Args:
            X_test (numpy.ndarray): Test input sequences
            y_test (numpy.ndarray): Test target sequences
            
        Returns:
            dict: Evaluation metrics
        """
        print("Evaluating model on test data...")
        test_loss = self.lstm_model.model.evaluate(X_test, y_test, verbose=1)
        
        # Make predictions on test data
        y_pred = self.lstm_model.model.predict(X_test)
        
        # Calculate MSE for each feature and time step
        prediction_horizon = self.data_preprocessor.prediction_horizon
        feature_count = len(self.data_preprocessor.feature_columns)
        
        # Reshape predictions and targets
        y_test_reshaped = y_test.reshape(-1, prediction_horizon, feature_count)
        y_pred_reshaped = y_pred.reshape(-1, prediction_horizon, feature_count)
        
        # Calculate errors per feature and time step
        feature_errors = {}
        for i, feature in enumerate(self.data_preprocessor.feature_columns):
            # Get predictions and actual values for this feature
            y_true_feature = y_test_reshaped[:, :, i]
            y_pred_feature = y_pred_reshaped[:, :, i]
            
            # Calculate mean squared error per time step
            mse_per_step = np.mean((y_true_feature - y_pred_feature) ** 2, axis=0)
            
            # Store in dictionary
            feature_errors[feature] = {
                'mse_per_step': mse_per_step.tolist(),
                'avg_mse': np.mean(mse_per_step)
            }
        
        # Store metrics
        self.metrics = {
            'test_loss': test_loss,
            'feature_errors': feature_errors,
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        print(f"Test loss: {test_loss}")
        for feature, errors in feature_errors.items():
            print(f"{feature} average MSE: {errors['avg_mse']:.6f}")
        
        return self.metrics
    
    def visualize_training_history(self, save_path=None):
        """
        Plot training and validation loss.
        
        Args:
            save_path (str, optional): Path to save the plot
        """
        if self.training_history is None:
            print("No training history available. Train the model first.")
            return
        
        plt.figure(figsize=(10, 6))
        plt.plot(self.training_history.history['loss'], label='Training Loss')
        
        if 'val_loss' in self.training_history.history:
            plt.plot(self.training_history.history['val_loss'], label='Validation Loss')
        
        plt.title('LSTM Model Training Performance')
        plt.ylabel('Loss (MSE)')
        plt.xlabel('Epoch')
        plt.legend()
        plt.grid(True)
        
        if save_path:
            plt.savefig(save_path)
            print(f"Training history plot saved to {save_path}")
        
        plt.show()
    
    def visualize_predictions(self, input_sequence, actual_values=None, save_path=None):
        """
        Visualize model predictions compared to actual values if available.
        
        Args:
            input_sequence (numpy.ndarray): Input sequence for prediction
            actual_values (numpy.ndarray, optional): Actual future values
            save_path (str, optional): Path to save the plot
        """
        # Make prediction
        predictions = self.lstm_model.predict(input_sequence)
        
        # Reshape and denormalize
        predictions_flat = predictions[0].flatten()
        predictions_shaped = predictions_flat.reshape(self.data_preprocessor.prediction_horizon, 
                                                    len(self.data_preprocessor.feature_columns))
        
        # Denormalize predictions
        denormalized_predictions = {}
        for i, feature in enumerate(self.data_preprocessor.feature_columns):
            feature_predictions = predictions_shaped[:, i].reshape(-1, 1)
            denormalized = self.data_preprocessor.scalers[feature].inverse_transform(feature_predictions).flatten()
            denormalized_predictions[feature] = denormalized
        
        # Create figure with subplots for each feature
        feature_count = len(self.data_preprocessor.feature_columns)
        plt.figure(figsize=(15, 4 * feature_count))
        
        # Time steps for x-axis
        time_steps = range(1, self.data_preprocessor.prediction_horizon + 1)
        
        # Plot each feature
        for i, feature in enumerate(self.data_preprocessor.feature_columns):
            plt.subplot(feature_count, 1, i + 1)
            
            # Plot predictions
            plt.plot(time_steps, denormalized_predictions[feature], 'b-', label='Predictions')
            
            # Plot actual values if available
            if actual_values is not None:
                actual_shaped = actual_values.reshape(self.data_preprocessor.prediction_horizon, 
                                                    len(self.data_preprocessor.feature_columns))
                actual_feature = actual_shaped[:, i].reshape(-1, 1)
                denormalized_actual = self.data_preprocessor.scalers[feature].inverse_transform(actual_feature).flatten()
                plt.plot(time_steps, denormalized_actual, 'r-', label='Actual')
            
            plt.title(f'{feature} Prediction')
            plt.xlabel('Time Step')
            plt.ylabel(feature)
            plt.grid(True)
            plt.legend()
        
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path)
            print(f"Predictions plot saved to {save_path}")
        
        plt.show()
    
    def save_metrics(self, path):
        """
        Save evaluation metrics to a JSON file.
        
        Args:
            path (str): Path to save the metrics file
        """
        with open(path, 'w') as f:
            json.dump(self.metrics, f, indent=4)
        print(f"Metrics saved to {path}")