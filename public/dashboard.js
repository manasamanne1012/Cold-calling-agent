// Dashboard JavaScript Functionality
console.log('🚀 Dashboard initialized');

// Global variables
let currentChart = null;
let activityUpdateInterval = null;

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Loading dashboard...');
    initializeDashboard();
    loadDashboardData();
    startRealTimeUpdates();
});

// Initialize dashboard components
function initializeDashboard() {
    // Set up navigation
    setupNavigation();
    
    // Initialize charts
    initializeCharts();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
}

// Navigation functionality
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show target section
            const target = this.getAttribute('data-section');
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Load section-specific data
            loadSectionData(target);
        });
    });
}

// Load data for specific sections
function loadSectionData(section) {
    console.log(`📋 Loading data for section: ${section}`);
    
    switch(section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'leads':
            loadLeadsData();
            break;
        case 'campaigns':
            loadCampaignsData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Dashboard data loading
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard-data');
        const data = await response.json();
        
        // Update KPI cards
        updateKPICards(data);
        
        // Update charts
        updateDashboardCharts(data);
        
        console.log('✅ Dashboard data loaded');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showErrorMessage('Failed to load dashboard data');
    }
}

// Update KPI cards with data
function updateKPICards(data) {
    const elements = {
        totalLeads: document.querySelector('[data-kpi="total-leads"]'),
        callsCompleted: document.querySelector('[data-kpi="calls-completed"]'),
        meetingsBooked: document.querySelector('[data-kpi="meetings-booked"]'),
        successRate: document.querySelector('[data-kpi="success-rate"]')
    };
    
    if (elements.totalLeads) elements.totalLeads.textContent = data.totalLeads || '0';
    if (elements.callsCompleted) elements.callsCompleted.textContent = data.callsCompleted || '0';
    if (elements.meetingsBooked) elements.meetingsBooked.textContent = data.meetingsBooked || '0';
    if (elements.successRate) elements.successRate.textContent = `${data.successRate || 0}%`;
}

// Initialize charts
function initializeCharts() {
    // Performance chart
    const performanceCtx = document.getElementById('performanceChart');
    if (performanceCtx) {
        initializePerformanceChart(performanceCtx);
    }
    
    // Outcomes chart
    const outcomesCtx = document.getElementById('outcomesChart');
    if (outcomesCtx) {
        initializeOutcomesChart(outcomesCtx);
    }
}

// Initialize performance chart
function initializePerformanceChart(ctx) {
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Calls Made',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4
            }, {
                label: 'Meetings Booked',
                data: [],
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    });
}

// Initialize outcomes chart
function initializeOutcomesChart(ctx) {
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Meetings', 'Follow-up', 'Not Interested', 'No Answer'],
            datasets: [{
                data: [23, 31, 18, 17],
                backgroundColor: [
                    '#2ecc71',
                    '#f39c12',
                    '#e74c3c',
                    '#95a5a6'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

// Update dashboard charts with new data
function updateDashboardCharts(data) {
    // This would update chart data when new data is received
    console.log('📈 Updating charts with new data');
}

// Event listeners setup
function setupEventListeners() {
    // Trigger workflow button
    const triggerBtn = document.getElementById('triggerWorkflow');
    if (triggerBtn) {
        triggerBtn.addEventListener('click', triggerWorkflow);
    }
    
    // Refresh data button
    const refreshBtn = document.getElementById('refreshData');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadDashboardData();
            showSuccessMessage('Data refreshed successfully');
        });
    }
    
    // Export data button
    const exportBtn = document.getElementById('exportData');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
}

// Trigger AI Cold Call workflow
async function triggerWorkflow() {
    const button = document.getElementById('triggerWorkflow');
    if (!button) return;
    
    // Update button state
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
    
    try {
        const response = await fetch('/api/trigger-workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage('Workflow triggered successfully!');
            // Refresh activity feed
            loadActivityFeed();
        } else {
            throw new Error(result.message || 'Failed to trigger workflow');
        }
    } catch (error) {
        console.error('❌ Error triggering workflow:', error);
        showErrorMessage('Failed to trigger workflow: ' + error.message);
    } finally {
        // Reset button state
        setTimeout(() => {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-phone"></i> Start AI Cold Call';
        }, 2000);
    }
}

// Load activity feed
async function loadActivityFeed() {
    try {
        const response = await fetch('/api/activity');
        const activities = await response.json();
        
        const feedContainer = document.getElementById('activityFeed');
        if (!feedContainer) return;
        
        feedContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${formatTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error loading activity feed:', error);
    }
}

// Get icon for activity type
function getActivityIcon(type) {
    const icons = {
        call: 'fa-phone',
        meeting: 'fa-calendar',
        email: 'fa-envelope',
        note: 'fa-sticky-note',
        system: 'fa-cog'
    };
    return icons[type] || 'fa-info-circle';
}

// Format timestamp
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

// Update date and time
function updateDateTime() {
    const now = new Date();
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = now.toLocaleString();
    }
}

// Start real-time updates
function startRealTimeUpdates() {
    // Update activity feed every 30 seconds
    setInterval(loadActivityFeed, 30000);
    
    // Update dashboard data every 2 minutes
    setInterval(loadDashboardData, 120000);
}

// Load other section data (placeholders)
function loadLeadsData() {
    console.log('📋 Loading leads data...');
    // Add leads-specific functionality here
}

function loadCampaignsData() {
    console.log('📋 Loading campaigns data...');
    // Add campaigns-specific functionality here
}

function loadAnalyticsData() {
    console.log('📋 Loading analytics data...');
    // Add analytics-specific functionality here
}

function loadSettingsData() {
    console.log('📋 Loading settings data...');
    // Add settings-specific functionality here
}

// Export data functionality
async function exportData() {
    try {
        const response = await fetch('/api/export');
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-data-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccessMessage('Data exported successfully!');
    } catch (error) {
        console.error('❌ Error exporting data:', error);
        showErrorMessage('Failed to export data');
    }
}

// Utility functions for showing messages
function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    // Animate in
    setTimeout(() => notification.classList.add('show'), 100);
}

// Mobile menu toggle
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    sidebar.classList.toggle('mobile-open');
    mainContent.classList.toggle('sidebar-open');
}

// Add mobile menu button functionality if it exists
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
});

console.log('✅ Dashboard JavaScript loaded successfully');
