/**
 * Analytics Utility
 * Handles data analysis and analytics calculations
 */

/**
 * Analyze sheet data and calculate KPIs
 * @param {Array} data - Sheet data to analyze
 * @returns {Object} Calculated KPIs
 */
function analyzeSheetData(data) {
    if (!data || !Array.isArray(data)) {
        console.log('⚠️  No sheet data available, using fallback values');
        // Return fallback data
        return {
            meetingsBooked: 4,
            pending: 1,
            scheduled: 1,
            pendingRecall: 0,
            totalLeads: 6,
            successRate: 66.7
        };
    }

    const stats = {
        meetingsBooked: 0,
        pending: 0,
        scheduled: 0,
        pendingRecall: 0,
        totalLeads: data.length,
        successRate: 0
    };

    console.log(`📊 Analyzing ${data.length} records from source data...`);

    // If data is an array of arrays (e.g., from sheets direct API)
    if (Array.isArray(data[0])) {
        const headers = data[0];
        
        // Find the column index for call status
        let statusColumnIndex = -1;
        headers.forEach((header, index) => {
            if (header.toLowerCase().includes('status') || header.toLowerCase().includes('callstatus')) {
                statusColumnIndex = index;
            }
        });
        
        if (statusColumnIndex === -1) {
            console.log('⚠️ Could not find status column in data');
            return stats;
        }
        
        // Process each row starting from row 1 (after headers)
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (row.length <= statusColumnIndex) continue;
            
            const callStatus = (row[statusColumnIndex] || '').trim();
            
            if (callStatus === 'Meeting Booked') {
                stats.meetingsBooked++;
            } else if (callStatus === 'Pending') {
                stats.pending++;
            } else if (callStatus === 'Scheduled') {
                stats.scheduled++;
            } else if (callStatus === 'Pending Recall') {
                stats.pendingRecall++;
            }
        }
    } 
    // If data is an array of objects (e.g., from CSV processing)
    else {
        data.forEach((record, index) => {
            // Look specifically for CallStatus column (exact matching)
            let callStatus = '';
            Object.keys(record).forEach(key => {
                if (key.toLowerCase() === 'callstatus' || key.toLowerCase() === 'call_status' || 
                    key.toLowerCase() === 'status' || key === 'CallStatus') {
                    callStatus = record[key];
                }
            });

            callStatus = (callStatus || '').trim();
            
            if (callStatus === 'Meeting Booked') {
                stats.meetingsBooked++;
            } else if (callStatus === 'Pending') {
                stats.pending++;
            } else if (callStatus === 'Scheduled') {
                stats.scheduled++;
            } else if (callStatus === 'Pending Recall') {
                stats.pendingRecall++;
            }
        });
    }

    // Calculate success rate
    const totalRecordsWithStatus = stats.meetingsBooked + stats.pending + stats.scheduled + stats.pendingRecall;
    stats.successRate = totalRecordsWithStatus > 0 
        ? parseFloat(((stats.meetingsBooked / totalRecordsWithStatus) * 100).toFixed(1))
        : 0;

    console.log('📈 KPI Calculation Results:', {
        'Meetings Booked': stats.meetingsBooked,
        'Pending': stats.pending,
        'Scheduled': stats.scheduled,
        'Pending Recall': stats.pendingRecall,
        'Total Records': stats.totalLeads,
        'Records with Status': totalRecordsWithStatus,
        'Success Rate Formula': `${stats.meetingsBooked} / ${totalRecordsWithStatus} * 100 = ${stats.successRate}%`
    });

    return stats;
}

/**
 * Generate sample daily stats for demo purposes
 * @returns {Array} Array of daily stats objects
 */
function generateDailyStats() {
    const stats = [];
    for (let i = 30; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        stats.push({
            date: date.toISOString().split('T')[0],
            calls: Math.floor(Math.random() * 20) + 10,
            meetings: Math.floor(Math.random() * 8) + 2,
            successRate: Math.floor(Math.random() * 30) + 15
        });
    }
    return stats;
}

/**
 * Calculate trend direction based on stats
 * @param {Array} stats - Array of stat objects with successRate property
 * @returns {string} Trend direction: 'up', 'down', or 'stable'
 */
function calculateTrend(stats) {
    if (stats.length < 2) return 'stable';
    
    const recent = stats.slice(-7); // Last 7 days
    const previous = stats.slice(-14, -7); // Previous 7 days
    
    const recentAvg = recent.reduce((sum, stat) => sum + stat.successRate, 0) / recent.length;
    const previousAvg = previous.reduce((sum, stat) => sum + stat.successRate, 0) / previous.length || recentAvg;
    
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
}

module.exports = {
    analyzeSheetData,
    generateDailyStats,
    calculateTrend
};
