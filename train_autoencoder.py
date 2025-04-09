"""
Training script for the Deep Autoencoder Anomaly Detection model.

This script loads historical patient data, trains the autoencoder model,
and evaluates its performance. Run this script periodically to update
the model with new patient data or when setting up the system initially.
"""

import sys
import os
import numpy as np
import json
import argparse
from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd

# Add parent directory to path to ensure imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our modules
from models.deep_autoencoder import DeepAutoencoder
from models.autoencoder_anomaly_detector import AutoencoderAnomalyDetector

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

def generate_synthetic_data(hours=24, interval_seconds=300, include_anomalies=True):
    """
    Generate synthetic patient data for testing the model.
    
    Args:
        hours (int): Number of hours of data to generate
        interval_seconds (int): Time interval between readings in seconds
        include_anomalies (bool): Whether to include synthetic anomalies
        
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
    
    # Introduce anomalies for testing if requested
    if include_anomalies and points > 100:
        # Several different anomaly types
        anomaly_types = [
            # Abnormal heart rate spike
            {
                'start': int(points * 0.2),
                'end': int(points * 0.25),
                'apply': lambda i, data, idx: data['heart_rate'].__setitem__(
                    idx, round(data['heart_rate'][idx] * 1.3 + 10 * np.sin(i/3), 1)
                )
            },
            # Low oxygen saturation
            {
                'start': int(points * 0.4),
                'end': int(points * 0.45),
                'apply': lambda i, data, idx: data['oxygen_saturation'].__setitem__(
                    idx, round(max(85, data['oxygen_saturation'][idx] * (1 - 0.1 * i/10)), 1)
                )
            },
            # High blood pressure
            {
                'start': int(points * 0.6),
                'end': int(points * 0.65),
                'apply': lambda i, data, idx: [
                    data['blood_pressure_systolic'].__setitem__(
                        idx, round(data['blood_pressure_systolic'][idx] * 1.15)
                    ),
                    data['blood_pressure_diastolic'].__setitem__(
                        idx, round(data['blood_pressure_diastolic'][idx] * 1.1)
                    )
                ]
            },
            # Abnormal pattern across multiple vitals
            {
                'start': int(points * 0.8),
                'end': int(points * 0.85),
                'apply': lambda i, data, idx: [
                    data['heart_rate'].__setitem__(
                        idx, round(data['heart_rate'][idx] * 1.1, 1)
                    ),
                    data['respiratory_rate'].__setitem__(
                        idx, round(data['respiratory_rate'][idx] * 1.2, 1)
                    ),
                    data['oxygen_saturation'].__setitem__(
                        idx, round(max(92, data['oxygen_saturation'][idx] * 0.97), 1)
                    )
                ]
            }
        ]
        
        # Apply the anomalies
        for anomaly in anomaly_types:
            for i, idx in enumerate(range(anomaly['start'], anomaly['end'])):
                anomaly['apply'](i, patient_data, idx)
    
    return patient_data

def plot_vital_signs(patient_data, save_path=None):
    """
    Plot vital signs data for visualization.
    
    Args:
        patient_data (dict): Patient data dictionary
        save_path (str, optional): Path to save the plot
    """
    # Convert timestamps to datetime objects
    timestamps = [datetime.strptime(ts, "%Y-%m-%d %H:%M:%S") for ts in patient_data['timestamps']]
    
    # Create a figure with subplots
    fig, axes = plt.subplots(5, 1, figsize=(12, 15), sharex=True)
    
    # Plot heart rate
    axes[0].plot(timestamps, patient_data['heart_rate'], 'r-')
    axes[0].set_ylabel('Heart Rate (BPM)')
    axes[0].set_title('Heart Rate')
    axes[0].grid(True)
    
    # Plot blood pressure
    axes[1].plot(timestamps, patient_data['blood_pressure_systolic'], 'b-', label='Systolic')
    axes[1].plot(timestamps, patient_data['blood_pressure_diastolic'], 'g-', label='Diastolic')
    axes[1].set_ylabel('Blood Pressure (mmHg)')
    axes[1].set_title('Blood Pressure')
    axes[1].legend()
    axes[1].grid(True)
    
    # Plot respiratory rate
    axes[2].plot(timestamps, patient_data['respiratory_rate'], 'c-')
    axes[2].set_ylabel('Respiratory Rate (breaths/min)')
    axes[2].set_title('Respiratory Rate')
    axes[2].grid(True)
    
    # Plot oxygen saturation
    axes[3].plot(timestamps, patient_data['oxygen_saturation'], 'm-')
    axes[3].set_ylabel('Oxygen Saturation (%)')
    axes[3].set_title('Oxygen Saturation')
    axes[3].grid(True)
    
    # Plot temperature
    axes[4].plot(timestamps, patient_data['temperature'], 'y-')
    axes[4].set_ylabel('Temperature (°F)')
    axes[4].set_xlabel('Time')
    axes[4].set_title('Temperature')
    axes[4].grid(True)
    
    # Format x-axis
    fig.autofmt_xdate()
    
    plt.tight_layout()
    
    if save_path:
        plt.savefig(save_path)
        print(f"Vital signs plot saved to {save_path}")
    
    plt.close()

def prepare_data_for_training(patient_data):
    """
    Prepare patient data for autoencoder training.
    
    Args:
        patient_data (dict): Patient data dictionary
        
    Returns:
        numpy.ndarray: Training data array
    """
    # Extract vital signs
    training_data = []
    
    for i in range(len(patient_data['timestamps'])):
        features = [
            patient_data['heart_rate'][i],
            patient_data['blood_pressure_systolic'][i],
            patient_data['blood_pressure_diastolic'][i],
            patient_data['respiratory_rate'][i],
            patient_data['oxygen_saturation'][i]
        ]
        training_data.append(features)
    
    return np.array(training_data)

def split_train_test(data, test_size=0.2):
    """
    Split data into training and testing sets.
    
    Args:
        data (numpy.ndarray): Data array
        test_size (float): Proportion of data to use for testing
        
    Returns:
        tuple: (train_data, test_data)
    """
    # Split based on time (no random shuffling)
    split_idx = int(len(data) * (1 - test_size))
    train_data = data[:split_idx]
    test_data = data[split_idx:]
    
    return train_data, test_data

def evaluate_anomaly_detection(model, test_data, patient_data, test_indices, save_path=None):
    """
    Evaluate the autoencoder anomaly detection model.
    
    Args:
        model (DeepAutoencoder): Trained autoencoder model
        test_data (numpy.ndarray): Test data array
        patient_data (dict): Original patient data dictionary
        test_indices (list): Indices of test data in original data
        save_path (str, optional): Path to save the evaluation results
        
    Returns:
        dict: Evaluation metrics
    """
    # Get anomaly scores
    scores, feature_scores = model.compute_anomaly_scores(test_data)
    
    # Determine anomalies
    is_anomaly = scores > model.threshold
    anomaly_count = np.sum(is_anomaly)
    anomaly_rate = anomaly_count / len(test_data)
    
    # Create results dictionary
    results = {
        'anomaly_count': int(anomaly_count),
        'anomaly_rate': float(anomaly_rate),
        'threshold': float(model.threshold),
        'mean_score': float(np.mean(scores)),
        'max_score': float(np.max(scores)),
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # Plot anomaly scores
    plt.figure(figsize=(12, 6))
    plt.plot(scores, 'b-', alpha=0.6)
    plt.scatter(range(len(scores)), scores, c='blue', alpha=0.6)
    
    # Add threshold line
    plt.axhline(y=model.threshold, color='r', linestyle='--', 
                label=f'Threshold: {model.threshold:.4f}')
    
    # Color anomalies
    if anomaly_count > 0:
        plt.scatter(np.where(is_anomaly)[0], scores[is_anomaly], c='red', label='Anomalies')
    
    plt.xlabel('Test Sample Index')
    plt.ylabel('Anomaly Score')
    plt.title('Anomaly Detection Results')
    plt.legend()
    plt.grid(True)
    
    if save_path:
        plt.savefig(f"{save_path}_scores.png")
        print(f"Anomaly scores plot saved to {save_path}_scores.png")
    
    plt.close()
    
    # If there are anomalies, plot some examples
    if anomaly_count > 0:
        # Get indices of anomalies
        anomaly_indices = np.where(is_anomaly)[0]
        
        # Limit to top 5 if there are many
        top_anomalies = anomaly_indices[np.argsort(scores[anomaly_indices])[-5:]]
        
        # Plot reconstructions for top anomalies
        fig = model.visualize_reconstructions(test_data, top_anomalies)
        
        if save_path:
            fig.savefig(f"{save_path}_reconstructions.png")
            print(f"Reconstruction plot saved to {save_path}_reconstructions.png")
        
        plt.close(fig)
    
    # Save results to JSON
    if save_path:
        with open(f"{save_path}_metrics.json", 'w') as f:
            json.dump(results, f, indent=4)
        
        print(f"Evaluation metrics saved to {save_path}_metrics.json")
    
    return results

def main():
    """Main function to run the training process."""
    parser = argparse.ArgumentParser(description='Train Deep Autoencoder model for anomaly detection')
    parser.add_argument('--data', type=str, help='Path to patient data JSON file')
    parser.add_argument('--epochs', type=int, default=100, help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size for training')
    parser.add_argument('--synthetic', action='store_true', help='Generate synthetic data for training')
    parser.add_argument('--synthetic-hours', type=int, default=48, help='Hours of synthetic data to generate')
    parser.add_argument('--save-data', type=str, help='Path to save generated or processed data')
    parser.add_argument('--model-path', type=str, default='models/vital_signs_autoencoder.keras', 
                       help='Path to save model')
    parser.add_argument('--visualize', action='store_true', help='Visualize training results')
    parser.add_argument('--threshold-multiplier', type=float, default=3.0, 
                       help='Multiplier for anomaly threshold (higher = fewer anomalies)')
    
    args = parser.parse_args()
    
    # Setup directories
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('plots', exist_ok=True)
    
    # Load or generate patient data
    if args.synthetic:
        patient_data = generate_synthetic_data(hours=args.synthetic_hours, include_anomalies=True)
        if args.save_data:
            save_patient_data(patient_data, args.save_data)
    elif args.data:
        print(f"Loading patient data from {args.data}")
        patient_data = load_patient_data(args.data)
    else:
        print("Error: No data source specified. Use --data or --synthetic option.")
        sys.exit(1)
    
    print(f"Patient data loaded: {len(patient_data['timestamps'])} time points")
    
    # Visualize data
    if args.visualize:
        plot_vital_signs(patient_data, save_path='plots/vital_signs.png')
    
    # Prepare data for training
    training_data = prepare_data_for_training(patient_data)
    
    # Split into train and test sets
    train_data, test_data = split_train_test(training_data, test_size=0.2)
    test_indices = list(range(len(training_data) - len(test_data), len(training_data)))
    
    print(f"Training data: {len(train_data)} samples")
    print(f"Test data: {len(test_data)} samples")
    
    # Initialize model
    autoencoder = DeepAutoencoder({
        'input_dim': training_data.shape[1],
        'encoding_dims': [32, 16, 8],
        'model_path': args.model_path,
        'threshold_multiplier': args.threshold_multiplier,
        'standardize_input': True
    })
    
    # Train model
    print(f"Training autoencoder with {args.epochs} epochs and batch size {args.batch_size}")
    history = autoencoder.train(train_data, epochs=args.epochs, batch_size=args.batch_size)
    
    # Evaluate model
    print("Evaluating model on test data...")
    eval_results = evaluate_anomaly_detection(
        autoencoder, test_data, patient_data, test_indices,
        save_path='plots/autoencoder_eval'
    )
    
    print(f"Anomaly detection results:")
    print(f"  - Anomaly count: {eval_results['anomaly_count']}")
    print(f"  - Anomaly rate: {eval_results['anomaly_rate']:.2%}")
    print(f"  - Threshold: {eval_results['threshold']:.4f}")
    print(f"  - Mean score: {eval_results['mean_score']:.4f}")
    print(f"  - Max score: {eval_results['max_score']:.4f}")
    
    # Visualize latent space if requested
    if args.visualize:
        latent_space_fig = autoencoder.visualize_latent_space(training_data)
        latent_space_fig.savefig('plots/latent_space.png')
        print("Latent space visualization saved to plots/latent_space.png")
        plt.close(latent_space_fig)
    
    print("Deep Autoencoder training completed successfully.")
    
    # Try with the anomaly detector class
    print("\nTesting AutoencoderAnomalyDetector integration...")
    detector = AutoencoderAnomalyDetector({
        'model_path': args.model_path,
        'use_enhanced_detection': True
    })
    
    # Test with a sample data point
    sample_idx = np.argmax(eval_results['max_score'] == test_data)
    sample_data = {
        'heart_rate': float(test_data[sample_idx][0]),
        'blood_pressure': [
            float(test_data[sample_idx][1]),  # systolic
            float(test_data[sample_idx][2])   # diastolic
        ],
        'respiratory_rate': float(test_data[sample_idx][3]),
        'oxygen_saturation': float(test_data[sample_idx][4]),
        'temperature': 98.6  # Not used by autoencoder
    }
    
    # Detect anomalies
    detection_results = detector.detect(sample_data)
    
    # Print detection results
    print("\nSample detection results:")
    print(f"  - Heart rate anomaly: {detection_results.get('heart_rate', False)}")
    print(f"  - Blood pressure systolic anomaly: {detection_results.get('blood_pressure_systolic', False)}")
    print(f"  - Blood pressure diastolic anomaly: {detection_results.get('blood_pressure_diastolic', False)}")
    print(f"  - Respiratory rate anomaly: {detection_results.get('respiratory_rate', False)}")
    print(f"  - Oxygen saturation anomaly: {detection_results.get('oxygen_saturation', False)}")
    
    if 'scores' in detection_results:
        print("\nAnomaly scores:")
        for k, v in detection_results['scores'].items():
            print(f"  - {k}: {v:.4f}")
    
    # Generate explanation if available
    explanation = detector.explain_anomalies(sample_data)
    if explanation:
        print("\nAnomaly explanation:")
        print(f"  - Summary: {explanation['summary']}")
        print(f"  - Severity: {explanation['severity']}")
        if explanation['anomalous_features']:
            print(f"  - Anomalous features: {', '.join(explanation['anomalous_features'])}")
            print("  - Details:")
            for detail in explanation['details']:
                print(f"    * {detail}")
    
    print("\nAutoencoder anomaly detection implementation completed successfully!")

if __name__ == "__main__":
    main()