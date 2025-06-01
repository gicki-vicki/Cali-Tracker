class FitnessTracker {
    constructor() {
        // Use fallback storage if localStorage is not available
        this.storage = this.initStorage();
        this.workouts = this.loadWorkouts();
        this.currentType = 'reps';
        this.chart = null;
        this.currentFilter = 'all';
        
        this.initEventListeners();
        this.updateDisplay();
        this.updateChartExerciseOptions();
        this.updateStats();
    }

    initStorage() {
        try {
            // Test if localStorage is available
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return {
                getItem: (key) => localStorage.getItem(key),
                setItem: (key, value) => localStorage.setItem(key, value),
                removeItem: (key) => localStorage.removeItem(key)
            };
        } catch (e) {
            // Fallback to in-memory storage
            console.warn('localStorage not available, using in-memory storage');
            const storage = {};
            return {
                getItem: (key) => storage[key] || null,
                setItem: (key, value) => storage[key] = value,
                removeItem: (key) => delete storage[key]
            };
        }
    }

    loadWorkouts() {
        try {
            const data = this.storage.getItem('fitness_workouts');
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error loading workouts:', e);
            return [];
        }
    }

    saveWorkouts() {
        try {
            this.storage.setItem('fitness_workouts', JSON.stringify(this.workouts));
        } catch (e) {
            console.error('Error saving workouts:', e);
            this.showToast('Fehler beim Speichern!', 'error');
        }
    }

    initEventListeners() {
        // Form submission
        const form = document.getElementById('workoutForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addWorkout();
            });
        }

        // Type toggle
        const repsBtn = document.getElementById('repsBtn');
        const timeBtn = document.getElementById('timeBtn');
        
        if (repsBtn) repsBtn.addEventListener('click', () => this.setType('reps'));
        if (timeBtn) timeBtn.addEventListener('click', () => this.setType('time'));

        // Exercise selection
        const exerciseSelect = document.getElementById('exerciseName');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', (e) => {
                const customGroup = document.getElementById('customExerciseGroup');
                const customInput = document.getElementById('customExercise');
                
                if (e.target.value === 'custom') {
                    customGroup.style.display = 'block';
                    customInput.required = true;
                    customInput.focus();
                } else {
                    customGroup.style.display = 'none';
                    customInput.required = false;
                }
            });
        }

        // Chart exercise selection
        const chartSelect = document.getElementById('chartExercise');
        if (chartSelect) {
            chartSelect.addEventListener('change', (e) => {
                this.updateChart(e.target.value);
            });
        }

        // Filter buttons
        const filterAll = document.getElementById('filterAll');
        const filterReps = document.getElementById('filterReps');
        const filterTime = document.getElementById('filterTime');

        if (filterAll) filterAll.addEventListener('click', () => this.setFilter('all'));
        if (filterReps) filterReps.addEventListener('click', () => this.setFilter('reps'));
        if (filterTime) filterTime.addEventListener('click', () => this.setFilter('time'));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'Enter':
                        e.preventDefault();
                        const submitBtn = document.querySelector('button[type="submit"]');
                        if (submitBtn) submitBtn.click();
                        break;
                }
            }
        });
    }

    setType(type) {
        this.currentType = type;
        
        // Update buttons
        const repsBtn = document.getElementById('repsBtn');
        const timeBtn = document.getElementById('timeBtn');
        
        if (repsBtn) repsBtn.classList.toggle('active', type === 'reps');
        if (timeBtn) timeBtn.classList.toggle('active', type === 'time');
        
        // Show/hide form groups
        const repsGroup = document.getElementById('repsGroup');
        const timeGroup = document.getElementById('timeGroup');
        const repsInput = document.getElementById('reps');
        const durationInput = document.getElementById('duration');
        
        if (repsGroup) repsGroup.style.display = type === 'reps' ? 'block' : 'none';
        if (timeGroup) timeGroup.style.display = type === 'time' ? 'block' : 'none';
        
        // Update required fields
        if (repsInput) repsInput.required = type === 'reps';
        if (durationInput) durationInput.required = type === 'time';
    }

    setFilter(filter) {
        this.currentFilter = filter;
        
        // Update button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.getElementById(`filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        this.updateDisplay();
    }

    addWorkout() {
        const exerciseSelect = document.getElementById('exerciseName');
        const customExercise = document.getElementById('customExercise');
        const repsInput = document.getElementById('reps');
        const durationInput = document.getElementById('duration');

        if (!exerciseSelect) return;

        let exerciseName;
        if (exerciseSelect.value === 'custom') {
            exerciseName = customExercise?.value?.trim();
            if (!exerciseName) {
                this.showToast('Bitte gib einen Übungsnamen ein!', 'error');
                return;
            }
        } else {
            exerciseName = exerciseSelect.value;
        }

        if (!exerciseName) {
            this.showToast('Bitte wähle eine Übung aus!', 'error');
            return;
        }

        const value = this.currentType === 'reps' 
            ? parseInt(repsInput?.value) 
            : parseInt(durationInput?.value);

        if (!value || value <= 0) {
            this.showToast('Bitte gib einen gültigen Wert ein!', 'error');
            return;
        }

        const workout = {
            id: Date.now() + Math.random(), // More unique ID
            exercise: exerciseName,
            type: this.currentType,
            value: value,
            date: new Date().toISOString()
        };

        this.workouts.push(workout);
        this.saveWorkouts();
        this.updateDisplay();
        this.updateChartExerciseOptions();
        this.updateStats();
        
        // Reset form
        const form = document.getElementById('workoutForm');
        if (form) form.reset();
        
        const customGroup = document.getElementById('customExerciseGroup');
        const customInput = document.getElementById('customExercise');
        
        if (customGroup) customGroup.style.display = 'none';
        if (customInput) customInput.required = false;

        // Show success message
        this.showToast('Übung erfolgreich hinzugefügt! 💪', 'success');
        
        // Focus back to exercise select for quick adding
        if (exerciseSelect) exerciseSelect.focus();
    }

    deleteWorkout(id) {
        if (confirm('Möchtest du diese Übung wirklich löschen?')) {
            this.workouts = this.workouts.filter(workout => workout.id !== id);
            this.saveWorkouts();
            this.updateDisplay();
            this.updateChartExerciseOptions();
            this.updateStats();
            
            // Update chart if the deleted workout was being displayed
            const chartExercise = document.getElementById('chartExercise');
            if (chartExercise?.value) {
                this.updateChart(chartExercise.value);
            }

            this.showToast('Übung gelöscht!', 'success');
        }
    }

    updateDisplay() {
        const historyDiv = document.getElementById('workoutHistory');
        if (!historyDiv) return;
        
        let filteredWorkouts = [...this.workouts];
        
        // Apply filter
        if (this.currentFilter !== 'all') {
            filteredWorkouts = filteredWorkouts.filter(w => w.type === this.currentFilter);
        }
        
        if (filteredWorkouts.length === 0) {
            const message = this.currentFilter === 'all' 
                ? 'Noch keine Übungen hinzugefügt' 
                : `Keine ${this.currentFilter === 'reps' ? 'Wiederholungs' : 'Zeit'}-Übungen gefunden`;
            historyDiv.innerHTML = `<div class="no-data">${message}</div>`;
            return;
        }

        const sortedWorkouts = filteredWorkouts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        historyDiv.innerHTML = sortedWorkouts.map(workout => `
            <div class="workout-entry">
                <div class="workout-info">
                    <div class="workout-name">${this.escapeHtml(workout.exercise)}</div>
                    <div class="workout-details">
                        ${workout.value} ${workout.type === 'reps' ? 'Wiederholungen' : 'Sekunden'}
                    </div>
                    <div class="workout-date">${this.formatDate(workout.date)}</div>
                </div>
                <button class="delete-btn" onclick="tracker.deleteWorkout('${workout.id}')">
                    🗑️
                </button>
            </div>
        `).join('');
    }

    updateChartExerciseOptions() {
        const exercises = [...new Set(this.workouts.map(w => w.exercise))];
        const select = document.getElementById('chartExercise');
        if (!select) return;
        
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Übung auswählen...</option>' +
            exercises.map(exercise => 
                `<option value="${this.escapeHtml(exercise)}">${this.escapeHtml(exercise)}</option>`
            ).join('');
        
        // Restore selection if still valid
        if (exercises.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    updateChart(exerciseName) {
        const canvas = document.getElementById('progressChart');
        if (!canvas) return;

        if (!exerciseName) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }

        const exerciseWorkouts = this.workouts
            .filter(w => w.exercise === exerciseName)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (exerciseWorkouts.length === 0) {
            if (this.chart) {
                this.chart.destroy();
                this.chart = null;
            }
            return;
        }

        const labels = exerciseWorkouts.map(w => this.formatDate(w.date, true));
        const data = exerciseWorkouts.map(w => w.value);
        const type = exerciseWorkouts[0]?.type || 'reps';

        const ctx = canvas.getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }

        // Calculate trend
        const trend = this.calculateTrend(data);

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${exerciseName} (${type === 'reps' ? 'Wiederholungen' : 'Sekunden'})`,
                    data: data,
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#ff6b6b'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#667eea',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            title: (context) => {
                                return context[0].label;
                            },
                            label: (context) => {
                                const value = context.parsed.y;
                                const unit = type === 'reps' ? 'Wiederholungen' : 'Sekunden';
                                return `${value} ${unit}`;
                            },
                            afterLabel: (context) => {
                                const index = context.dataIndex;
                                if (index > 0) {
                                    const current = context.parsed.y;
                                    const previous = data[index - 1];
                                    const change = current - previous;
                                    const changeText = change > 0 ? `+${change}` : `${change}`;
                                    return change !== 0 ? `Veränderung: ${changeText}` : '';
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            color: '#666',
                            maxTicksLimit: 8
                        }
                    }
                },
                elements: {
                    point: {
                        hoverBackgroundColor: '#ff6b6b'
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updateStats() {
        const totalWorkoutsEl = document.getElementById('totalWorkouts');
        const totalExercisesEl = document.getElementById('totalExercises');
        const currentStreakEl = document.getElementById('currentStreak');

        if (totalWorkoutsEl) {
            totalWorkoutsEl.textContent = this.workouts.length;
        }

        if (totalExercisesEl) {
            const uniqueExercises = new Set(this.workouts.map(w => w.exercise));
            totalExercisesEl.textContent = uniqueExercises.size;
        }

        if (currentStreakEl) {
            currentStreakEl.textContent = this.calculateCurrentStreak();
        }
    }

    calculateCurrentStreak() {
        if (this.workouts.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get unique workout days
        const workoutDays = [...new Set(
            this.workouts.map(w => {
                const date = new Date(w.date);
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            })
        )].sort((a, b) => b - a); // Sort descending

        let streak = 0;
        let currentDate = today.getTime();

        for (const workoutDay of workoutDays) {
            if (workoutDay === currentDate) {
                streak++;
                currentDate -= 24 * 60 * 60 * 1000; // Go back one day
            } else if (workoutDay === currentDate + 24 * 60 * 60 * 1000) {
                // If we missed today but worked out yesterday
                if (streak === 0) {
                    streak++;
                    currentDate = workoutDay - 24 * 60 * 60 * 1000;
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        return streak;
    }

    calculateTrend(data) {
        if (data.length < 2) return 0;
        
        const n = data.length;
        const sumX = data.reduce((sum, _, i) => sum + i, 0);
        const sumY = data.reduce((sum, val) => sum + val, 0);
        const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
        const sumXX = data.reduce((sum, _, i) => sum + (i * i), 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    formatDate(dateString, short = false) {
        const date = new Date(dateString);
        const options = short 
            ? { month: 'short', day: 'numeric' }
            : { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
        
        return date.toLocaleDateString('de-DE', options);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Export/Import functionality
    exportData() {
        const data = {
            workouts: this.workouts,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Daten exportiert!', 'success');
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.workouts && Array.isArray(data.workouts)) {
                    if (confirm('Möchtest du deine aktuellen Daten ersetzen oder zusammenführen?\n\nOK = Ersetzen\nAbbrechen = Zusammenführen')) {
                        this.workouts = data.workouts;
                    } else {
                        // Merge data
                        const existingIds = new Set(this.workouts.map(w => w.id));
                        const newWorkouts = data.workouts.filter(w => !existingIds.has(w.id));
                        this.workouts = [...this.workouts, ...newWorkouts];
                    }
                    
                    this.saveWorkouts();
                    this.updateDisplay();
                    this.updateChartExerciseOptions();
                    this.updateStats();
                    this.showToast('Daten erfolgreich importiert!', 'success');
                } else {
                    throw new Error('Ungültiges Datenformat');
                }
            } catch (error) {
                console.error('Import error:', error);
                this.showToast('Fehler beim Importieren der Daten!', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the fitness tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new FitnessTracker();
    
    // Add export/import buttons (you can add these to your HTML if needed)
    const exportButton = document.createElement('button');
    exportButton.textContent = '📤 Export';
    exportButton.onclick = () => tracker.exportData();
    exportButton.style.cssText = 'position: fixed; bottom: 20px; left: 20px; z-index: 1000; padding: 10px; border: none; border-radius: 8px; background: #667eea; color: white; cursor: pointer;';
    
    const importButton = document.createElement('input');
    importButton.type = 'file';
    importButton.accept = '.json';
    importButton.onchange = (e) => tracker.importData(e);
    importButton.style.cssText = 'position: fixed; bottom: 70px; left: 20px; z-index: 1000;';
    
    // Uncomment these lines if you want export/import buttons
    // document.body.appendChild(exportButton);
    // document.body.appendChild(importButton);
});

// Service Worker registration for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}