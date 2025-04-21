/**
 * Body Map JavaScript
 * Handles the interactive body map functionality for symptom selection
 */

// Body part symptom mappings
const bodyPartSymptoms = {
    'head': {
        'General': [
            'headache', 
            'dizziness',
            'pain behind the eyes',
            'lack of concentration'
        ],
        'Neurological': [
            'slurred speech',
            'altered sensorium',
            'coma',
            'visual disturbances',
            'spinning movements',
            'loss of balance',
            'unsteadiness'
        ]
    },
    'eyes': {
        'Eye Symptoms': [
            'redness of eyes', 
            'watering from eyes',
            'blurred and distorted vision',
            'yellowing of eyes'
        ]
    },
    'chest': {
        'General': [
            'chest pain',
            'breathlessness'
        ],
        'Respiratory': [
            'cough',
            'congestion',
            'phlegm',
            'mucoid sputum',
            'rusty sputum',
            'blood in sputum'
        ],
        'Circulatory': [
            'fast heart rate',
            'palpitations'
        ]
    },
    'abdomen': {
        'Digestive': [
            'stomach pain',
            'belly pain',
            'abdominal pain',
            'vomiting',
            'nausea',
            'indigestion',
            'diarrhoea',
            'constipation',
            'acidity',
            'loss of appetite',
            'excessive hunger',
            'increased appetite',
            'distention of abdomen',
            'swelling of stomach',
            'stomach bleeding',
            'passage of gases'
        ],
        'Liver Related': [
            'yellowish skin',
            'acute liver failure'
        ]
    },
    'skin': {
        'Skin Problems': [
            'itching',
            'skin rash',
            'nodal skin eruptions',
            'dischromic patches',
            'skin peeling',
            'yellow crust ooze',
            'pus filled pimples',
            'blackheads',
            'scurring',
            'silver like dusting',
            'red spots over body',
            'bruising',
            'blister'
        ]
    },
    'arms': {
        'Arm Problems': [
            'pain in arms',
            'weakness in limbs',
            'muscle weakness',
            'swollen extremeties'
        ],
        'Hand Related': [
            'cold hands and feets',
            'small dents in nails',
            'inflammatory nails',
            'brittle nails'
        ]
    },
    'legs': {
        'Leg Problems': [
            'pain in legs',
            'muscle weakness',
            'swollen legs',
            'painful walking',
            'prominent veins on calf',
            'swollen extremeties',
            'weakness in limbs',
            'weakness of one body side'
        ],
        'Foot Related': [
            'cold hands and feets'
        ]
    },
    'joints': {
        'Joint Problems': [
            'joint pain',
            'knee pain',
            'hip joint pain',
            'neck pain',
            'stiff neck',
            'movement stiffness',
            'swelling joints',
            'painful walking'
        ]
    },
    'digestive': {
        'Digestive Issues': [
            'stomach pain',
            'acidity',
            'ulcers on tongue',
            'vomiting',
            'indigestion',
            'loss of appetite',
            'burning micturition',
            'spotting urination',
            'diarrhoea',
            'constipation'
        ]
    },
    'respiratory': {
        'Respiratory Issues': [
            'breathlessness',
            'cough',
            'throat irritation',
            'patches in throat',
            'congestion',
            'runny nose',
            'sinus pressure',
            'continuous sneezing',
            'phlegm',
            'mucoid sputum',
            'rusty sputum',
            'blood in sputum'
        ]
    },
    'circulatory': {
        'Circulatory Issues': [
            'chest pain',
            'fast heart rate',
            'palpitations',
            'swollen blood vessels',
            'prominent veins on calf'
        ]
    },
    'neurological': {
        'Neurological Issues': [
            'headache',
            'dizziness',
            'lack of concentration',
            'visual disturbances',
            'altered sensorium',
            'slurred speech',
            'loss of balance',
            'unsteadiness',
            'spinning movements',
            'loss of smell'
        ]
    },
    'urinary': {
        'Urinary Issues': [
            'burning micturition',
            'spotting urination',
            'yellow urine',
            'dark urine',
            'foul smell of urine',
            'continuous feel of urine',
            'bladder discomfort',
            'polyuria'
        ]
    }
};

// General symptoms that can apply to the entire body
const generalSymptoms = [
    'fever',
    'high fever',
    'mild fever',
    'fatigue',
    'lethargy',
    'sweating',
    'chills',
    'shivering',
    'dehydration',
    'malaise',
    'restlessness',
    'muscle pain',
    'muscle wasting',
    'weight loss',
    'weight gain',
    'obesity',
    'anxiety',
    'depression',
    'irritability',
    'mood swings',
    'toxic look (typhos)',
    'swelled lymph nodes',
    'family history',
    'fluid overload',
    'internal itching'
];

// Initialize body map functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeBodyMap();
});

/**
 * Initialize the interactive body map
 */
function initializeBodyMap() {
    // Set up tab functionality if not already handled
    initializeBodyMapTabs();
    
    // Add event listeners to body parts
    const bodyParts = document.querySelectorAll('.body-part');
    bodyParts.forEach(part => {
        part.addEventListener('click', function() {
            // Deselect other parts
            bodyParts.forEach(p => p.classList.remove('selected'));
            
            // Select this part
            this.classList.add('selected');
            
            // Get the body part name
            const bodyPartName = this.getAttribute('data-part');
            
            // Display symptoms for this body part
            displayBodyPartSymptoms(bodyPartName);
        });
    });
    
    // Add event listener to the body map predict button
    const predictButton = document.getElementById('body-map-predict-button');
    if (predictButton) {
        predictButton.addEventListener('click', function() {
            // Get all selected symptoms
            const selectedSymptoms = getSelectedBodyMapSymptoms();
            
            if (selectedSymptoms.length === 0) {
                alert('Please select at least one symptom before prediction.');
                return;
            }
            
            // Update the main symptom selector with these symptoms
            updateMainSymptomSelector(selectedSymptoms);
            
            // Switch to the disease prediction tab
            document.getElementById('disease-prediction-tab').click();
            
            // Trigger prediction
            document.getElementById('predict-button').click();
        });
    }
}

/**
 * Initialize tab functionality for body map
 */
function initializeBodyMapTabs() {
    const diseaseTab = document.getElementById('disease-prediction-tab');
    const bodyMapTab = document.getElementById('body-map-tab');
    const historyTab = document.getElementById('history-tab');
    const helpTab = document.getElementById('help-tab');
    
    if (diseaseTab && bodyMapTab) {
        diseaseTab.addEventListener('click', function() {
            showPanel('disease-prediction-panel');
        });
        
        bodyMapTab.addEventListener('click', function() {
            showPanel('body-map-panel');
        });
        
        historyTab.addEventListener('click', function() {
            showPanel('history-panel');
        });
        
        helpTab.addEventListener('click', function() {
            showPanel('help-panel');
        });
    }
    
    function showPanel(panelId) {
        // Hide all panels
        const panels = document.querySelectorAll('.tab-panel');
        panels.forEach(panel => {
            panel.classList.remove('active');
        });
        
        // Show the selected panel
        const selectedPanel = document.getElementById(panelId);
        if (selectedPanel) {
            selectedPanel.classList.add('active');
        }
        
        // Update tab buttons
        const allTabs = document.querySelectorAll('.tab-button');
        allTabs.forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Add active class to the clicked tab
        if (panelId === 'disease-prediction-panel') {
            diseaseTab.classList.add('active');
        } else if (panelId === 'body-map-panel') {
            bodyMapTab.classList.add('active');
        } else if (panelId === 'history-panel') {
            historyTab.classList.add('active');
        } else if (panelId === 'help-panel') {
            helpTab.classList.add('active');
        }
    }
}

/**
 * Display symptoms for the selected body part
 */
function displayBodyPartSymptoms(bodyPartName) {
    const bodyPartNameElement = document.getElementById('body-part-name');
    const bodyPartSymptomsElement = document.getElementById('body-part-symptoms');
    
    if (!bodyPartNameElement || !bodyPartSymptomsElement) return;
    
    // Set the body part name
    bodyPartNameElement.textContent = formatBodyPartName(bodyPartName);
    
    // Clear existing symptoms
    bodyPartSymptomsElement.innerHTML = '';
    
    // Get symptoms for this body part
    const symptoms = bodyPartSymptoms[bodyPartName];
    
    if (!symptoms || Object.keys(symptoms).length === 0) {
        bodyPartSymptomsElement.innerHTML = '<p class="no-body-part-selected">No specific symptoms available for this body part</p>';
        return;
    }
    
    // Generate symptom checkboxes grouped by category
    for (const category in symptoms) {
        // Create category title
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'symptom-group-title';
        categoryTitle.textContent = category;
        bodyPartSymptomsElement.appendChild(categoryTitle);
        
        // Create symptom checkboxes
        const symptomList = symptoms[category];
        symptomList.forEach(symptom => {
            const label = document.createElement('label');
            label.className = 'symptom-checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'symptom-checkbox';
            checkbox.value = symptom;
            checkbox.addEventListener('change', updateSelectedBodyMapSymptoms);
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(formatSymptomName(symptom)));
            
            bodyPartSymptomsElement.appendChild(label);
        });
    }
    
    // If it's the general body, add general symptoms
    if (bodyPartName === 'skin') {
        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'symptom-group-title';
        categoryTitle.textContent = 'General Symptoms';
        bodyPartSymptomsElement.appendChild(categoryTitle);
        
        generalSymptoms.forEach(symptom => {
            const label = document.createElement('label');
            label.className = 'symptom-checkbox-label';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'symptom-checkbox';
            checkbox.value = symptom;
            checkbox.addEventListener('change', updateSelectedBodyMapSymptoms);
            
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(formatSymptomName(symptom)));
            
            bodyPartSymptomsElement.appendChild(label);
        });
    }
}

/**
 * Update the displayed list of selected symptoms from the body map
 */
function updateSelectedBodyMapSymptoms() {
    const selectedSymptoms = getSelectedBodyMapSymptoms();
    const container = document.getElementById('body-map-selected-symptoms-list');
    
    if (!container) return;
    
    if (selectedSymptoms.length === 0) {
        container.innerHTML = '<p class="no-symptoms-message">No symptoms selected</p>';
        
        // Disable the predict button
        const predictButton = document.getElementById('body-map-predict-button');
        if (predictButton) {
            predictButton.disabled = true;
        }
        return;
    }
    
    container.innerHTML = '';
    
    selectedSymptoms.forEach(symptom => {
        const tag = document.createElement('div');
        tag.className = 'symptom-tag';
        tag.innerHTML = `
            ${formatSymptomName(symptom)}
            <span class="remove-symptom" data-symptom="${symptom}">×</span>
        `;
        container.appendChild(tag);
    });
    
    // Add event listeners to remove buttons
    const removeButtons = container.querySelectorAll('.remove-symptom');
    removeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const symptomToRemove = this.getAttribute('data-symptom');
            
            // Find and uncheck the corresponding checkbox
            const checkbox = document.querySelector(`.symptom-checkbox[value="${symptomToRemove}"]`);
            if (checkbox) {
                checkbox.checked = false;
                updateSelectedBodyMapSymptoms();
            }
        });
    });
    
    // Enable the predict button
    const predictButton = document.getElementById('body-map-predict-button');
    if (predictButton) {
        predictButton.disabled = false;
    }
}

/**
 * Get all selected symptoms from the body map
 */
function getSelectedBodyMapSymptoms() {
    const checkboxes = document.querySelectorAll('.symptom-checkbox:checked');
    return Array.from(checkboxes).map(checkbox => checkbox.value);
}

/**
 * Update the main symptom selector with the body map selections
 */
function updateMainSymptomSelector(symptoms) {
    // Clear current selections
    $('#symptoms-select').val(null).trigger('change');
    
    // Add the selected symptoms
    const newSelections = symptoms;
    $('#symptoms-select').val(newSelections).trigger('change');
}

/**
 * Format body part name for display
 */
function formatBodyPartName(bodyPartName) {
    // Replace hyphens with spaces and capitalize
    const formatted = bodyPartName.replace(/-/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Format symptom name for display
 */
function formatSymptomName(symptomName) {
    // Replace underscores with spaces and capitalize first letter
    const formatted = symptomName.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}