"""
Training script for the LSTM model.

This script loads historical patient data, trains the LSTM model,
and evaluates its performance. Run this script periodically to
update the model with new patient data.
"""

import sys
import os
import numpy as np
import json
import argparse
from datetime import datetime

# Add parent directory to path to ensure imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our modules
from models.lstm_model import HealthcareLSTM
from utils.data_preprocessing import HealthcareDataPreprocessor
from utils.model_training import ModelTrainer

def load_patient_data(data_path):
    """
    Load patient data from a JSON file.
    
    Args:
        data_path (str): Path to the JSON file with patient data
        
    Returns:
        dict: Dictionary with patient data history
    """
    try:
        with open(data_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading patient data: {e}")
        sys.exit(1)

def save_patient_data(data, save_path):
    """
    Save patient data history to a JSON file for future use.
    
    Args:
        data (dict): Patient data history dictionary
        save_path (str): Path to save the JSON file
    """
    try:
        with open(save_path, 'w') as f:
            json.dump(data, f, indent=4)
        print(f"Patient data saved to {save_path}")
    except Exception as e:
        print(f"Error saving patient data: {e}")

def generate_synthetic_data(hours=24, interval_seconds=300):
    """
    Generate synthetic patient data for testing the model.
    
    Args:
        hours (int): Number of hours of data to generate
        interval_seconds (int): Time interval between readings in seconds
        
    Returns:
        dict: Dictionary with synthetic patient data history
    """
    print(f"Generating {hours} hours of synthetic data with {interval_seconds} second intervals")
    
    # Calculate number of data points
    points = int((hours * 3600) / interval_seconds)
    
    # Initialize data structure
    patient_data = {
        'timestamps': [],
        'heart_rate': [],
        'blood_pressure_systolic': [],
        'blood_pressure_diastolic': [],
        'respiratory_rate': [],
        'oxygen_saturation': [],
        'temperature': [],
        'ecg_data': []
    }
    
    # Base values for vital signs
    base_hr = 75
    base_bp_sys = 120
    base_bp_dia = 80
    base_rr = 16
    base_o2 = 98
    base_temp = 98.6
    
    # Generate timestamps and vitals with realistic variations
    base_time = datetime.now().timestamp()
    
    for i in range(points):
        # Current timestamp
        current_time = base_time + (i * interval_seconds)
        formatted_time = datetime.fromtimestamp(current_time).strftime("%Y-%m-%d %H:%M:%S")
        patient_data['timestamps'].append(formatted_time)
        
        # Add time-based variations
        hour_of_day = datetime.fromtimestamp(current_time).hour
        day_factor = 1.0 if 8 <= hour_of_day <= 20 else 0.9  # Lower at night
        
        # Add some cyclic variations
        cycle_factor = 0.05 * np.sin(i / 20) + 0.02 * np.sin(i / 10)
        
        # Generate vitals with variations
        hr = base_hr * (day_factor + cycle_factor + np.random.normal(0, 0.03))
        patient_data['heart_rate'].append(round(hr, 1))
        
        bp_sys = base_bp_sys * (day_factor + cycle_factor + np.random.normal(0, 0.03))
        patient_data['blood_pressure_systolic'].append(round(bp_sys))
        
        bp_dia = base_bp_dia * (day_factor + cycle_factor + np.random.normal(0, 0.03))
        patient_data['blood_pressure_diastolic'].append(round(bp_dia))
        
        rr = base_rr * (day_factor + cycle_factor + np.random.normal(0, 0.02))
        patient_data['respiratory_rate'].append(round(rr, 1))
        
        o2 = base_o2 * (1 + cycle_factor * 0.3 + np.random.normal(0, 0.002))
        patient_data['oxygen_saturation'].append(round(min(100, o2), 1))
        
        temp = base_temp * (day_factor * 0.005 + 0.995 + cycle_factor * 0.2 + np.random.normal(0, 0.001))
        patient_data['temperature'].append(round(temp, 1))
        
        # Add simple ECG data (not used for LSTM training but needed for data structure)
        ecg_points = [0] * 20  # Just placeholder
        patient_data['ecg_data'].append(ecg_points)
    
    # Introduce an abnormal pattern for testing (e.g., decreasing oxygen)
    if points > 100:
        abnormal_start = int(points * 0.7)
        abnormal_end = int(points * 0.8)
        for i in range(abnormal_start, abnormal_end):
            # Decrease oxygen gradually
            o2_drop = 0.2 * (i - abnormal_start) / (abnormal_end - abnormal_start)
            patient_data['oxygen_saturation'][i] = round(max(90, patient_data['oxygen_saturation'][i] * (1 - o2_drop)), 1)
            # Increase heart rate
            patient_data['heart_rate'][i] = round(patient_data['heart_rate'][i] * (1 + 0.2 * o2_drop), 1)
    
    return patient_data

def main():
    """Main function to run the training process."""
    parser = argparse.ArgumentParser(description='Train LSTM model for healthcare monitoring')
    parser.add_argument('--data', type=str, help='Path to patient data JSON file')
    parser.add_argument('--epochs', type=int, default=50, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for training')
    parser.add_argument('--synthetic', action='store_true', help='Generate synthetic data for training')
    parser.add_argument('--synthetic-hours', type=int, default=24, help='Hours of synthetic data to generate')
    parser.add_argument('--save-data', type=str, help='Path to save generated or processed data')
    parser.add_argument('--model-path', type=str, default='models/saved_lstm_model.keras', help='Path to save model')
    parser.add_argument('--visualize', action='store_true', help='Visualize training results')
    
    args = parser.parse_args()
    
    # Setup directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('plots', exist_ok=True)
    
    # Load or generate patient data
    if args.synthetic:
        patient_data = generate_synthetic_data(hours=args.synthetic_hours)
        if args.save_data:
            save_patient_data(patient_data, args.save_data)
    elif args.data:
        print(f"Loading patient data from {args.data}")
        patient_data = load_patient_data(args.data)
    else:
        print("Error: No data source specified. Use --data or --synthetic option.")
        sys.exit(1)
    
    print(f"Patient data loaded: {len(patient_data['timestamps'])} time points")
    
    # Initialize model and preprocessor
    feature_columns = [
        'heart_rate', 
        'blood_pressure_systolic', 
        'blood_pressure_diastolic',
        'respiratory_rate',
        'oxygen_saturation'
    ]
    
    data_preprocessor = HealthcareDataPreprocessor(
        sequence_length=24,
        prediction_horizon=12,
        feature_columns=feature_columns
    )
    
    lstm_model = HealthcareLSTM({
        'sequence_length': 24,
        'prediction_horizon': 12,
        'feature_count': len(feature_columns),
        'model_path': args.model_path
    })
    
    # Create model trainer
    trainer = ModelTrainer(lstm_model, data_preprocessor)
    
    # Prepare data
    X_train, y_train, X_val, y_val, X_test, y_test = trainer.prepare_data(
        patient_data, test_size=0.15, validation_size=0.15
    )
    
    # Train model
    print(f"Training model with {args.epochs} epochs and batch size {args.batch_size}")
    history = trainer.train_model(X_train, y_train, X_val, y_val, args.epochs, args.batch_size)
    
    # Evaluate model
    metrics = trainer.evaluate_model(X_test, y_test)
    
    # Save metrics
    trainer.save_metrics('logs/lstm_metrics.json')
    
    # Visualize if requested
    if args.visualize:
        trainer.visualize_training_history('plots/training_history.png')
        
        # Visualize predictions on a test sample
        sample_input = X_test[0:1]
        sample_target = y_test[0]
        trainer.visualize_predictions(sample_input, sample_target, 'plots/prediction_sample.png')
    
    print("LSTM model training completed successfully.")

if __name__ == "__main__":
    main()