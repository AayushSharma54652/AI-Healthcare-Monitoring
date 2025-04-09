import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential, load_model, save_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, Input, Bidirectional
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import os

class HealthcareLSTM:
    """
    LSTM model for predicting vital signs in healthcare monitoring.
    This class handles the creation, training, and prediction using
    LSTM neural networks for time series forecasting.
    """
    
    def __init__(self, config=None):
        """
        Initialize the LSTM model with configuration parameters.
        
        Args:
            config (dict, optional): Configuration parameters including:
                - sequence_length: Number of time steps to use for prediction
                - prediction_horizon: Number of time steps to predict ahead
                - feature_count: Number of features in the input data
                - lstm_units: Number of LSTM cells per layer
                - dropout_rate: Dropout rate for regularization
                - learning_rate: Learning rate for optimizer
                - model_path: Path to save/load the model
        """
        # Default configuration
        self.config = {
            'sequence_length': 24,      # Use 24 time steps to predict
            'prediction_horizon': 12,   # Predict 12 steps ahead
            'feature_count': 5,         # 5 vital signs by default
            'lstm_units': 64,           # Number of LSTM cells
            'dropout_rate': 0.2,        # Dropout rate for regularization
            'learning_rate': 0.001,     # Learning rate for Adam optimizer
            'model_path': 'models/saved_lstm_model',  # Path to save model
            'bidirectional': True,      # Use bidirectional LSTM
            'use_multi_layer': True,    # Use multiple LSTM layers
        }
        
        # Update with provided config if any
        if config:
            self.config.update(config)
        
        # Initialize model
        self.model = None
        
        # Try to load pre-trained model if it exists
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create a new one if none exists."""
        try:
            if os.path.exists(self.config['model_path']):
                self.model = load_model(self.config['model_path'])
                print(f"Loaded existing model from {self.config['model_path']}")
            else:
                self._build_model()
                print("Created new LSTM model")
        except Exception as e:
            print(f"Error loading model: {e}. Creating new model instead.")
            self._build_model()
    
    def _build_model(self):
        """Build the LSTM model architecture."""
        self.model = Sequential()
        
        # Input layer
        input_shape = (self.config['sequence_length'], self.config['feature_count'])
        
        # First LSTM layer with return sequences if using multiple layers
        if self.config['bidirectional']:
            # Bidirectional LSTM
            if self.config['use_multi_layer']:
                self.model.add(Bidirectional(LSTM(self.config['lstm_units'], 
                                              return_sequences=True), 
                                          input_shape=input_shape))
                self.model.add(Dropout(self.config['dropout_rate']))
                
                # Second LSTM layer
                self.model.add(Bidirectional(LSTM(self.config['lstm_units'])))
            else:
                # Single layer bidirectional
                self.model.add(Bidirectional(LSTM(self.config['lstm_units']), 
                                          input_shape=input_shape))
        else:
            # Regular LSTM
            if self.config['use_multi_layer']:
                self.model.add(LSTM(self.config['lstm_units'], 
                                 return_sequences=True, 
                                 input_shape=input_shape))
                self.model.add(Dropout(self.config['dropout_rate']))
                
                # Second LSTM layer
                self.model.add(LSTM(self.config['lstm_units']))
            else:
                # Single layer
                self.model.add(LSTM(self.config['lstm_units'], 
                                 input_shape=input_shape))
        
        # Add dropout for regularization
        self.model.add(Dropout(self.config['dropout_rate']))
        
        # Output layer - predict multiple time steps ahead for multiple features
        self.model.add(Dense(self.config['prediction_horizon'] * self.config['feature_count']))
        
        # Compile model
        self.model.compile(
            optimizer=Adam(learning_rate=self.config['learning_rate']),
            loss='mean_squared_error'
        )
        
        # Print model summary
        self.model.summary()
    
    def train(self, X_train, y_train, X_val=None, y_val=None, epochs=50, batch_size=32):
        """
        Train the LSTM model on the provided data.
        
        Args:
            X_train (numpy.ndarray): Training input sequences 
                                    [samples, sequence_length, features]
            y_train (numpy.ndarray): Training target sequences 
                                    [samples, prediction_horizon * features]
            X_val (numpy.ndarray): Validation input sequences
            y_val (numpy.ndarray): Validation target sequences
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            
        Returns:
            History object with training metrics
        """
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ModelCheckpoint(self.config['model_path'], save_best_only=True)
        ]
        
        validation_data = None
        if X_val is not None and y_val is not None:
            validation_data = (X_val, y_val)
        
        history = self.model.fit(
            X_train, y_train,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=validation_data,
            callbacks=callbacks,
            verbose=1
        )
        
        # Save the trained model
        self.model.save(self.config['model_path'])
        
        return history
    
    def predict(self, input_sequence):
        """
        Generate predictions for the input sequence.
        
        Args:
            input_sequence (numpy.ndarray): Input sequence of shape 
                                          [1, sequence_length, features]
                                          
        Returns:
            numpy.ndarray: Predicted values for the next prediction_horizon time steps
                          Shape: [prediction_horizon, features]
        """
        if self.model is None:
            raise ValueError("Model not initialized. Please train or load a model first.")
        
        # Make prediction
        predictions = self.model.predict(input_sequence)
        
        # Reshape to [prediction_horizon, features]
        return predictions.reshape((-1, self.config['prediction_horizon'], self.config['feature_count']))
    
    def save(self, path=None):
        """Save the model to a file."""
        if path is None:
            path = self.config['model_path']
        
        if self.model is not None:
            self.model.save(path)
            print(f"Model saved to {path}")
        else:
            print("No model to save")
    
    def load(self, path=None):
        """Load the model from a file."""
        if path is None:
            path = self.config['model_path']
        
        if os.path.exists(path):
            self.model = load_model(path)
            print(f"Model loaded from {path}")
        else:
            print(f"No model found at {path}")