// ==UserScript==
// @name         Auto-fill Batch, Rack, and Shelf with Heart Button
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Auto-fill Batch, Rack, Shelf fields and CJA location for checked rows with visual feedback and counter
// @author       You
// @match        http://10.145.22.11:8888/weed_catalogue.php
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /**
     * Configuration object for styling and constants
     */
    const CONFIG = {
        HEART: {
            ACTIVE: {
                color: '#2ecc71', // Green
                symbol: '❤'
            },
            INACTIVE: {
                color: '#e74c3c', // Red
                symbol: '❤'
            },
            style: {
                fontSize: '30px',
                cursor: 'pointer',
                position: 'fixed',
                top: '10px',
                right: '10px',
                zIndex: '9999',
                transition: 'all 0.3s ease',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                padding: '10px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.9)',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                textAlign: 'center'
            }
        },
        COUNTER: {
            style: {
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#34495e',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '5px 10px',
                borderRadius: '10px',
                position: 'fixed',
                right: '10px',
                top: '65px',
                zIndex: '9999',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                fontFamily: 'Arial, sans-serif',
                border: '2px solid #bdc3c7',
                minWidth: '30px',
                textAlign: 'center'
            }
        }
    };

    /**
     * State management
     */
    const state = {
        batchNo: '',
        rackNo: '',
        shelfNo: '',
        isDataLoaded: false,
        selectedCount: 0
    };

    /**
     * Creates and styles the heart button
     * @returns {HTMLElement} The styled heart button
     */
    function createHeartButton() {
        const heartButton = document.createElement('span');
        Object.assign(heartButton.style, CONFIG.HEART.style);
        updateHeartButtonState(heartButton);

        heartButton.addEventListener('mouseover', () => {
            heartButton.style.transform = 'scale(1.1)';
        });

        heartButton.addEventListener('mouseout', () => {
            heartButton.style.transform = 'scale(1)';
        });

        return heartButton;
    }

    /**
     * Creates and styles the counter element
     * @returns {HTMLElement} The styled counter element
     */
    function createCounterElement() {
        const counter = document.createElement('div');
        Object.assign(counter.style, CONFIG.COUNTER.style);
        updateCounter(counter);
        return counter;
    }

    /**
     * Updates the counter display
     * @param {HTMLElement} counterElement - The counter element to update
     */
    function updateCounter(counterElement) {
        state.selectedCount = document.querySelectorAll('input[type="checkbox"]:checked').length;
        counterElement.textContent = `Selected: ${state.selectedCount}`;

        // Visual feedback based on count
        if (state.selectedCount > 0) {
            counterElement.style.backgroundColor = '#e8f5e9';
            counterElement.style.borderColor = '#2ecc71';
            counterElement.style.color = '#2e7d32';
        } else {
            counterElement.style.backgroundColor = 'rgba(255,255,255,0.9)';
            counterElement.style.borderColor = '#bdc3c7';
            counterElement.style.color = '#34495e';
        }
    }

    /**
     * Updates the heart button's appearance based on data state
     * @param {HTMLElement} heartButton - The heart button element
     */
    function updateHeartButtonState(heartButton) {
        const currentState = state.isDataLoaded ? CONFIG.HEART.ACTIVE : CONFIG.HEART.INACTIVE;
        heartButton.innerHTML = currentState.symbol;
        heartButton.style.color = currentState.color;
    }

    /**
     * Fills in values for a specific row
     * @param {HTMLElement} row - The table row to fill
     */
    function fillRowValues(row) {
        if (!row) return;

        // Fill text inputs
        const inputs = row.querySelectorAll('input[type="text"]');
        const values = [state.batchNo, state.rackNo, state.shelfNo];

        inputs.forEach((input, index) => {
            if (input && values[index]) {
                input.value = values[index];
            }
        });

        // Set location dropdown to CJA
        const locationDropdown = row.querySelector('select');
        if (locationDropdown) {
            const cjaOption = Array.from(locationDropdown.options)
                .find(option => option.text.trim().toUpperCase() === 'CJA');

            if (cjaOption) {
                locationDropdown.value = cjaOption.value;
            }
        }
    }

    /**
     * Prompts user for input values
     * @param {HTMLElement} heartButton - The heart button element
     * @returns {boolean} Whether all values were successfully entered
     */
    async function promptForValues(heartButton) {
        const prompts = [
            { field: 'batchNo', message: 'Please enter Batch number:' },
            { field: 'rackNo', message: 'Please enter Rack number:' },
            { field: 'shelfNo', message: 'Please enter Shelf number:' }
        ];

        for (const prompt of prompts) {
            const value = window.prompt(prompt.message);
            if (value === null) return false; // User cancelled
            state[prompt.field] = value;
        }

        state.isDataLoaded = true;
        updateHeartButtonState(heartButton);
        return true;
    }

    /**
     * Initialize the script
     */
    function init() {
        // Only run if we're on the correct page
        if (window.location.href === 'http://10.145.22.11:8888/weed_catalogue.php') {
            const heartButton = createHeartButton();
            const counterElement = createCounterElement();

            document.body.appendChild(heartButton);
            document.body.appendChild(counterElement);

            // Heart button click handler
            heartButton.addEventListener('click', async () => {
                if (await promptForValues(heartButton)) {
                    const checkedBoxes = document.querySelectorAll('input[type="checkbox"]:checked');
                    checkedBoxes.forEach(checkbox => fillRowValues(checkbox.closest('tr')));
                }
            });

            // Checkbox change handler
            document.addEventListener('change', (e) => {
                if (e.target?.type === 'checkbox') {
                    updateCounter(counterElement);
                    if (state.isDataLoaded && e.target.checked) {
                        fillRowValues(e.target.closest('tr'));
                    }
                }
            });

            // Initial counter update
            updateCounter(counterElement);
        }
    }

    // Initialize on page load
    window.addEventListener('load', init);
})();