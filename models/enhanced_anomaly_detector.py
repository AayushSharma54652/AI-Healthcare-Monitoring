import os
import numpy as np
from models.anomaly_detector import AnomalyDetector
from models.autoencoder_anomaly_detector import AutoencoderAnomalyDetector

class EnhancedAnomalyDetector(AnomalyDetector):
    """
    Enhanced anomaly detector that combines traditional methods with
    deep learning-based autoencoder detection for improved performance.
    
    This class is a drop-in replacement for the original AnomalyDetector,
    providing the same interface but with enhanced capabilities.
    """
    
    def __init__(self):
        """Initialize the enhanced anomaly detector."""
        # Initialize the original detector
        super().__init__()
        
        # Initialize the autoencoder-based detector
        self.autoencoder_detector = AutoencoderAnomalyDetector()
        
        # Flag to track if autoencoder is available
        self.autoencoder_available = os.path.exists(self.autoencoder_detector.config['model_path'])
        
        print(f"Enhanced Anomaly Detector initialized. Autoencoder available: {self.autoencoder_available}")
    
    def detect(self, current_data, history):
        """
        Detect anomalies in the current vital signs using both traditional
        and deep learning-based methods.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            history (dict): Dictionary with patient history data
            
        Returns:
            dict: Anomaly detection results
        """
        # Train the autoencoder if not already trained
        if not self.autoencoder_available and history and len(history['timestamps']) > 50:
            print("Training autoencoder model with patient history...")
            self.autoencoder_detector.train(history)
            self.autoencoder_available = True
        
        # Call the parent (original) detector
        base_results = super().detect(current_data, history)
        
        # If autoencoder is available, use it for enhanced detection
        if self.autoencoder_available:
            try:
                # Get autoencoder results
                autoencoder_results = self.autoencoder_detector.detect(current_data)
                
                # Merge results (prioritize autoencoder for features it analyzes)
                merged_results = self._merge_results(base_results, autoencoder_results)
                
                # Add explanation if available
                explanation = self.autoencoder_detector.explain_anomalies(current_data)
                if explanation:
                    merged_results['explanation'] = explanation
                
                return merged_results
            except Exception as e:
                print(f"Error in autoencoder detection: {e}. Falling back to traditional detection.")
                return base_results
        else:
            # Use only traditional detection
            return base_results
    
    def _merge_results(self, base_results, autoencoder_results):
        """
        Merge results from traditional and autoencoder-based detection.
        
        Args:
            base_results (dict): Results from traditional detection
            autoencoder_results (dict): Results from autoencoder detection
            
        Returns:
            dict: Merged results
        """
        # Start with base results
        merged = base_results.copy()
        
        # Override with autoencoder results for features it analyzes
        for feature in ['heart_rate', 'blood_pressure_systolic', 'blood_pressure_diastolic', 
                       'respiratory_rate', 'oxygen_saturation']:
            if feature in autoencoder_results:
                merged[feature] = autoencoder_results[feature]
        
        # Add autoencoder scores
        if 'scores' in autoencoder_results:
            merged['scores'] = autoencoder_results['scores']
        
        # Add reconstruction data if available
        if 'reconstruction' in autoencoder_results:
            merged['reconstruction'] = autoencoder_results['reconstruction']
        
        return merged
    
    def get_latent_representation(self, current_data):
        """
        Get the latent space representation of current vital signs.
        This can be used for visualization or other analysis.
        
        Args:
            current_data (dict): Dictionary with current vital signs
            
        Returns:
            numpy.ndarray: Latent representation or None if unavailable
        """
        if self.autoencoder_available:
            return self.autoencoder_detector.get_latent_features(current_data)
        return None