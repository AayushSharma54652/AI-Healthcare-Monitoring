/**
 * Predefined patient scenarios for the healthcare simulator
 * Each scenario includes:
 * - title: Name of the scenario
 * - description: Brief description of the clinical situation
 * - category: normal, warning, or critical
 * - icon: Font Awesome icon code
 * - duration: Duration in minutes
 * - vitalSigns: A timeline of vital signs at different points
 * - clinicalExplanation: Medical explanation of the scenario
 * - aiExplanation: How the AI system should detect and respond
 */

const PatientScenarios = [
    {
        id: 'normal',
        title: 'Healthy Patient',
        description: 'Normal vital signs with minor variations',
        category: 'normal',
        icon: 'fa-user-check',
        duration: 5,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 75,
                bloodPressure: [120, 80],
                respiratoryRate: 16,
                oxygenSaturation: 98,
                temperature: 98.6,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 72,
                bloodPressure: [118, 78],
                respiratoryRate: 15,
                oxygenSaturation: 99,
                temperature: 98.5,
                ecgPattern: 'normal'
            },
            {
                timePoint: 120,
                heartRate: 78,
                bloodPressure: [122, 82],
                respiratoryRate: 16,
                oxygenSaturation: 98,
                temperature: 98.7,
                ecgPattern: 'normal'
            }
        ],
        clinicalExplanation: `
            <p>This is a healthy patient with normal vital signs. The variations observed are within normal physiological ranges:</p>
            <ul>
                <li>Heart rate between 60-100 BPM is considered normal for adults at rest</li>
                <li>Blood pressure around 120/80 mmHg is optimal</li>
                <li>Normal respiratory rate for adults is 12-20 breaths per minute</li>
                <li>Oxygen saturation above 95% is normal</li>
                <li>Normal body temperature ranges from 97°F to 99°F</li>
            </ul>
            <p>The ECG shows a normal sinus rhythm with regular P waves, QRS complexes, and T waves.</p>
        `,
        aiExplanation: `
            <p>The AI monitoring system correctly identifies this as a normal patient with low risk scores. Here's how the AI processes this data:</p>
            <ul>
                <li>All vital signs are within normal statistical ranges</li>
                <li>The patterns show normal physiological variations without significant trends</li>
                <li>ECG waveform analysis shows normal conduction patterns</li>
                <li>The anomaly detection algorithms do not trigger any alerts</li>
                <li>Risk score remains consistently low (< 15%)</li>
            </ul>
            <p>This demonstrates the system's ability to correctly classify normal patients, avoiding false positives that could lead to alarm fatigue.</p>
        `
    },
    {
        id: 'tachycardia',
        title: 'Tachycardia',
        description: 'Elevated heart rate that progressively worsens',
        category: 'warning',
        icon: 'fa-heartbeat',
        duration: 8,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 90,
                bloodPressure: [125, 82],
                respiratoryRate: 18,
                oxygenSaturation: 97,
                temperature: 99.1,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 105,
                bloodPressure: [130, 85],
                respiratoryRate: 20,
                oxygenSaturation: 96,
                temperature: 99.3,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 120,
                heartRate: 120,
                bloodPressure: [135, 88],
                respiratoryRate: 22,
                oxygenSaturation: 95,
                temperature: 99.5,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 180,
                heartRate: 135,
                bloodPressure: [140, 90],
                respiratoryRate: 24,
                oxygenSaturation: 94,
                temperature: 99.8,
                ecgPattern: 'tachycardia'
            }
        ],
        clinicalExplanation: `
            <p>This patient is experiencing progressive tachycardia (elevated heart rate):</p>
            <ul>
                <li>Heart rate above 100 BPM is defined as tachycardia</li>
                <li>The progressive increase suggests a worsening condition</li>
                <li>The simultaneous rise in blood pressure, respiratory rate, and temperature suggests a systemic response</li>
                <li>Slight drop in oxygen saturation may indicate increased oxygen demand</li>
            </ul>
            <p>Possible causes include:</p>
            <ul>
                <li>Fever and infection (suggested by elevated temperature)</li>
                <li>Hypovolemia (dehydration or blood loss)</li>
                <li>Pain or anxiety</li>
                <li>Medication effects</li>
                <li>Cardiac conditions like atrial fibrillation</li>
            </ul>
            <p>The ECG shows a sinus tachycardia pattern with normal P waves preceding each QRS complex, but at a rapid rate.</p>
        `,
        aiExplanation: `
            <p>The AI system progressively detects and responds to the developing tachycardia:</p>
            <ul>
                <li>Initial state shows borderline elevated heart rate but no alerts triggered</li>
                <li>At 60 seconds, anomaly detection identifies heart rate crossing into abnormal territory</li>
                <li>Predictive algorithms correctly forecast the continued upward trend</li>
                <li>Time series analysis detects the correlation between rising heart rate and other vital signs</li>
                <li>Risk score increases from low (~15%) to moderate (~40%) to high (~65%)</li>
                <li>ECG pattern recognition confirms sinus tachycardia rather than arrhythmia</li>
            </ul>
            <p>This demonstrates the system's ability to detect gradual deterioration, correlate multiple vital signs, and accurately classify cardiac patterns.</p>
        `
    },
    {
        id: 'sepsis',
        title: 'Early Sepsis',
        description: 'Developing infection with septic response',
        category: 'critical',
        icon: 'fa-biohazard',
        duration: 10,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 95,
                bloodPressure: [118, 75],
                respiratoryRate: 18,
                oxygenSaturation: 97,
                temperature: 99.6,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 105,
                bloodPressure: [115, 70],
                respiratoryRate: 20,
                oxygenSaturation: 96,
                temperature: 100.8,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 120,
                heartRate: 118,
                bloodPressure: [110, 65],
                respiratoryRate: 24,
                oxygenSaturation: 94,
                temperature: 101.5,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 180,
                heartRate: 125,
                bloodPressure: [100, 60],
                respiratoryRate: 26,
                oxygenSaturation: 92,
                temperature: 102.3,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 240,
                heartRate: 132,
                bloodPressure: [90, 55],
                respiratoryRate: 28,
                oxygenSaturation: 90,
                temperature: 102.8,
                ecgPattern: 'tachycardia'
            }
        ],
        clinicalExplanation: `
            <p>This patient is showing classic signs of early sepsis (systemic infection):</p>
            <ul>
                <li>Rising fever (>101°F) indicating immune response to infection</li>
                <li>Tachycardia (elevated heart rate) compensating for vasodilation</li>
                <li>Tachypnea (elevated respiratory rate) compensating for metabolic acidosis</li>
                <li>Dropping blood pressure suggesting developing distributive shock</li>
                <li>Decreasing oxygen saturation indicating respiratory compromise</li>
            </ul>
            <p>This constellation of symptoms meets SIRS (Systemic Inflammatory Response Syndrome) criteria, and the progression suggests the patient may be developing septic shock if not treated promptly. The dropping blood pressure is particularly concerning as it indicates the cardiovascular system is becoming compromised.</p>
        `,
        aiExplanation: `
            <p>The AI system identifies early sepsis through multiple mechanisms:</p>
            <ul>
                <li>Multivariate anomaly detection identifies the abnormal correlation between increasing heart rate and decreasing blood pressure</li>
                <li>Pattern recognition matches these vital sign changes to sepsis patterns in the training data</li>
                <li>The rapid elevation in risk score (from ~20% to >80%) triggers high-priority alerts</li>
                <li>Prediction algorithms correctly forecast continued deterioration of vital signs</li>
                <li>LSTM neural networks in the system recognize the temporal progression pattern typical of sepsis</li>
            </ul>
            <p>This demonstrates the system's ability to detect complex clinical conditions through the correlation of multiple vital signs, potentially allowing for earlier intervention compared to traditional threshold-based monitoring.</p>
        `
    },
    {
        id: 'hypoxia',
        title: 'Respiratory Distress',
        description: 'Decreasing oxygen levels with respiratory compensation',
        category: 'critical',
        icon: 'fa-lungs',
        duration: 8,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 82,
                bloodPressure: [125, 82],
                respiratoryRate: 18,
                oxygenSaturation: 96,
                temperature: 98.7,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 90,
                bloodPressure: [130, 85],
                respiratoryRate: 22,
                oxygenSaturation: 93,
                temperature: 98.8,
                ecgPattern: 'normal'
            },
            {
                timePoint: 120,
                heartRate: 100,
                bloodPressure: [135, 88],
                respiratoryRate: 26,
                oxygenSaturation: 90,
                temperature: 98.9,
                ecgPattern: 'tachycardia'
            },
            {
                timePoint: 180,
                heartRate: 115,
                bloodPressure: [140, 90],
                respiratoryRate: 30,
                oxygenSaturation: 87,
                temperature: 99.0,
                ecgPattern: 'tachycardia'
            }
        ],
        clinicalExplanation: `
            <p>This patient is experiencing progressive respiratory distress with hypoxemia (low blood oxygen):</p>
            <ul>
                <li>Oxygen saturation has fallen from normal to severely low (87%)</li>
                <li>Respiratory rate has increased dramatically as the body attempts to compensate</li>
                <li>Heart rate increases to boost cardiac output and oxygen delivery</li>
                <li>Blood pressure rises due to catecholamine release and stress response</li>
            </ul>
            <p>Possible causes include:</p>
            <ul>
                <li>Pulmonary embolism</li>
                <li>Pneumonia or respiratory infection</li>
                <li>Bronchospasm/asthma exacerbation</li>
                <li>Pulmonary edema</li>
                <li>ARDS (Acute Respiratory Distress Syndrome)</li>
            </ul>
            <p>This is a medical emergency requiring immediate intervention to support oxygenation.</p>
        `,
        aiExplanation: `
            <p>The AI monitoring system rapidly identifies this respiratory emergency:</p>
            <ul>
                <li>Oxygen saturation trend analysis detects the consistent downward trajectory</li>
                <li>Correlation analysis identifies the compensatory increases in respiratory rate and heart rate</li>
                <li>Risk calculator properly prioritizes oxygen saturation drops, appropriately weighting this as more critical than other vital sign changes</li>
                <li>Predictive algorithms forecast continued deterioration if not treated</li>
                <li>Risk score escalates rapidly from ~20% to >75% as oxygen levels fall below 90%</li>
            </ul>
            <p>The system's ability to correlate multiple vital signs helps distinguish true respiratory distress from probe artifacts or false readings, reducing false alarms while ensuring critical situations are flagged.</p>
        `
    },
    {
        id: 'hypertensive',
        title: 'Hypertensive Crisis',
        description: 'Dangerous elevation in blood pressure',
        category: 'critical',
        icon: 'fa-tachometer-alt',
        duration: 7,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 85,
                bloodPressure: [150, 95],
                respiratoryRate: 18,
                oxygenSaturation: 97,
                temperature: 98.6,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 90,
                bloodPressure: [165, 100],
                respiratoryRate: 20,
                oxygenSaturation: 97,
                temperature: 98.7,
                ecgPattern: 'normal'
            },
            {
                timePoint: 120,
                heartRate: 95,
                bloodPressure: [180, 105],
                respiratoryRate: 22,
                oxygenSaturation: 96,
                temperature: 98.8,
                ecgPattern: 'normal'
            },
            {
                timePoint: 180,
                heartRate: 100,
                bloodPressure: [195, 110],
                respiratoryRate: 24,
                oxygenSaturation: 95,
                temperature: 99.0,
                ecgPattern: 'st_depression'
            }
        ],
        clinicalExplanation: `
            <p>This patient is experiencing a hypertensive crisis with blood pressure reaching dangerously high levels:</p>
            <ul>
                <li>Systolic pressure >180 mmHg and diastolic pressure >110 mmHg indicate hypertensive crisis</li>
                <li>Moderate increase in heart rate and respiratory rate indicate physiological stress</li>
                <li>The appearance of ST depression on ECG suggests myocardial strain or ischemia due to increased workload</li>
            </ul>
            <p>This represents an urgent medical situation that requires immediate treatment to prevent target organ damage such as:</p>
            <ul>
                <li>Stroke</li>
                <li>Myocardial infarction</li>
                <li>Kidney damage</li>
                <li>Aortic dissection</li>
                <li>Hypertensive encephalopathy</li>
            </ul>
        `,
        aiExplanation: `
            <p>The AI system effectively detects and analyzes the hypertensive crisis:</p>
            <ul>
                <li>Blood pressure analytics identify the concerning upward trend</li>
                <li>ECG analysis detects the development of ST depression, correlating it with the extreme blood pressure</li>
                <li>The system correctly assigns a high risk score (~70-80%) despite other vital signs being relatively stable</li>
                <li>Predictive algorithms forecast continued elevation if not treated</li>
                <li>The system distinguishes this from temporary blood pressure elevations due to pain or anxiety by analyzing the persistent trend</li>
            </ul>
            <p>This demonstrates the AI's ability to prioritize critical values and identify situations where a single vital sign reaching extreme levels constitutes an emergency regardless of other parameters.</p>
        `
    },
    {
        id: 'bradycardia',
        title: 'Severe Bradycardia',
        description: 'Dangerous slowing of heart rate',
        category: 'critical',
        icon: 'fa-heart',
        duration: 6,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 60,
                bloodPressure: [115, 75],
                respiratoryRate: 16,
                oxygenSaturation: 97,
                temperature: 98.6,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 50,
                bloodPressure: [110, 70],
                respiratoryRate: 16,
                oxygenSaturation: 97,
                temperature: 98.5,
                ecgPattern: 'bradycardia'
            },
            {
                timePoint: 120,
                heartRate: 40,
                bloodPressure: [100, 65],
                respiratoryRate: 14,
                oxygenSaturation: 96,
                temperature: 98.4,
                ecgPattern: 'bradycardia'
            },
            {
                timePoint: 180,
                heartRate: 32,
                bloodPressure: [90, 60],
                respiratoryRate: 12,
                oxygenSaturation: 95,
                temperature: 98.2,
                ecgPattern: 'bradycardia'
            }
        ],
        clinicalExplanation: `
            <p>This patient has developed severe bradycardia (abnormally slow heart rate):</p>
            <ul>
                <li>Heart rate has progressively decreased to dangerously low levels</li>
                <li>Blood pressure is falling due to decreased cardiac output</li>
                <li>Respiratory rate is decreasing slightly, possibly due to vagal effects</li>
                <li>Oxygen saturation is relatively maintained but at risk as perfusion decreases</li>
            </ul>
            <p>Possible causes include:</p>
            <ul>
                <li>AV block or other conduction disorders</li>
                <li>Medication effects (beta blockers, calcium channel blockers)</li>
                <li>Electrolyte abnormalities (hyperkalemia)</li>
                <li>Increased intracranial pressure</li>
                <li>Vagal response</li>
                <li>Hypothyroidism (in chronic cases)</li>
            </ul>
            <p>This requires urgent intervention, potentially including atropine, external pacing, or other chronotropic agents.</p>
        `,
        aiExplanation: `
            <p>The AI monitoring system effectively tracks and analyzes the developing bradycardia:</p>
            <ul>
                <li>Heart rate trend analysis identifies the consistent downward trajectory</li>
                <li>ECG pattern recognition confirms true bradycardia versus artifact</li>
                <li>Correlation analysis links the falling heart rate with decreasing blood pressure</li>
                <li>The risk calculator properly escalates the risk score as heart rate falls below critical thresholds</li>
                <li>The system distinguishes pathological bradycardia from normal athlete's bradycardia by analyzing the trend and associated vital sign changes</li>
            </ul>
            <p>This scenario demonstrates the AI's ability to detect gradual deterioration that might develop over hours rather than minutes, allowing for earlier intervention.</p>
        `
    },
    {
        id: 'afib',
        title: 'Atrial Fibrillation',
        description: 'Irregular heart rhythm with variable rate',
        category: 'warning',
        icon: 'fa-heartbeat',
        duration: 6,
        vitalSigns: [
            {
                timePoint: 0,
                heartRate: 75,
                bloodPressure: [120, 80],
                respiratoryRate: 16,
                oxygenSaturation: 98,
                temperature: 98.6,
                ecgPattern: 'normal'
            },
            {
                timePoint: 60,
                heartRate: 110,
                bloodPressure: [125, 82],
                respiratoryRate: 18,
                oxygenSaturation: 97,
                temperature: 98.6,
                ecgPattern: 'afib'
            },
            {
                timePoint: 120,
                heartRate: 95,
                bloodPressure: [122, 80],
                respiratoryRate: 17,
                oxygenSaturation: 97,
                temperature: 98.7,
                ecgPattern: 'afib'
            },
            {
                timePoint: 180,
                heartRate: 120,
                bloodPressure: [128, 83],
                respiratoryRate: 18,
                oxygenSaturation: 96,
                temperature: 98.6,
                ecgPattern: 'afib'
            }
        ],
        clinicalExplanation: `
            <p>This patient has developed atrial fibrillation, an irregular heart rhythm originating in the atria:</p>
            <ul>
                <li>Heart rate shows characteristic variability, sometimes fast and sometimes slower</li>
                <li>Blood pressure remains relatively stable but may fluctuate with heart rate changes</li>
                <li>The ECG shows irregular rhythm without clear P waves (atrial activity)</li>
                <li>Other vital signs remain relatively stable, typical for new-onset atrial fibrillation</li>
            </ul>
            <p>While not immediately life-threatening in most cases, atrial fibrillation requires medical evaluation due to:</p>
            <ul>
                <li>Increased stroke risk from potential clot formation in the atria</li>
                <li>Risk of heart failure if rate remains uncontrolled</li>
                <li>Potential underlying cardiac or systemic issues</li>
            </ul>
        `,
        aiExplanation: `
            <p>The AI system demonstrates sophisticated heart rhythm analysis capabilities:</p>
            <ul>
                <li>ECG pattern recognition identifies the characteristic irregular rhythm of atrial fibrillation</li>
                <li>Heart rate variability analysis detects the abnormal beat-to-beat variations</li>
                <li>The system distinguishes atrial fibrillation from sinus tachycardia despite similar average heart rates</li>
                <li>Risk scoring appropriately classifies this as moderate risk (~40-50%) rather than critical</li>
                <li>The AI maintains the atrial fibrillation classification despite the variable heart rate, showing pattern persistence</li>
            </ul>
            <p>This demonstrates the system's ability to perform complex cardiac rhythm analysis that would typically require trained medical interpretation.</p>
        `
    }
];

// Helper functions for the simulator
const ScenarioUtils = {
    // Get a specific scenario by ID
    getScenarioById: (id) => {
        return PatientScenarios.find(scenario => scenario.id === id);
    },
    
    // Interpolate vital signs between time points
    interpolateVitals: (scenario, currentTime) => {
        const vitalSigns = scenario.vitalSigns;
        
        // Find the appropriate time points to interpolate between
        let lowerIndex = 0;
        let upperIndex = vitalSigns.length - 1;
        
        for (let i = 0; i < vitalSigns.length - 1; i++) {
            if (currentTime >= vitalSigns[i].timePoint && currentTime < vitalSigns[i + 1].timePoint) {
                lowerIndex = i;
                upperIndex = i + 1;
                break;
            }
        }
        
        // If we're at or past the last time point, just return the last values
        if (currentTime >= vitalSigns[upperIndex].timePoint) {
            return vitalSigns[upperIndex];
        }
        
        // Calculate interpolation factor
        const lowerTime = vitalSigns[lowerIndex].timePoint;
        const upperTime = vitalSigns[upperIndex].timePoint;
        const factor = (currentTime - lowerTime) / (upperTime - lowerTime);
        
        // Interpolate each vital sign
        const interpolated = {
            timePoint: currentTime,
            heartRate: ScenarioUtils.lerp(vitalSigns[lowerIndex].heartRate, vitalSigns[upperIndex].heartRate, factor),
            respiratoryRate: ScenarioUtils.lerp(vitalSigns[lowerIndex].respiratoryRate, vitalSigns[upperIndex].respiratoryRate, factor),
            oxygenSaturation: ScenarioUtils.lerp(vitalSigns[lowerIndex].oxygenSaturation, vitalSigns[upperIndex].oxygenSaturation, factor),
            temperature: ScenarioUtils.lerp(vitalSigns[lowerIndex].temperature, vitalSigns[upperIndex].temperature, factor),
            // For array values like blood pressure, interpolate each element
            bloodPressure: [
                ScenarioUtils.lerp(vitalSigns[lowerIndex].bloodPressure[0], vitalSigns[upperIndex].bloodPressure[0], factor),
                ScenarioUtils.lerp(vitalSigns[lowerIndex].bloodPressure[1], vitalSigns[upperIndex].bloodPressure[1], factor)
            ]
        };
        
        // For ECG pattern, use the nearest one (can't interpolate categoricals)
        interpolated.ecgPattern = factor < 0.5 ? vitalSigns[lowerIndex].ecgPattern : vitalSigns[upperIndex].ecgPattern;
        
        return interpolated;
    },
    
    // Linear interpolation helper
    lerp: (start, end, factor) => {
        return start + (end - start) * factor;
    },
    
    // Add some realistic noise to vital signs
    addNoise: (vitals) => {
        // Clone the object to avoid modifying the original
        const result = JSON.parse(JSON.stringify(vitals));
        
        // Add small random variations to make it more realistic
        result.heartRate += (Math.random() - 0.5) * 3;
        result.bloodPressure[0] += (Math.random() - 0.5) * 5;
        result.bloodPressure[1] += (Math.random() - 0.5) * 3;
        result.respiratoryRate += (Math.random() - 0.5) * 1;
        result.oxygenSaturation += (Math.random() - 0.5) * 1;
        result.temperature += (Math.random() - 0.5) * 0.2;
        
        // Round values to appropriate precision
        result.heartRate = Math.round(result.heartRate * 10) / 10;
        result.bloodPressure[0] = Math.round(result.bloodPressure[0]);
        result.bloodPressure[1] = Math.round(result.bloodPressure[1]);
        result.respiratoryRate = Math.round(result.respiratoryRate * 10) / 10;
        result.oxygenSaturation = Math.round(result.oxygenSaturation * 10) / 10;
        result.temperature = Math.round(result.temperature * 10) / 10;
        
        return result;
    }
};