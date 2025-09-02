/**
 * Unit tests for Analytics Utility
 */
const chai = require('chai');
const { expect } = chai;
const analytics = require('../src/utils/analytics');

describe('Analytics Utility', () => {
  describe('analyzeSheetData()', () => {
    it('should return fallback data when input is null', () => {
      // Act
      const result = analytics.analyzeSheetData(null);
      
      // Assert
      expect(result).to.have.property('meetingsBooked');
      expect(result).to.have.property('pending');
      expect(result).to.have.property('scheduled');
      expect(result).to.have.property('successRate');
    });
    
    it('should correctly analyze array of arrays (sheets format)', () => {
      // Arrange
      const mockData = [
        ['Name', 'Industry', 'Status'],
        ['User 1', 'Tech', 'Meeting Booked'],
        ['User 2', 'Finance', 'Pending'],
        ['User 3', 'Healthcare', 'Meeting Booked'],
        ['User 4', 'Tech', 'Scheduled']
      ];
      
      // Act
      const result = analytics.analyzeSheetData(mockData);
      
      // Assert
      expect(result.meetingsBooked).to.equal(2);
      expect(result.pending).to.equal(1);
      expect(result.scheduled).to.equal(1);
      expect(result.totalLeads).to.equal(5);
      // 2 meetings out of 4 status records = 50%
      expect(result.successRate).to.equal(50);
    });
    
    it('should correctly analyze array of objects (CSV format)', () => {
      // Arrange
      const mockData = [
        { name: 'User 1', industry: 'Tech', status: 'Meeting Booked' },
        { name: 'User 2', industry: 'Finance', status: 'Pending' },
        { name: 'User 3', industry: 'Healthcare', callstatus: 'Meeting Booked' },
        { name: 'User 4', industry: 'Tech', CallStatus: 'Pending Recall' }
      ];
      
      // Act
      const result = analytics.analyzeSheetData(mockData);
      
      // Assert
      expect(result.meetingsBooked).to.equal(2);
      expect(result.pending).to.equal(1);
      expect(result.pendingRecall).to.equal(1);
      expect(result.totalLeads).to.equal(4);
      // 2 meetings out of 4 status records = 50%
      expect(result.successRate).to.equal(50);
    });
  });
  
  describe('calculateTrend()', () => {
    it('should return "stable" for insufficient data', () => {
      // Act
      const result = analytics.calculateTrend([]);
      
      // Assert
      expect(result).to.equal('stable');
    });
    
    it('should return "up" when trend is positive', () => {
      // Arrange
      const mockStats = [];
      // Create 14 days of data with an upward trend
      for (let i = 13; i >= 0; i--) {
        mockStats.push({
          date: `2025-08-${20 + (13-i)}`,
          // Earlier data has lower success rate (around 20%)
          // Later data has higher success rate (around 30%)
          successRate: i < 7 ? 20 + Math.random() * 5 : 30 + Math.random() * 5
        });
      }
      
      // Act
      const result = analytics.calculateTrend(mockStats);
      
      // Assert
      expect(result).to.equal('up');
    });
    
    it('should return "down" when trend is negative', () => {
      // Arrange
      const mockStats = [];
      // Create 14 days of data with a downward trend
      for (let i = 13; i >= 0; i--) {
        mockStats.push({
          date: `2025-08-${20 + (13-i)}`,
          // Earlier data has higher success rate (around 30%)
          // Later data has lower success rate (around 20%)
          successRate: i < 7 ? 30 + Math.random() * 5 : 20 + Math.random() * 5
        });
      }
      
      // Act
      const result = analytics.calculateTrend(mockStats);
      
      // Assert
      expect(result).to.equal('down');
    });
  });
  
  describe('generateDailyStats()', () => {
    it('should generate 31 days of statistics', () => {
      // Act
      const result = analytics.generateDailyStats();
      
      // Assert
      expect(result).to.be.an('array');
      expect(result.length).to.equal(31);
      expect(result[0]).to.have.property('date');
      expect(result[0]).to.have.property('calls');
      expect(result[0]).to.have.property('meetings');
      expect(result[0]).to.have.property('successRate');
    });
  });
});
