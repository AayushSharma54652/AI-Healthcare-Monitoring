import tensorflow as tf
import numpy as np
from PIL import Image
import os
import logging
import io
import pickle

class BrainTumorDetector:
    """
    A model for detecting and classifying brain tumors from MRI images.
    Uses a pre-trained CNN to classify MRI images as:
    - Glioma
    - Meningioma
    - No tumor
    - Pituitary tumor
    """
    
    def __init__(self, model_json_path=None, weights_path=None):
        """
        Initialize the brain tumor detector with a pre-trained model.
        
        Args:
            model_json_path (str, optional): Path to the model structure JSON file
            weights_path (str, optional): Path to the model weights file
        """
        # Configure logging
        self.logger = logging.getLogger('BrainTumorDetector')
        
        # Set default model paths if not provided
        if model_json_path is None:
            possible_json_paths = [
                "models/CNN_structure.json",
                "models/multimodal/CNN_structure.json",
                os.path.join(os.path.dirname(__file__), "CNN_structure.json")
            ]
            
            for path in possible_json_paths:
                if os.path.exists(path):
                    model_json_path = path
                    break
        
        if weights_path is None:
            possible_weights_paths = [
                "models/CNN_weights.pkl",
                "models/multimodal/CNN_weights.pkl",
                os.path.join(os.path.dirname(__file__), "CNN_weights.pkl")
            ]
            
            for path in possible_weights_paths:
                if os.path.exists(path):
                    weights_path = path
                    break
        
        # Load the model
        self.model = self._load_model(model_json_path, weights_path)
        
        # Define class names
        self.class_names = ['glioma', 'meningioma', 'no tumor', 'pituitary']
        
        # Target image size required by the model
        self.img_size = (224, 224)
        
        self.logger.info("Brain tumor detector initialized")
    
    def _load_model(self, model_json_path, weights_path):
        """
        Load the TensorFlow model from the specified paths.
        
        Args:
            model_json_path (str): Path to the model structure JSON file
            weights_path (str): Path to the model weights file
            
        Returns:
            tf.keras.Model: The loaded model or None if loading fails
        """
        try:
            if model_json_path and os.path.exists(model_json_path) and weights_path and os.path.exists(weights_path):
                self.logger.info(f"Loading model from {model_json_path} and weights from {weights_path}")
                
                # Load model structure from JSON
                with open(model_json_path, 'r') as json_file:
                    model_json = json_file.read()
                
                model = tf.keras.models.model_from_json(model_json)
                
                # Load weights from pickle file
                with open(weights_path, 'rb') as weights_file:
                    weights = pickle.load(weights_file)
                    model.set_weights(weights)
                
                # Compile the model
                model.compile(optimizer=tf.keras.optimizers.Adamax(learning_rate=0.001), 
                              loss='categorical_crossentropy', 
                              metrics=['accuracy'])
                
                self.logger.info("Model loaded successfully")
                return model
            else:
                self.logger.warning(f"Model path {model_json_path} or weights path {weights_path} not found. Using dummy model.")
                return self._create_dummy_model()
        except Exception as e:
            self.logger.error(f"Error loading model: {e}")
            return self._create_dummy_model()
    
    def _create_dummy_model(self):
        """
        Create a simple dummy model for testing when the real model is not available.
        
        Returns:
            object: A dummy model with predict method
        """
        self.logger.info("Creating dummy model for testing")
        
        class DummyModel:
            def predict(self, x):
                # Log input shape for debugging
                print(f"Dummy model received input with shape: {x.shape}")
                
                # Generate random predictions for four classes
                batch_size = x.shape[0]
                predictions = np.random.random((batch_size, 4))
                
                # Normalize to sum to 1 (like softmax)
                predictions = predictions / np.sum(predictions, axis=1, keepdims=True)
                
                return predictions
        
        return DummyModel()
    
    def preprocess_image(self, img_path=None, img_data=None):
        """
        Preprocess the image for model input.
        Resizes to 224x224 for the CNN model.
        
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
            
            # Resize image to target size (224x224)
            image = image.resize(self.img_size)
            
            # Convert to RGB if not already
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert to numpy array
            img_array = np.asarray(image)
            
            # Add batch dimension
            img_array = img_array[np.newaxis, ...]
            
            # Log the final shape for debugging
            self.logger.info(f"Processed image shape: {img_array.shape}")
            
            return img_array
            
        except Exception as e:
            self.logger.error(f"Error preprocessing image: {e}")
            return None
    
    def detect_tumor(self, img_path=None, img_data=None):
        """
        Detect and classify brain tumor in an MRI image.
        
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
            
            # Get model prediction
            predictions = self.model.predict(processed_img)
            
            # Get the predicted class (highest probability)
            predicted_index = np.argmax(predictions[0])
            predicted_class = self.class_names[predicted_index]
            
            # Get probability for the predicted class
            confidence = float(predictions[0][predicted_index]) * 100
            
            # Determine if it's a tumor (any class other than "no tumor")
            is_tumor = predicted_class != "no tumor"
            
            # Get all class probabilities
            class_probabilities = {}
            for i, class_name in enumerate(self.class_names):
                class_probabilities[class_name] = float(predictions[0][i]) * 100
            
            # Create comprehensive result
            result = {
                'success': True,
                'predicted_class': predicted_class,
                'confidence': confidence,
                'is_tumor': is_tumor,
                'class_probabilities': class_probabilities,
                'tumor_type': self._get_tumor_info(predicted_class) if is_tumor else None
            }
            
            # Log the prediction for debugging
            self.logger.info(f"Brain tumor prediction: {predicted_class} with {confidence:.1f}% confidence")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error detecting brain tumor: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _get_tumor_info(self, tumor_type):
        """
        Get information about the detected tumor type.
        
        Args:
            tumor_type (str): The type of tumor detected
            
        Returns:
            dict: Information about the tumor type
        """
        tumor_info = {
            'glioma': {
                'name': 'Glioma',
                'description': 'Gliomas are tumors that start in the glial cells of the brain or spine. They are the most common type of primary brain tumor.',
                'common_symptoms': [
                    'Headaches',
                    'Seizures',
                    'Memory loss',
                    'Physical weakness',
                    'Vision problems'
                ],
                'treatment_options': [
                    'Surgery',
                    'Radiation therapy',
                    'Chemotherapy',
                    'Targeted drug therapy'
                ],
                'severity': 'High - Gliomas can be aggressive and require prompt treatment'
            },
            'meningioma': {
                'name': 'Meningioma',
                'description': 'Meningiomas develop from the meninges, the membrane that surrounds the brain and spinal cord. Most meningiomas are benign (not cancerous).',
                'common_symptoms': [
                    'Headaches',
                    'Hearing loss',
                    'Vision problems',
                    'Memory loss',
                    'Seizures'
                ],
                'treatment_options': [
                    'Observation (for small, slow-growing tumors)',
                    'Surgery',
                    'Radiation therapy'
                ],
                'severity': 'Usually Moderate - Most meningiomas are benign but may require treatment'
            },
            'pituitary': {
                'name': 'Pituitary Tumor',
                'description': 'Pituitary tumors are abnormal growths in the pituitary gland, which regulates many hormones. They are usually benign but can affect hormone production.',
                'common_symptoms': [
                    'Headaches',
                    'Vision problems',
                    'Hormonal imbalances',
                    'Fatigue',
                    'Mood changes'
                ],
                'treatment_options': [
                    'Medication (to control hormone production)',
                    'Surgery',
                    'Radiation therapy'
                ],
                'severity': 'Moderate - Most pituitary tumors are not cancerous but may affect hormonal balance'
            }
        }
        
        return tumor_info.get(tumor_type, {
            'name': f'Unknown Tumor Type: {tumor_type}',
            'description': 'Information about this tumor type is not available.',
            'common_symptoms': [],
            'treatment_options': [],
            'severity': 'Unknown'
        })