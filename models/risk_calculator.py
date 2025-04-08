import numpy as np
import json

class RiskCalculator:
    """Calculate health risk scores based on vital signs and anomaly detection"""
    
    def __init__(self):
        # Risk weights for different vital signs
        self.weights = {
            'heart_rate': 0.2,
            'blood_pressure': 0.2,
            'respiratory_rate': 0.15,
            'oxygen_saturation': 0.25,
            'temperature': 0.2
        }
        
        # Set thresholds for severe risk conditions
        self.severe_thresholds = {
            'heart_rate_high': 120,
            'heart_rate_low': 50,
            'blood_pressure_systolic_high': 160,
            'blood_pressure_systolic_low': 90,
            'blood_pressure_diastolic_high': 100,
            'blood_pressure_diastolic_low': 50,
            'respiratory_rate_high': 24,
            'respiratory_rate_low': 10,
            'oxygen_saturation_low': 92,
            'temperature_high': 101,
            'temperature_low': 95
        }
    
    def calculate_risk(self, current_data, predictions, anomaly_results):
        """Calculate overall health risk score and identify contributing factors"""
        risk_score = 0
        risk_factors = []
        
        # Evaluate current vital signs
        hr_risk = self._evaluate_heart_rate(current_data['heart_rate'])
        risk_score += hr_risk * self.weights['heart_rate']
        if hr_risk > 0.6:
            if current_data['heart_rate'] > self.severe_thresholds['heart_rate_high']:
                risk_factors.append(f"Elevated heart rate: {current_data['heart_rate']} BPM")
            elif current_data['heart_rate'] < self.severe_thresholds['heart_rate_low']:
                risk_factors.append(f"Low heart rate: {current_data['heart_rate']} BPM")
        
        bp_risk = self._evaluate_blood_pressure(current_data['blood_pressure'][0], 
                                               current_data['blood_pressure'][1])
        risk_score += bp_risk * self.weights['blood_pressure']
        if bp_risk > 0.6:
            systolic, diastolic = current_data['blood_pressure']
            if systolic > self.severe_thresholds['blood_pressure_systolic_high']:
                risk_factors.append(f"Elevated systolic pressure: {systolic} mmHg")
            elif systolic < self.severe_thresholds['blood_pressure_systolic_low']:
                risk_factors.append(f"Low systolic pressure: {systolic} mmHg")
            if diastolic > self.severe_thresholds['blood_pressure_diastolic_high']:
                risk_factors.append(f"Elevated diastolic pressure: {diastolic} mmHg")
            elif diastolic < self.severe_thresholds['blood_pressure_diastolic_low']:
                risk_factors.append(f"Low diastolic pressure: {diastolic} mmHg")
        
        rr_risk = self._evaluate_respiratory_rate(current_data['respiratory_rate'])
        risk_score += rr_risk * self.weights['respiratory_rate']
        if rr_risk > 0.6:
            if current_data['respiratory_rate'] > self.severe_thresholds['respiratory_rate_high']:
                risk_factors.append(f"Elevated respiratory rate: {current_data['respiratory_rate']} breaths/min")
            elif current_data['respiratory_rate'] < self.severe_thresholds['respiratory_rate_low']:
                risk_factors.append(f"Low respiratory rate: {current_data['respiratory_rate']} breaths/min")
        
        ox_risk = self._evaluate_oxygen_saturation(current_data['oxygen_saturation'])
        risk_score += ox_risk * self.weights['oxygen_saturation']
        if ox_risk > 0.6:
            if current_data['oxygen_saturation'] < self.severe_thresholds['oxygen_saturation_low']:
                risk_factors.append(f"Low oxygen saturation: {current_data['oxygen_saturation']}%")
        
        temp_risk = self._evaluate_temperature(current_data['temperature'])
        risk_score += temp_risk * self.weights['temperature']
        if temp_risk > 0.6:
            if current_data['temperature'] > self.severe_thresholds['temperature_high']:
                risk_factors.append(f"Elevated temperature: {current_data['temperature']}°F")
            elif current_data['temperature'] < self.severe_thresholds['temperature_low']:
                risk_factors.append(f"Low temperature: {current_data['temperature']}°F")
        
        # Consider anomaly detection results
        if 'scores' in anomaly_results:
            # More negative anomaly scores mean more anomalous
            for key, score in anomaly_results['scores'].items():
                # Convert score to a risk factor (lower score = higher risk)
                # Scores are typically in range (-0.5, 0.5)
                if score < -0.2:  # Significant anomaly
                    anomaly_contribution = ((-score) - 0.2) * 2  # Scale to 0-0.6 range
                    risk_score += anomaly_contribution * 0.1  # Small additional contribution
                    risk_factors.append(f"Unusual pattern detected in {key.replace('_', ' ')}")
        
        # Consider prediction trends
        hr_prediction_risk = self._evaluate_prediction_trend(predictions['heart_rate'], 
                                                            self.severe_thresholds['heart_rate_high'],
                                                            self.severe_thresholds['heart_rate_low'])
        if hr_prediction_risk > 0.5:
            risk_score += hr_prediction_risk * 0.05
            if predictions['heart_rate'][-1] > self.severe_thresholds['heart_rate_high']:
                risk_factors.append("Predicted increasing heart rate trend")
            elif predictions['heart_rate'][-1] < self.severe_thresholds['heart_rate_low']:
                risk_factors.append("Predicted decreasing heart rate trend")
        
        # Add other prediction evaluations...
        ox_prediction_risk = self._evaluate_prediction_trend(predictions['oxygen_saturation'], 
                                                           100, 
                                                           self.severe_thresholds['oxygen_saturation_low'],
                                                           decreasing_is_bad=True)
        if ox_prediction_risk > 0.5:
            risk_score += ox_prediction_risk * 0.1
            risk_factors.append("Predicted decreasing oxygen saturation trend")
        
        # Cap risk score at 1.0
        risk_score = min(risk_score, 1.0)
        
        return risk_score, risk_factors
    
    def _evaluate_heart_rate(self, heart_rate):
        """Evaluate heart rate risk on a 0-1 scale"""
        if heart_rate > 150 or heart_rate < 40:
            return 1.0  # Severe risk
        elif heart_rate > 120 or heart_rate < 50:
            return 0.7  # High risk
        elif heart_rate > 100 or heart_rate < 60:
            return 0.3  # Moderate risk
        else:
            return 0.0  # Normal
    
    def _evaluate_blood_pressure(self, systolic, diastolic):
        """Evaluate blood pressure risk on a 0-1 scale"""
        # Evaluate systolic
        if systolic > 180 or systolic < 80:
            systolic_risk = 1.0
        elif systolic > 160 or systolic < 90:
            systolic_risk = 0.7
        elif systolic > 140 or systolic < 100:
            systolic_risk = 0.3
        else:
            systolic_risk = 0.0
        
        # Evaluate diastolic
        if diastolic > 120 or diastolic < 40:
            diastolic_risk = 1.0
        elif diastolic > 100 or diastolic < 50:
            diastolic_risk = 0.7
        elif diastolic > 90 or diastolic < 60:
            diastolic_risk = 0.3
        else:
            diastolic_risk = 0.0
        
        # Take the higher risk level
        return max(systolic_risk, diastolic_risk)
    
    def _evaluate_respiratory_rate(self, respiratory_rate):
        """Evaluate respiratory rate risk on a 0-1 scale"""
        if respiratory_rate > 30 or respiratory_rate < 8:
            return 1.0
        elif respiratory_rate > 24 or respiratory_rate < 10:
            return 0.7
        elif respiratory_rate > 20 or respiratory_rate < 12:
            return 0.3
        else:
            return 0.0
    
    def _evaluate_oxygen_saturation(self, oxygen_saturation):
        """Evaluate oxygen saturation risk on a 0-1 scale"""
        if oxygen_saturation < 85:
            return 1.0
        elif oxygen_saturation < 90:
            return 0.8
        elif oxygen_saturation < 92:
            return 0.6
        elif oxygen_saturation < 95:
            return 0.3
        else:
            return 0.0
    
    def _evaluate_temperature(self, temperature):
        """Evaluate temperature risk on a 0-1 scale"""
        if temperature > 103 or temperature < 94:
            return 1.0
        elif temperature > 101 or temperature < 95:
            return 0.7
        elif temperature > 99.5 or temperature < 97:
            return 0.3
        else:
            return 0.0
    
    def _evaluate_prediction_trend(self, prediction_values, high_threshold, low_threshold, decreasing_is_bad=False):
        """Evaluate if predictions show a concerning trend"""
        if len(prediction_values) < 2:
            return 0.0
        
        # Calculate the trend
        first_value = prediction_values[0]
        last_value = prediction_values[-1]
        trend = last_value - first_value
        
        # If decreasing is bad (like oxygen), flip the logic
        if decreasing_is_bad:
            if trend < -3 and last_value < low_threshold:
                return 0.8  # Strong decreasing trend toward danger
            elif trend < -2:
                return 0.5  # Moderate decreasing trend
            else:
                return 0.0  # No concerning trend
        else:
            # For metrics where both high and low are bad
            if (trend > 3 and last_value > high_threshold) or (trend < -3 and last_value < low_threshold):
                return 0.8  # Strong trend toward danger
            elif abs(trend) > 2:
                return 0.5  # Moderate trend
            else:
                return 0.0  # No concerning trend