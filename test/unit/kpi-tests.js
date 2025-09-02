// KPI Unit Tests - Testing PROPER business logic
// Success Rate = (Meeting Booked / Total Records) × 100

const assert = require('assert');

/**
 * Normalize call status for consistent matching
 */
function normalizeCallStatus(status) {
    if (!status || typeof status !== 'string') return '';
    
    const normalized = status.trim().toLowerCase();
    
    // Map variations to standard statuses
    const statusMap = {
        'meeting booked': 'Meeting Booked',
        'meetingbooked': 'Meeting Booked',
        'booked': 'Meeting Booked',
        'scheduled': 'Scheduled',
        'pending': 'Pending',
        'pending recall': 'Pending Recall',
        'pendingrecall': 'Pending Recall',
        'recall': 'Pending Recall'
    };
    
    return statusMap[normalized] || status.trim();
}

/**
 * Calculate KPIs with PROPER business logic
 * Success Rate = (Meeting Booked / Total Records) × 100
 */
function calculateKPIs(data) {
    const kpis = {
        meetings_booked: 0,
        pending: 0,
        scheduled: 0,
        pending_recall: 0,
        success_rate_pct: 0
    };
    
    // Process each record
    data.forEach((record) => {
        const rawStatus = record.callstatus || record.CallStatus || record.status || '';
        const normalizedStatus = normalizeCallStatus(rawStatus);
        
        // Map to KPI categories
        switch (normalizedStatus) {
            case 'Meeting Booked':
                kpis.meetings_booked++;
                break;
            case 'Pending':
                kpis.pending++;
                break;
            case 'Scheduled':
                kpis.scheduled++;
                break;
            case 'Pending Recall':
                kpis.pending_recall++;
                break;
        }
    });
    
    // Calculate Success Rate: (Meeting Booked / Total Records) × 100
    const totalRecords = data.length;
    if (totalRecords > 0) {
        kpis.success_rate_pct = parseFloat(((kpis.meetings_booked / totalRecords) * 100).toFixed(2));
    } else {
        kpis.success_rate_pct = 0;
    }
    
    return kpis;
}

function runTests() {
    console.log('🧪 Running KPI Unit Tests - PROPER Business Logic...');
    
    // Test 1: Basic calculation with mixed statuses
    console.log('\n📋 Test 1: Basic Mixed Dataset');
    const testData1 = [
        { callstatus: 'Meeting Booked' },
        { callstatus: 'Meeting Booked' },
        { callstatus: 'Pending' },
        { callstatus: 'Scheduled' },
        { callstatus: 'Pending Recall' },
        { callstatus: 'Meeting Booked' }
    ];
    
    const result1 = calculateKPIs(testData1);
    const expected1 = {
        meetings_booked: 3,
        pending: 1,
        scheduled: 1,
        pending_recall: 1,
        success_rate_pct: 50.00  // 3/6 * 100 = 50%
    };
    
    console.log('Expected:', expected1);
    console.log('Actual:  ', result1);
    assert.deepStrictEqual(result1, expected1, 'Test 1 failed: Basic mixed dataset');
    console.log('✅ Test 1 PASSED');
    
    // Test 2: All meetings booked (100% success)
    console.log('\n📋 Test 2: 100% Success Rate');
    const testData2 = [
        { callstatus: 'Meeting Booked' },
        { callstatus: 'Meeting Booked' },
        { callstatus: 'Meeting Booked' }
    ];
    
    const result2 = calculateKPIs(testData2);
    const expected2 = {
        meetings_booked: 3,
        pending: 0,
        scheduled: 0,
        pending_recall: 0,
        success_rate_pct: 100.00  // 3/3 * 100 = 100%
    };
    
    console.log('Expected:', expected2);
    console.log('Actual:  ', result2);
    assert.deepStrictEqual(result2, expected2, 'Test 2 failed: 100% success rate');
    console.log('✅ Test 2 PASSED');
    
    // Test 3: No meetings booked (0% success)
    console.log('\n📋 Test 3: 0% Success Rate');
    const testData3 = [
        { callstatus: 'Pending' },
        { callstatus: 'Scheduled' },
        { callstatus: 'Pending Recall' }
    ];
    
    const result3 = calculateKPIs(testData3);
    const expected3 = {
        meetings_booked: 0,
        pending: 1,
        scheduled: 1,
        pending_recall: 1,
        success_rate_pct: 0.00  // 0/3 * 100 = 0%
    };
    
    console.log('Expected:', expected3);
    console.log('Actual:  ', result3);
    assert.deepStrictEqual(result3, expected3, 'Test 3 failed: 0% success rate');
    console.log('✅ Test 3 PASSED');
    
    // Test 4: Empty dataset
    console.log('\n📋 Test 4: Empty Dataset');
    const result4 = calculateKPIs([]);
    const expected4 = {
        meetings_booked: 0,
        pending: 0,
        scheduled: 0,
        pending_recall: 0,
        success_rate_pct: 0
    };
    
    console.log('Expected:', expected4);
    console.log('Actual:  ', result4);
    assert.deepStrictEqual(result4, expected4, 'Test 4 failed: Empty dataset');
    console.log('✅ Test 4 PASSED');
    
    // Test 5: Case sensitivity and whitespace handling
    console.log('\n📋 Test 5: Case Sensitivity and Whitespace Handling');
    const testData5 = [
        { callstatus: 'meeting booked' },  // lowercase
        { callstatus: 'MEETING BOOKED' },  // uppercase
        { callstatus: ' Meeting Booked ' }, // whitespace
        { callstatus: 'pending' },          // lowercase
        { callstatus: ' SCHEDULED ' }       // uppercase with whitespace
    ];
    
    const result5 = calculateKPIs(testData5);
    const expected5 = {
        meetings_booked: 3,
        pending: 1,
        scheduled: 1,
        pending_recall: 0,
        success_rate_pct: 60.00  // 3/5 * 100 = 60%
    };
    
    console.log('Expected:', expected5);
    console.log('Actual:  ', result5);
    assert.deepStrictEqual(result5, expected5, 'Test 5 failed: Case sensitivity');
    console.log('✅ Test 5 PASSED');
    
    // Test 6: Real data scenario (matching current CSV)
    console.log('\n📋 Test 6: Real Data Scenario');
    const testData6 = [
        { name: 'surya', callstatus: 'Meeting Booked' },
        { name: 'Pranay', callstatus: 'Meeting Booked' },
        { name: 'Nanda', callstatus: 'Meeting Booked' },
        { name: 'varun', callstatus: 'Scheduled' },
        { name: 'naresh', callstatus: 'Meeting Booked' },
        { name: 'ganesh', callstatus: 'Pending' }
    ];
    
    const result6 = calculateKPIs(testData6);
    const expected6 = {
        meetings_booked: 4,
        pending: 1,
        scheduled: 1,
        pending_recall: 0,
        success_rate_pct: 66.67  // 4/6 * 100 = 66.67%
    };
    
    console.log('Expected:', expected6);
    console.log('Actual:  ', result6);
    assert.deepStrictEqual(result6, expected6, 'Test 6 failed: Real data scenario');
    console.log('✅ Test 6 PASSED');
    
    console.log('\n🎉 ALL KPI TESTS PASSED!');
    console.log('📊 KPI Logic Verification Complete');
    console.log('✅ Success Rate formula: (Meeting Booked / Total Records) × 100');
    console.log('✅ Case-insensitive matching working');
    console.log('✅ Whitespace trimming working');
    console.log('✅ Division by zero protection working');
    console.log('✅ Decimal precision (2 places) working');
    console.log('✅ Real data scenario working correctly');
}

// Run tests
try {
    runTests();
    process.exit(0);
} catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
}
