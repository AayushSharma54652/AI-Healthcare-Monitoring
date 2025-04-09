import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Model, Sequential, load_model, save_model
from tensorflow.keras.layers import Input, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import os
import json
import matplotlib.pyplot as plt

class DeepAutoencoder:
    """
    Deep Autoencoder for anomaly detection in healthcare vital signs.
    
    This model learns the normal patterns in vital signs and detects
    anomalies based on reconstruction error. It can identify subtle
    deviations that might indicate patient deterioration before
    traditional threshold-based methods.
    """
    
    def __init__(self, config=None):
        """
        Initialize the deep autoencoder model.
        
        Args:
            config (dict, optional): Configuration dictionary with parameters:
                - input_dim: Dimension of input features
                - encoding_dims: List of dimensions for encoder layers
                - dropout_rate: Dropout rate for regularization
                - learning_rate: Learning rate for Adam optimizer
                - model_path: Path to save/load model
                - threshold_multiplier: Multiplier for anomaly threshold
        """
        # Default configuration
        self.config = {
            'input_dim': 5,  # Default number of vital signs
            'encoding_dims': [32, 16, 8],  # Encoder dimensions
            'dropout_rate': 0.2,  # Dropout rate
            'learning_rate': 0.001,  # Learning rate
            'model_path': 'models/autoencoder_model.keras',  # Model save path
            'threshold_multiplier': 3.0,  # Anomaly threshold = mean + threshold_multiplier * std
            'standardize_input': True,  # Whether to standardize inputs
        }
        
        # Update with provided config
        if config:
            self.config.update(config)
            
        # Initialize attributes
        self.model = None
        self.encoder = None
        self.decoder = None
        self.threshold = None
        self.feature_thresholds = None
        self.mean = None
        self.std = None
        
        # Initialize model
        self._load_or_create_model()
        
    def _load_or_create_model(self):
        """Load existing model or create a new one."""
        try:
            if os.path.exists(self.config['model_path']):
                self.model = load_model(self.config['model_path'])
                print(f"Loaded autoencoder model from {self.config['model_path']}")
                
                # Try to load threshold and normalization parameters
                threshold_path = self.config['model_path'].replace('.keras', '_threshold.json')
                if os.path.exists(threshold_path):
                    with open(threshold_path, 'r') as f:
                        threshold_data = json.load(f)
                        self.threshold = threshold_data.get('threshold')
                        self.feature_thresholds = threshold_data.get('feature_thresholds')
                        self.mean = threshold_data.get('mean')
                        self.std = threshold_data.get('std')
                    print(f"Loaded threshold data from {threshold_path}")
                
                # Extract encoder and decoder parts
                self._extract_encoder_decoder()
            else:
                self._build_model()
                print("Created new autoencoder model")
        except Exception as e:
            print(f"Error loading model: {e}. Creating new model instead.")
            self._build_model()
    
    def _build_model(self):
        """Build the autoencoder model architecture."""
        # Define input layer
        input_layer = Input(shape=(self.config['input_dim'],))
        
        # Current layer starts with input
        current_layer = input_layer
        
        # === Encoder ===
        for i, dim in enumerate(self.config['encoding_dims']):
            current_layer = Dense(dim, activation='relu')(current_layer)
            if i < len(self.config['encoding_dims']) - 1:  # No dropout on bottleneck layer
                current_layer = BatchNormalization()(current_layer)
                current_layer = Dropout(self.config['dropout_rate'])(current_layer)
        
        # Bottleneck layer
        bottleneck = current_layer
        
        # === Decoder ===
        # Use reverse encoding dimensions for decoder (except bottleneck)
        for i, dim in enumerate(reversed(self.config['encoding_dims'][:-1])):
            current_layer = Dense(dim, activation='relu')(current_layer)
            current_layer = BatchNormalization()(current_layer)
            if i < len(self.config['encoding_dims']) - 2:  # Less dropout in decoder
                current_layer = Dropout(self.config['dropout_rate'] / 2)(current_layer)
        
        # Output layer (reconstruction)
        output_layer = Dense(self.config['input_dim'], activation='linear')(current_layer)
        
        # Create the autoencoder model
        self.model = Model(inputs=input_layer, outputs=output_layer)
        
        # Compile the model
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.config['learning_rate']),
            loss='mean_squared_error'
        )
        
        # Create separate encoder model
        self.encoder = Model(inputs=input_layer, outputs=bottleneck)
        
        # Create separate decoder model - building directly instead of extracting
        decoder_input = Input(shape=(self.config['encoding_dims'][-1],))
        decoder_layer = decoder_input
        
        # Building decoder layers directly
        reversed_dims = list(reversed(self.config['encoding_dims'][:-1]))
        for i, dim in enumerate(reversed_dims):
            decoder_layer = Dense(dim, activation='relu')(decoder_layer)
            decoder_layer = BatchNormalization()(decoder_layer)
            if i < len(reversed_dims) - 1:  # Less dropout in decoder
                decoder_layer = Dropout(self.config['dropout_rate'] / 2)(decoder_layer)
        
        # Final output layer
        decoder_output = Dense(self.config['input_dim'], activation='linear')(decoder_layer)
        
        # Create the decoder model
        self.decoder = Model(inputs=decoder_input, outputs=decoder_output)
        
        # Print model summary
        self.model.summary()
    
    def _extract_encoder_decoder(self):
        """Extract encoder and decoder parts from the loaded model."""
        # Determine the number of layers in the autoencoder
        total_layers = len(self.model.layers)
        
        # Find the bottleneck layer index (middle of the network)
        bottleneck_idx = len(self.config['encoding_dims'])
        
        # Extract encoder
        encoder_layers = self.model.layers[0:bottleneck_idx+1]
        input_layer = Input(shape=(self.config['input_dim'],))
        encoded = input_layer
        
        # Skip the input layer and rebuild encoder
        for layer in encoder_layers[1:]:
            encoded = layer(encoded)
            
        self.encoder = Model(inputs=input_layer, outputs=encoded)
        
        # Extract decoder - create directly instead
        decoder_input = Input(shape=(self.config['encoding_dims'][-1],))
        
        # Build the decoder directly
        decoder_layer = decoder_input
        
        # Building decoder layers directly
        reversed_dims = list(reversed(self.config['encoding_dims'][:-1]))
        for i, dim in enumerate(reversed_dims):
            decoder_layer = Dense(dim, activation='relu')(decoder_layer)
            decoder_layer = BatchNormalization()(decoder_layer)
            if i < len(reversed_dims) - 1:  # Less dropout in decoder
                decoder_layer = Dropout(self.config['dropout_rate'] / 2)(decoder_layer)
        
        # Final output layer
        decoder_output = Dense(self.config['input_dim'], activation='linear')(decoder_layer)
        
        # Create the decoder model
        self.decoder = Model(inputs=decoder_input, outputs=decoder_output)
    
    def preprocess_data(self, data):
        """
        Standardize the input data if standardization is enabled.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            
        Returns:
            numpy.ndarray: Preprocessed data
        """
        if self.config['standardize_input'] and self.mean is not None and self.std is not None:
            return (data - self.mean) / self.std
        return data
    
    def inverse_preprocess(self, data):
        """
        Inverse standardization if standardization is enabled.
        
        Args:
            data (numpy.ndarray): Standardized data
            
        Returns:
            numpy.ndarray: Original scale data
        """
        if self.config['standardize_input'] and self.mean is not None and self.std is not None:
            return data * self.std + self.mean
        return data
    
    def train(self, data, validation_data=None, epochs=100, batch_size=32, save_path=None):
        """
        Train the autoencoder model on normal data.
        
        Args:
            data (numpy.ndarray): Training data with shape (samples, features)
            validation_data (tuple, optional): Tuple of (x_val, x_val) for validation
            epochs (int): Number of training epochs
            batch_size (int): Batch size for training
            save_path (str, optional): Custom path to save the model
            
        Returns:
            History object with training metrics
        """
        # Compute data statistics for standardization
        if self.config['standardize_input']:
            self.mean = np.mean(data, axis=0)
            self.std = np.std(data, axis=0)
            self.std[self.std == 0] = 1  # Avoid division by zero
            
            # Preprocess data
            processed_data = self.preprocess_data(data)
        else:
            processed_data = data
        
        # Prepare validation data if provided
        processed_val_data = None
        if validation_data is not None:
            if self.config['standardize_input']:
                processed_val_data = (
                    self.preprocess_data(validation_data[0]),
                    self.preprocess_data(validation_data[1])
                )
            else:
                processed_val_data = validation_data
        
        # Set up callbacks
        model_path = save_path if save_path else self.config['model_path']
        callbacks = [
            EarlyStopping(patience=10, restore_best_weights=True),
            ModelCheckpoint(model_path, save_best_only=True)
        ]
        
        # Train the model (autoencoder reconstructs the input)
        history = self.model.fit(
            processed_data, processed_data,
            epochs=epochs,
            batch_size=batch_size,
            validation_data=processed_val_data if processed_val_data else None,
            callbacks=callbacks,
            verbose=1
        )
        
        # Calculate reconstruction error threshold on training data
        reconstructions = self.model.predict(processed_data)
        mse = np.mean(np.square(processed_data - reconstructions), axis=1)
        
        # Set threshold as mean + n*std of reconstruction error
        self.threshold = np.mean(mse) + self.config['threshold_multiplier'] * np.std(mse)
        
        # Calculate per-feature thresholds
        feature_mse = np.mean(np.square(processed_data - reconstructions), axis=0)
        self.feature_thresholds = feature_mse * self.config['threshold_multiplier']
        
        # Save the model and threshold
        self.save(model_path)
        
        return history
    
    def compute_anomaly_scores(self, data):
        """
        Compute anomaly scores for input data.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            
        Returns:
            tuple: (overall_scores, feature_scores)
                - overall_scores: Overall anomaly scores for each sample
                - feature_scores: Per-feature anomaly scores for each sample
        """
        # Preprocess data
        processed_data = self.preprocess_data(data)
        
        # Get reconstructions
        reconstructions = self.model.predict(processed_data)
        
        # Calculate reconstruction error (MSE) for each sample
        overall_scores = np.mean(np.square(processed_data - reconstructions), axis=1)
        
        # Calculate reconstruction error for each feature
        feature_scores = np.square(processed_data - reconstructions)
        
        return overall_scores, feature_scores
    
    def detect_anomalies(self, data):
        """
        Detect anomalies in the input data.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            
        Returns:
            dict: Detection results with keys:
                - is_anomaly: Boolean array indicating anomalies
                - anomaly_score: Anomaly score for each sample
                - feature_scores: Per-feature anomaly scores
                - anomalous_features: Boolean array indicating anomalous features
        """
        if self.threshold is None:
            raise ValueError("Model has not been trained or threshold not set")
        
        # Compute anomaly scores
        overall_scores, feature_scores = self.compute_anomaly_scores(data)
        
        # Detect anomalies (overall)
        is_anomaly = overall_scores > self.threshold
        
        # Detect anomalous features
        anomalous_features = feature_scores > self.feature_thresholds
        
        return {
            'is_anomaly': is_anomaly,
            'anomaly_score': overall_scores,
            'feature_scores': feature_scores,
            'anomalous_features': anomalous_features
        }
    
    def reconstruct(self, data):
        """
        Reconstruct input data using the autoencoder.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            
        Returns:
            numpy.ndarray: Reconstructed data
        """
        # Preprocess data
        processed_data = self.preprocess_data(data)
        
        # Get reconstructions
        reconstructions = self.model.predict(processed_data)
        
        # Inverse preprocess if needed
        return self.inverse_preprocess(reconstructions)
    
    def encode(self, data):
        """
        Encode input data to the latent representation.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            
        Returns:
            numpy.ndarray: Encoded data in latent space
        """
        # Preprocess data
        processed_data = self.preprocess_data(data)
        
        # Encode
        return self.encoder.predict(processed_data)
    
    def save(self, path=None):
        """
        Save the model, threshold, and normalization parameters.
        
        Args:
            path (str, optional): Path to save the model
        """
        if path is None:
            path = self.config['model_path']
            
        # Save the model
        self.model.save(path)
        
        # Save threshold and normalization parameters
        threshold_path = path.replace('.keras', '_threshold.json')
        threshold_data = {
            'threshold': float(self.threshold) if self.threshold is not None else None,
            'feature_thresholds': self.feature_thresholds.tolist() if self.feature_thresholds is not None else None,
            'mean': self.mean.tolist() if self.mean is not None else None,
            'std': self.std.tolist() if self.std is not None else None,
            'config': self.config
        }
        
        with open(threshold_path, 'w') as f:
            json.dump(threshold_data, f)
            
        print(f"Model saved to {path}")
        print(f"Threshold data saved to {threshold_path}")
    
    def visualize_reconstructions(self, data, sample_indices=None, max_samples=5):
        """
        Visualize original data vs reconstructions for selected samples.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            sample_indices (list, optional): Indices of samples to visualize
            max_samples (int): Maximum number of samples to visualize
            
        Returns:
            matplotlib.figure.Figure: The created figure
        """
        # Preprocess data
        processed_data = self.preprocess_data(data)
        
        # Get reconstructions
        reconstructions = self.model.predict(processed_data)
        
        # Calculate anomaly scores
        scores, _ = self.compute_anomaly_scores(data)
        
        # If sample indices not provided, select samples with highest anomaly scores
        if sample_indices is None:
            sample_indices = np.argsort(scores)[-max_samples:]
        else:
            sample_indices = sample_indices[:max_samples]
            
        # Create figure
        n_samples = len(sample_indices)
        fig, axes = plt.subplots(n_samples, 1, figsize=(10, 3 * n_samples))
        if n_samples == 1:
            axes = [axes]
            
        feature_names = [f'Feature {i+1}' for i in range(self.config['input_dim'])]
            
        for i, idx in enumerate(sample_indices):
            # Get original and reconstruction
            original = processed_data[idx]
            reconstruction = reconstructions[idx]
            
            # Plot
            ax = axes[i]
            x = np.arange(len(original))
            ax.plot(x, original, 'b-', label='Original')
            ax.plot(x, reconstruction, 'r--', label='Reconstruction')
            ax.set_xticks(x)
            ax.set_xticklabels(feature_names)
            ax.set_title(f'Sample {idx}, Anomaly Score: {scores[idx]:.4f}')
            ax.legend()
            
            # Highlight anomalous features
            if self.threshold is not None:
                is_anomaly = scores[idx] > self.threshold
                feature_errors = np.square(original - reconstruction)
                for j, error in enumerate(feature_errors):
                    if error > self.feature_thresholds[j]:
                        ax.axvspan(j-0.3, j+0.3, alpha=0.2, color='red')
                        
                # Add text annotation for anomaly status
                anomaly_text = "ANOMALY" if is_anomaly else "NORMAL"
                ax.text(0.02, 0.95, anomaly_text, transform=ax.transAxes, 
                        fontsize=12, fontweight='bold', 
                        color='red' if is_anomaly else 'green')
                
        plt.tight_layout()
        return fig
    
    def visualize_anomaly_scores(self, data, threshold=None):
        """
        Visualize anomaly scores for a dataset.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            threshold (float, optional): Custom threshold to display
            
        Returns:
            matplotlib.figure.Figure: The created figure
        """
        # Compute anomaly scores
        scores, _ = self.compute_anomaly_scores(data)
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Plot scores
        ax.plot(scores, 'b-', alpha=0.6)
        ax.scatter(range(len(scores)), scores, c='blue', alpha=0.6)
        
        # Add threshold line
        if threshold is None and self.threshold is not None:
            threshold = self.threshold
            
        if threshold is not None:
            ax.axhline(y=threshold, color='r', linestyle='--', label=f'Threshold: {threshold:.4f}')
            
            # Color anomalies differently
            anomalies = scores > threshold
            if np.any(anomalies):
                ax.scatter(np.where(anomalies)[0], scores[anomalies], c='red', label='Anomalies')
                
        ax.set_xlabel('Sample Index')
        ax.set_ylabel('Anomaly Score')
        ax.set_title('Anomaly Scores for Dataset')
        ax.legend()
        
        return fig
    
    def visualize_latent_space(self, data, labels=None):
        """
        Visualize samples in the latent space using PCA if dimension > 2.
        
        Args:
            data (numpy.ndarray): Input data with shape (samples, features)
            labels (numpy.ndarray, optional): Labels for coloring points
            
        Returns:
            matplotlib.figure.Figure: The created figure
        """
        # Encode data to latent space
        encoded_data = self.encode(data)
        
        # Create figure
        fig = plt.figure(figsize=(10, 8))
        
        # If latent dimension > 2, use PCA
        if encoded_data.shape[1] > 2:
            from sklearn.decomposition import PCA
            pca = PCA(n_components=2)
            encoded_data_2d = pca.fit_transform(encoded_data)
            
            # Add explained variance as title info
            explained_var = pca.explained_variance_ratio_
            title = f'Latent Space (PCA) - Explained Variance: {explained_var[0]:.2f}, {explained_var[1]:.2f}'
        else:
            encoded_data_2d = encoded_data
            title = 'Latent Space Representation'
            
        # Plot
        if labels is not None:
            scatter = plt.scatter(encoded_data_2d[:, 0], encoded_data_2d[:, 1], c=labels, 
                        cmap='viridis', alpha=0.6, edgecolors='w', linewidths=0.5)
            plt.colorbar(scatter, label='Label')
        else:
            # Color by anomaly score if labels not provided
            scores, _ = self.compute_anomaly_scores(data)
            scatter = plt.scatter(encoded_data_2d[:, 0], encoded_data_2d[:, 1], c=scores,
                        cmap='coolwarm', alpha=0.6, edgecolors='w', linewidths=0.5)
            plt.colorbar(scatter, label='Anomaly Score')
            
        plt.title(title)
        plt.xlabel('Dimension 1')
        plt.ylabel('Dimension 2')
        plt.grid(True, alpha=0.3)
        
        return fig