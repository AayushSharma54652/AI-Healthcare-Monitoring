import tensorflow as tf
import numpy as np
from PIL import Image, ImageOps
import cv2
import os
import logging
import io

class PneumoniaDetector:
    """
    A model for detecting pneumonia in chest X-rays.
    Uses a pre-trained TensorFlow model to classify X-ray images as
    normal or showing signs of pneumonia.
    
    This detector is configured for a binary classification model
    trained on 300x300 images with rescaling by 1/255.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the pneumonia detector with a pre-trained model.
        
        Args:
            model_path (str, optional): Path to the model file. If None, uses the default path.
        """
        # Configure logging
        self.logger = logging.getLogger('PneumoniaDetector')
        
        # Set default model path if not provided
        if model_path is None:
            # Check a few common locations for the model file
            possible_paths = [
                "model/trained.h5",
                "models/trained.h5",
                "models/multimodal/trained.h5",
                os.path.join(os.path.dirname(__file__), "trained.h5")
            ]
            
            for path in possible_paths:
                if os.path.exists(path):
                    model_path = path
                    break
        
        # Load the model
        self.model = self._load_model(model_path)
        
        # Define class names - binary classification
        self.class_names = ['NORMAL', 'PNEUMONIA']
        
        # Target image size required by the model - updated to 300x300
        self.img_size = (300, 300)
        
        # Classification threshold - 0.5 is standard for binary
        self.threshold = 0.5
        
        self.logger.info("Pneumonia detector initialized")
    
    def _load_model(self, model_path):
        """
        Load the TensorFlow model from the specified path.
        
        Args:
            model_path (str): Path to the model file
            
        Returns:
            tf.keras.Model: The loaded model or None if loading fails
        """
        try:
            if model_path and os.path.exists(model_path):
                self.logger.info(f"Loading model from {model_path}")
                model = tf.keras.models.load_model(model_path)
                self.logger.info("Model loaded successfully")
                return model
            else:
                self.logger.warning(f"Model path {model_path} not found. Using dummy model.")
                return self._create_dummy_model()
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            return self._create_dummy_model()
    
    def _create_dummy_model(self):
        """
        Create a simple dummy model for testing when the real model is not available.
        This returns a binary classification value instead of class probabilities.
        
        Returns:
            object: A dummy model with predict method
        """
        self.logger.info("Creating dummy model for testing")
        
        class DummyModel:
            def predict(self, x):
                # Log input shape for debugging
                print(f"Dummy model received input with shape: {x.shape}")
                
                # Generate random predictions for binary classification
                # Return shape should be (batch_size, 1)
                batch_size = x.shape[0]
                predictions = np.random.random((batch_size, 1))
                
                return predictions
        
        return DummyModel()
    
    def preprocess_image(self, img_path=None, img_data=None):
        """
        Preprocess the image for model input.
        Resizes to 300x300 and rescales pixel values to 0-1 range.
        
        Args:
            img_path (str, optional): Path to the image file
            img_data (bytes or numpy.ndarray, optional): Raw image data
            
        Returns:
            numpy.ndarray: Preprocessed image ready for model input
        """
        try:
            # Load image from path or data
            if img_path:
                image = Image.open(img_path)
            elif isinstance(img_data, bytes):
                image = Image.open(io.BytesIO(img_data))
            elif isinstance(img_data, np.ndarray):
                if len(img_data.shape) == 3 and img_data.shape[2] == 3:
                    # If it's already a numpy array with 3 channels
                    image = Image.fromarray(img_data.astype('uint8'))
                else:
                    raise ValueError("Invalid image data format")
            else:
                raise ValueError("Either img_path or img_data must be provided")
            
            # Resize image to target size (300x300)
            image = ImageOps.fit(image, self.img_size, Image.LANCZOS)
            
            # Convert to numpy array
            img_array = np.asarray(image)
            
            # Handle grayscale images by converting to RGB
            if len(img_array.shape) == 2:
                # If grayscale, convert to 3-channel by repeating the single channel
                img_array = np.stack([img_array, img_array, img_array], axis=-1)
            elif len(img_array.shape) == 3 and img_array.shape[2] == 1:
                # If already has a channel dimension but only 1 channel, expand to 3
                img_array = np.repeat(img_array, 3, axis=2)
                
            # Make sure we have RGB (not BGR)
            if len(img_array.shape) == 3 and img_array.shape[2] == 3:
                img_array = cv2.cvtColor(img_array, cv2.COLOR_BGR2RGB)
            
            # Rescale pixel values from 0-255 to 0-1 (as done in training)
            img_array = img_array / 255.0
            
            # Add batch dimension
            img_array = img_array[np.newaxis, ...]
            
            # Log the final shape for debugging
            self.logger.info(f"Processed image shape: {img_array.shape}")
            
            return img_array
            
        except Exception as e:
            self.logger.error(f"Error preprocessing image: {e}")
            return None
    
    def detect_pneumonia(self, img_path=None, img_data=None):
        """
        Detect pneumonia in a chest X-ray image.
        
        Args:
            img_path (str, optional): Path to the image file
            img_data (bytes or numpy.ndarray, optional): Raw image data
            
        Returns:
            dict: Detection results including class, confidence, etc.
        """
        try:
            # Preprocess the image
            processed_img = self.preprocess_image(img_path, img_data)
            if processed_img is None:
                return {
                    'success': False,
                    'error': 'Failed to process image'
                }
            
            # Get model prediction - should be a single value between 0 and 1
            # 0 = Normal, 1 = Pneumonia
            prediction = self.model.predict(processed_img)
            
            # Handle prediction based on the output shape
            if isinstance(prediction, list):
                # Some models return a list of outputs
                prediction_value = prediction[0][0]
            else:
                # Get the raw prediction value
                prediction_value = float(prediction[0][0])
            
            # Determine if it's pneumonia based on the threshold
            is_pneumonia = prediction_value >= self.threshold
            
            # Calculate confidence - scale the raw prediction to a percentage
            if is_pneumonia:
                # For pneumonia, use the raw prediction as confidence
                confidence = prediction_value * 100
                predicted_class = 'PNEUMONIA'
            else:
                # For normal, invert the prediction (closer to 0 means more confident it's normal)
                confidence = (1 - prediction_value) * 100
                predicted_class = 'NORMAL'
                
            # Create comprehensive result
            result = {
                'success': True,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'is_pneumonia': is_pneumonia,
                'raw_prediction': float(prediction_value),
                'threshold': self.threshold,
                'all_scores': {
                    'NORMAL': float((1 - prediction_value) * 100),
                    'PNEUMONIA': float(prediction_value * 100)
                },
                'severity': self._classify_severity(confidence, predicted_class)
            }
            
            # Log the prediction for debugging
            self.logger.info(f"Pneumonia prediction: {predicted_class} with {confidence:.1f}% confidence (raw: {prediction_value:.4f})")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error detecting pneumonia: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _classify_severity(self, confidence, predicted_class):
        """
        Classify the severity based on the prediction confidence.
        
        Args:
            confidence (float): Prediction confidence (0-100)
            predicted_class (str): Predicted class name
            
        Returns:
            str: Severity classification ('mild', 'moderate', 'severe')
        """
        if predicted_class != 'PNEUMONIA':
            return 'none'
        
        if confidence >= 90:
            return 'severe'
        elif confidence >= 75:
            return 'moderate'
        else:
            return 'mild'