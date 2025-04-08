import numpy as np
import random
from datetime import datetime

class VitalsGenerator:
    def __init__(self):
        # Base vital signs for our simulated patient
        self.base_heart_rate = 75
        self.base_blood_pressure = [120, 80]
        self.base_respiratory_rate = 16
        self.base_oxygen_saturation = 98
        self.base_temperature = 98.6  # Fahrenheit
        
        # For simulating realistic patterns
        self.time_dependent_variation = True
        self.last_values = {
            'heart_rate': self.base_heart_rate,
            'blood_pressure': self.base_blood_pressure.copy(),
            'respiratory_rate': self.base_respiratory_rate,
            'oxygen_saturation': self.base_oxygen_saturation,
            'temperature': self.base_temperature
        }
        
        # Occasionally introduce abnormal patterns for AI detection
        self.abnormal_period = False
        self.abnormal_counter = 0
        
        # ECG pattern generation
        self.ecg_pattern = self._generate_base_ecg_pattern()
    
    def _generate_base_ecg_pattern(self):
        """Generate a simplified base ECG pattern"""
        # This is a very simplified ECG pattern
        p_wave = [0.1, 0.2, 0.25, 0.2, 0.1]
        qrs_complex = [-0.05, -0.1, 0.8, 1.0, 0.8, -0.1, -0.05]
        t_wave = [0.1, 0.3, 0.4, 0.3, 0.1]
        
        # Add some baseline before and after
        baseline_before = [0.05] * 5
        baseline_after = [0.05] * 8
        
        return baseline_before + p_wave + qrs_complex + t_wave + baseline_after
    
    def _get_time_variation(self, timestamp=None):
        """Calculate variation based on time of day"""
        if timestamp is None:
            timestamp = datetime.now()
        
        hour = timestamp.hour
        
        # Heart rate higher during day, lower at night
        hr_variation = 10 if 8 <= hour <= 20 else -5
        
        # Blood pressure higher in morning, lower at night
        bp_variation = 5 if 6 <= hour <= 10 else (-3 if 22 <= hour or hour <= 5 else 0)
        
        # Breathing slightly faster during day
        rr_variation = 2 if 9 <= hour <= 18 else 0
        
        # Temperature slightly higher in evening
        temp_variation = 0.3 if 17 <= hour <= 22 else 0
        
        return {
            'heart_rate': hr_variation,
            'blood_pressure': bp_variation,
            'respiratory_rate': rr_variation,
            'temperature': temp_variation
        }
    
    def _decide_abnormal_period(self):
        """Occasionally trigger an abnormal period for AI to detect"""
        # 1% chance of starting an abnormal period
        if not self.abnormal_period and random.random() < 0.01:
            self.abnormal_period = True
            self.abnormal_counter = random.randint(5, 15)  # Last for 5-15 readings
            self.abnormal_type = random.choice([
                'tachycardia',  # High heart rate
                'bradycardia',  # Low heart rate
                'hypertension',  # High blood pressure
                'hypotension',  # Low blood pressure
                'hypoxia',      # Low oxygen
                'fever',        # High temperature
                'tachypnea'     # High respiratory rate
            ])
            return True
        
        # Continue existing abnormal period
        if self.abnormal_period:
            self.abnormal_counter -= 1
            if self.abnormal_counter <= 0:
                self.abnormal_period = False
            return self.abnormal_period
        
        return False
    
    def _apply_abnormality(self, vitals):
        """Apply selected abnormality to vital signs"""
        if self.abnormal_type == 'tachycardia':
            vitals['heart_rate'] += random.randint(30, 50)
        elif self.abnormal_type == 'bradycardia':
            vitals['heart_rate'] -= random.randint(20, 35)
        elif self.abnormal_type == 'hypertension':
            vitals['blood_pressure'][0] += random.randint(30, 50)
            vitals['blood_pressure'][1] += random.randint(15, 25)
        elif self.abnormal_type == 'hypotension':
            vitals['blood_pressure'][0] -= random.randint(30, 40)
            vitals['blood_pressure'][1] -= random.randint(15, 20)
        elif self.abnormal_type == 'hypoxia':
            vitals['oxygen_saturation'] -= random.randint(5, 15)
        elif self.abnormal_type == 'fever':
            vitals['temperature'] += random.uniform(1.5, 3.0)
        elif self.abnormal_type == 'tachypnea':
            vitals['respiratory_rate'] += random.randint(10, 20)
        return vitals
    
    def _generate_ecg_data(self, heart_rate):
        """Generate 250 points of ECG data (represents ~2 seconds at 125Hz)"""
        # Calculate RR interval in samples based on heart rate
        # At 125Hz, a heart rate of 60 BPM means 125 samples per beat
        rr_interval = int(125 * 60 / heart_rate)
        
        # How many complete beats can we fit?
        beat_length = len(self.ecg_pattern)
        num_beats = 250 // rr_interval + 1
        
        # Generate the ECG signal
        ecg_signal = []
        for i in range(num_beats):
            # Add one beat
            for j in range(beat_length):
                if len(ecg_signal) < 250:
                    # Add some small random variation
                    noise = np.random.normal(0, 0.03)
                    ecg_signal.append(self.ecg_pattern[j] + noise)
            
            # Fill the rest of the RR interval with baseline
            for j in range(rr_interval - beat_length):
                if len(ecg_signal) < 250:
                    # Add some baseline with small noise
                    noise = np.random.normal(0, 0.01)
                    ecg_signal.append(0.05 + noise)
        
        # Ensure we have exactly 250 points
        ecg_signal = ecg_signal[:250]
        
        # If this is an abnormal period, add some ECG abnormalities
        if self.abnormal_period:
            if self.abnormal_type in ['tachycardia', 'bradycardia']:
                # Add some irregularities to the pattern
                for i in range(20, 250, 50):
                    ecg_signal[i] += random.uniform(0.3, 0.5) * random.choice([1, -1])
            elif self.abnormal_type == 'hypoxia':
                # Lower T waves
                for i in range(0, 250, 30):
                    if i + 25 < 250:
                        for j in range(15, 25):
                            ecg_signal[i + j] *= 0.7
        
        return ecg_signal
    
    def generate_vitals(self, timestamp=None):
        """Generate a set of vital signs data"""
        # Get time-based variations
        if self.time_dependent_variation and timestamp is not None:
            variation = self._get_time_variation(timestamp)
        elif self.time_dependent_variation:
            variation = self._get_time_variation()
        else:
            variation = {
                'heart_rate': 0,
                'blood_pressure': 0,
                'respiratory_rate': 0,
                'temperature': 0
            }
        
        # Generate vitals with some random variation
        heart_rate = max(40, min(180, self.base_heart_rate + 
                                 variation['heart_rate'] + 
                                 random.uniform(-3, 3)))
        
        systolic = max(80, min(200, self.base_blood_pressure[0] + 
                              variation['blood_pressure'] + 
                              random.uniform(-5, 5)))
        
        diastolic = max(40, min(120, self.base_blood_pressure[1] + 
                               variation['blood_pressure']/2 + 
                               random.uniform(-3, 3)))
        
        respiratory_rate = max(8, min(40, self.base_respiratory_rate + 
                                     variation['respiratory_rate'] + 
                                     random.uniform(-1, 1)))
        
        oxygen_saturation = max(80, min(100, self.base_oxygen_saturation + 
                                       random.uniform(-1, 0.5)))
        
        temperature = max(95, min(104, self.base_temperature + 
                                 variation['temperature'] + 
                                 random.uniform(-0.2, 0.2)))
        
        # Package the vitals
        vitals = {
            'heart_rate': round(heart_rate, 1),
            'blood_pressure': [round(systolic), round(diastolic)],
            'respiratory_rate': round(respiratory_rate, 1),
            'oxygen_saturation': round(oxygen_saturation, 1),
            'temperature': round(temperature, 1)
        }
        
        # Determine if we should introduce abnormalities
        if self._decide_abnormal_period():
            vitals = self._apply_abnormality(vitals)
        
        # Generate ECG data
        vitals['ecg_data'] = self._generate_ecg_data(vitals['heart_rate'])
        
        # Update last values for continuity
        self.last_values = {
            'heart_rate': vitals['heart_rate'],
            'blood_pressure': vitals['blood_pressure'].copy(),
            'respiratory_rate': vitals['respiratory_rate'],
            'oxygen_saturation': vitals['oxygen_saturation'],
            'temperature': vitals['temperature']
        }
        
        return vitals