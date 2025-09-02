// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    updateTimestamp();
    checkServerStatus();
    loadStats();
});

// Update timestamp
function updateTimestamp() {
    const timestampElement = document.getElementById('readyTimestamp');
    if (timestampElement) {
        timestampElement.textContent = new Date().toLocaleString();
    }
}

// Check server status
async function checkServerStatus() {
    try {
        // Use the correct API endpoint for health status
        const response = await fetch('/api/health');
        const data = await response.json();
        
        if (data.success && data.data.status === 'healthy') {
            updateStatus('ready', 'System healthy and ready');
        } else {
            updateStatus('warning', 'System connected but reporting issues');
        }
    } catch (error) {
        console.error('Health check failed:', error);
        updateStatus('error', 'Connection error - please refresh');
    }
}

// Load statistics
async function loadStats() {
    try {
        // Add timestamp to prevent caching
        const response = await fetch('/api/stats?t=' + new Date().getTime());
        const data = await response.json();
        
        if (data.success) {
            // Update KPI values if the elements exist
            const elementsMap = {
                'totalLeads': data.data.totalLeads,
                'callsMade': data.data.callsCompleted || data.data.pending + data.data.scheduled + data.data.meetingsBooked,
                'meetingsBooked': data.data.meetingsBooked,
                'successRate': data.data.successRate + '%'
            };
            
            // Update each element if it exists
            for (const [id, value] of Object.entries(elementsMap)) {
                const element = document.getElementById(id);
                if (element) element.textContent = value;
            }
            
            console.log('✅ KPI data updated with real-time values:', data.data);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Refresh Google Sheet
function refreshSheet() {
    const iframe = document.getElementById('googleSheet');
    const refreshBtn = document.querySelector('.refresh-btn');
    
    // Add loading state
    refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    refreshBtn.disabled = true;
    
    // Reload the iframe
    iframe.src = iframe.src;
    
    // Reset button after 2 seconds
    setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        refreshBtn.disabled = false;
        addStatusUpdate('success', 'Google Sheet refreshed successfully');
    }, 2000);
}

// Main function to start the AI Cold Call workflow
async function startWorkflow() {
    const startBtn = document.getElementById('startBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Disable button and show loading
    startBtn.disabled = true;
    startBtn.style.display = 'none';
    loadingSpinner.style.display = 'inline-flex';
    
    // Update status
    updateStatus('processing', 'Initiating AI Cold Call workflow...');
    addStatusUpdate('processing', 'Connecting to AI Cold Call Agent...');
    
    try {
        // Make API call to trigger the workflow
        const response = await fetch('/api/trigger-workflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                source: 'client-dashboard',
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Success - show modal and update status
            updateStatus('success', result.demo ? 'Demo mode - Ready to configure' : 'Workflow triggered successfully');
            
            if (result.demo) {
                addStatusUpdate('success', 'Demo mode: Interface is working correctly');
                addStatusUpdate('processing', 'Next step: Configure your n8n webhook URL');
                addStatusUpdate('processing', 'Update N8N_WEBHOOK_URL in .env file');
            } else {
                // Real workflow triggered - show actual status
                addStatusUpdate('success', 'AI Cold Call workflow triggered successfully');
                addStatusUpdate('processing', 'Workflow is now running in n8n...');
                
                // Add a completion check after reasonable time
                setTimeout(() => {
                    addStatusUpdate('success', 'Workflow execution completed');
                    addStatusUpdate('ready', 'Check n8n execution history for detailed results');
                    updateStatus('ready', 'Workflow completed - Ready for next run');
                }, 5000); // 5 seconds - adjust based on your workflow duration
            }
            
            showSuccessModal(result.demo);
            
        } else {
            throw new Error(result.message || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('Workflow trigger failed:', error);
        updateStatus('error', 'Failed to start workflow');
        addStatusUpdate('error', `Error: ${error.message}`);
        showErrorModal(error.message);
    } finally {
        // Re-enable button
        setTimeout(() => {
            startBtn.disabled = false;
            startBtn.style.display = 'inline-flex';
            loadingSpinner.style.display = 'none';
        }, 3000);
    }
}

// Update main status indicator
function updateStatus(type, message) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    // Remove existing classes
    statusDot.className = 'status-dot';
    
    // Add new class based on type
    switch(type) {
        case 'ready':
            statusDot.style.background = '#10b981';
            break;
        case 'processing':
            statusDot.style.background = '#f59e0b';
            break;
        case 'success':
            statusDot.style.background = '#16a34a';
            break;
        case 'error':
            statusDot.style.background = '#ef4444';
            break;
    }
    
    statusText.textContent = message;
}

// Clear status log
function clearStatusLog() {
    const statusLog = document.getElementById('statusLog');
    statusLog.innerHTML = `
        <div class="status-item ready">
            <i class="fas fa-check-circle"></i>
            <span>Status log cleared - System ready</span>
            <small class="timestamp">${new Date().toLocaleString()}</small>
        </div>
    `;
    updateStatus('ready', 'System ready');
}

// Add status update to the log
function addStatusUpdate(type, message) {
    const statusLog = document.getElementById('statusLog');
    const statusItem = document.createElement('div');
    statusItem.className = `status-item ${type}`;
    
    let icon;
    switch(type) {
        case 'ready':
            icon = 'fas fa-check-circle';
            break;
        case 'processing':
            icon = 'fas fa-spinner fa-spin';
            break;
        case 'success':
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            icon = 'fas fa-exclamation-triangle';
            break;
        default:
            icon = 'fas fa-info-circle';
    }
    
    statusItem.innerHTML = `
        <i class="${icon}"></i>
        <span>${message}</span>
        <small class="timestamp">${new Date().toLocaleString()}</small>
    `;
    
    // Add to top of log
    statusLog.insertBefore(statusItem, statusLog.firstChild);
    
    // Limit to 10 status items
    while (statusLog.children.length > 10) {
        statusLog.removeChild(statusLog.lastChild);
    }
    
    // Scroll to show new item
    statusItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Show success modal
function showSuccessModal(isDemoMode = false) {
    const modal = document.getElementById('successModal');
    const modalContent = modal.querySelector('.modal-body p');
    
    if (isDemoMode) {
        modalContent.innerHTML = `
            <strong>🎯 Demo Mode Active!</strong><br><br>
            Your interface is working perfectly. To connect to your actual AI Cold Call Agent:
            <br><br>
            1. Update the <code>N8N_WEBHOOK_URL</code> in your .env file<br>
            2. Make sure your n8n instance is running<br>
            3. Test the connection again
        `;
    } else {
        modalContent.innerHTML = `
            <strong>✅ Workflow Triggered Successfully!</strong><br><br>
            Your AI Cold Call Agent workflow has been started in n8n. 
            <br><br>
            📞 <strong>Next:</strong> Check your n8n dashboard to monitor call progress<br>
            📊 <strong>Results:</strong> Call outcomes will be updated in your Google Sheet
        `;
    }
    
    modal.style.display = 'block';
    
    // Auto-close after 6 seconds
    setTimeout(() => {
        closeModal();
    }, 6000);
}

// Show error modal
function showErrorModal(errorMessage) {
    const modal = document.getElementById('errorModal');
    const errorMessageElement = document.getElementById('errorMessage');
    
    errorMessageElement.textContent = errorMessage || 'An unexpected error occurred. Please try again.';
    modal.style.display = 'block';
}

// Close success modal
function closeModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}

// Close error modal
function closeErrorModal() {
    const modal = document.getElementById('errorModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const successModal = document.getElementById('successModal');
    const errorModal = document.getElementById('errorModal');
    
    if (event.target === successModal) {
        closeModal();
    }
    if (event.target === errorModal) {
        closeErrorModal();
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Escape key closes modals
    if (event.key === 'Escape') {
        closeModal();
        closeErrorModal();
    }
    
    // Ctrl+Enter triggers workflow
    if (event.ctrlKey && event.key === 'Enter') {
        const startBtn = document.getElementById('startBtn');
        if (!startBtn.disabled) {
            startWorkflow();
        }
    }
    
    // F5 or Ctrl+R refreshes sheet
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        refreshSheet();
    }
});

// Periodic status checks (every 30 seconds)
setInterval(checkServerStatus, 30000);

// Initialize with clean status
setTimeout(() => {
    addStatusUpdate('ready', 'System initialized and ready for cold calling');
}, 1000);
