import numpy as np
from scipy import signal

class ECGAnalyzer:
    """Analyze ECG patterns to detect cardiac abnormalities"""
    
    def __init__(self):
        # Define ECG characteristics to detect
        self.conditions = {
            'normal': 'Normal sinus rhythm',
            'tachycardia': 'Tachycardia (fast heart rate)',
            'bradycardia': 'Bradycardia (slow heart rate)',
            'afib': 'Atrial fibrillation',
            'pvc': 'Premature ventricular contraction',
            'st_elevation': 'ST segment elevation',
            'st_depression': 'ST segment depression'
        }
        
        # Load feature detection parameters
        self.sampling_rate = 125  # Hz
    
    def _detect_r_peaks(self, ecg_data):
        """Detect R peaks in the ECG signal"""
        # Simplistic peak detection for demonstration
        # In a real system, we would use more sophisticated algorithms
        
        # Normalize the signal
        normalized = (ecg_data - np.mean(ecg_data)) / np.std(ecg_data)
        
        # Find peaks above threshold
        threshold = 0.7
        peaks, _ = signal.find_peaks(normalized, height=threshold, distance=self.sampling_rate//2)
        
        return peaks
    
    def _calculate_heart_rate(self, r_peaks):
        """Calculate heart rate from R peak intervals"""
        if len(r_peaks) < 2:
            return None
        
        # Calculate RR intervals
        rr_intervals = np.diff(r_peaks) / self.sampling_rate  # in seconds
        
        # Convert to beats per minute
        heart_rates = 60 / rr_intervals
        
        # Return average heart rate
        return np.mean(heart_rates)
    
    def _detect_rhythm_irregularity(self, r_peaks):
        """Detect irregular heart rhythm"""
        if len(r_peaks) < 3:
            return False, 0
        
        # Calculate RR intervals
        rr_intervals = np.diff(r_peaks)
        
        # Calculate coefficient of variation (std/mean)
        cv = np.std(rr_intervals) / np.mean(rr_intervals)
        
        # Higher CV indicates more irregularity
        return cv > 0.2, cv
    
    def _detect_st_segment(self, ecg_data, r_peaks):
        """Analyze ST segment for elevation or depression"""
        if len(r_peaks) == 0:
            return {'st_elevation': False, 'st_depression': False, 'st_deviation': 0}
        
        st_deviations = []
        
        # For each R peak, look at the ST segment (80-120ms after R)
        for peak in r_peaks:
            if peak + 15 < len(ecg_data):  # 15 samples ≈ 120ms at 125Hz
                # Get baseline (PR segment)
                if peak > 10:
                    pr_segment = ecg_data[peak-10:peak-5]
                    pr_baseline = np.mean(pr_segment)
                else:
                    pr_baseline = 0
                
                # Get ST segment
                st_segment = ecg_data[peak+10:peak+15]
                st_level = np.mean(st_segment)
                
                # Calculate deviation
                st_deviation = st_level - pr_baseline
                st_deviations.append(st_deviation)
        
        # Analyze deviations
        if len(st_deviations) == 0:
            return {'st_elevation': False, 'st_depression': False, 'st_deviation': 0}
        
        avg_deviation = np.mean(st_deviations)
        
        return {
            'st_elevation': avg_deviation > 0.3,
            'st_depression': avg_deviation < -0.3,
            'st_deviation': avg_deviation
        }
    
    def analyze(self, ecg_data):
        """Analyze ECG data for cardiac abnormalities"""
        # Detect R peaks
        r_peaks = self._detect_r_peaks(ecg_data)
        
        # Calculate heart rate
        heart_rate = self._calculate_heart_rate(r_peaks)
        
        # Check for rhythm irregularity
        is_irregular, irregularity_score = self._detect_rhythm_irregularity(r_peaks)
        
        # Check ST segment
        st_analysis = self._detect_st_segment(ecg_data, r_peaks)
        
        # Determine conditions
        conditions = []
        confidence_scores = {}
        
        # Normal by default
        conditions.append('normal')
        confidence_scores['normal'] = 0.9
        
        # Check for tachycardia
        if heart_rate is not None and heart_rate > 100:
            conditions.append('tachycardia')
            confidence_scores['tachycardia'] = min(1.0, (heart_rate - 100) / 40)
            confidence_scores['normal'] *= (1 - confidence_scores['tachycardia'])
        
        # Check for bradycardia
        if heart_rate is not None and heart_rate < 60:
            conditions.append('bradycardia')
            confidence_scores['bradycardia'] = min(1.0, (60 - heart_rate) / 20)
            confidence_scores['normal'] *= (1 - confidence_scores['bradycardia'])
        
        # Check for atrial fibrillation
        if is_irregular and irregularity_score > 0.2:
            conditions.append('afib')
            confidence_scores['afib'] = min(1.0, irregularity_score * 3)
            confidence_scores['normal'] *= (1 - confidence_scores['afib'])
        
        # Check for ST segment abnormalities
        if st_analysis['st_elevation']:
            conditions.append('st_elevation')
            confidence_scores['st_elevation'] = min(1.0, st_analysis['st_deviation'] * 2)
            confidence_scores['normal'] *= (1 - confidence_scores['st_elevation'])
        
        if st_analysis['st_depression']:
            conditions.append('st_depression')
            confidence_scores['st_depression'] = min(1.0, -st_analysis['st_deviation'] * 2)
            confidence_scores['normal'] *= (1 - confidence_scores['st_depression'])
        
        # If normal confidence is low, remove it from conditions
        if confidence_scores['normal'] < 0.5 and len(conditions) > 1:
            conditions.remove('normal')
        
        # Prepare results
        results = {
            'heart_rate': heart_rate,
            'rhythm_regularity': 1 - irregularity_score if irregularity_score is not None else 1,
            'conditions': conditions,
            'condition_names': [self.conditions[c] for c in conditions],
            'confidence_scores': confidence_scores,
            'st_segment': {
                'deviation': st_analysis['st_deviation'],
                'elevation': st_analysis['st_elevation'],
                'depression': st_analysis['st_depression']
            }
        }
        
        return results