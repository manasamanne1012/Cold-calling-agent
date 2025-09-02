/**
 * Unit tests for Google Sheets Service
 */
const chai = require('chai');
const sinon = require('sinon');
const { expect } = chai;
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

describe('Google Sheets Service', () => {
  let sheetsService;
  let googleStub;
  let fsStub;
  let axiosStub;
  
  // Setup before each test
  beforeEach(() => {
    // Create stubs
    googleStub = {
      sheets: sinon.stub().returns({
        spreadsheets: {
          values: {
            get: sinon.stub(),
            append: sinon.stub(),
            update: sinon.stub()
          }
        }
      }),
      auth: {
        GoogleAuth: sinon.stub().returns({})
      }
    };
    
    fsStub = {
      existsSync: sinon.stub(),
      readFileSync: sinon.stub().returns('{"client_email": "test@example.com"}')
    };
    
    axiosStub = {
      get: sinon.stub()
    };
    
    // Load service with stubbed dependencies
    sheetsService = proxyquire('../src/services/googleSheets', {
      'googleapis': { google: googleStub },
      'fs': fsStub,
      'axios': axiosStub,
      'path': path
    });
  });
  
  // Cleanup after each test
  afterEach(() => {
    sinon.restore();
  });
  
  describe('initGoogleSheets()', () => {
    it('should initialize with service account if file exists', () => {
      // Arrange
      fsStub.existsSync.returns(true);
      
      // Act
      sheetsService.initGoogleSheets();
      
      // Assert
      expect(fsStub.existsSync.called).to.be.true;
      expect(googleStub.auth.GoogleAuth.called).to.be.true;
      expect(googleStub.sheets.called).to.be.true;
    });
    
    it('should initialize with API key if no service account', () => {
      // Arrange
      fsStub.existsSync.returns(false);
      process.env.GOOGLE_API_KEY = 'test-api-key';
      
      // Act
      sheetsService.initGoogleSheets();
      
      // Assert
      expect(fsStub.existsSync.called).to.be.true;
      expect(googleStub.sheets.called).to.be.true;
    });
  });
  
  describe('fetchSheetData()', () => {
    it('should return data when Google Sheets API succeeds', async () => {
      // Arrange
      const mockResponse = {
        data: {
          values: [
            ['Name', 'Industry', 'Status'],
            ['Test User', 'Tech', 'Meeting Booked']
          ]
        }
      };
      
      googleStub.sheets().spreadsheets.values.get.resolves(mockResponse);
      
      // Act
      const result = await sheetsService.fetchSheetData();
      
      // Assert
      expect(result).to.deep.equal(mockResponse.data.values);
      expect(googleStub.sheets().spreadsheets.values.get.called).to.be.true;
    });
    
    it('should fallback to CSV export if API fails', async () => {
      // Arrange
      googleStub.sheets().spreadsheets.values.get.rejects(new Error('API Error'));
      
      const csvResponse = {
        data: 'Name,Industry,Status\nTest User,Tech,Meeting Booked'
      };
      
      axiosStub.get.resolves(csvResponse);
      
      // Act
      const result = await sheetsService.fetchSheetData();
      
      // Assert
      expect(result).to.be.an('array');
      expect(result[0][0]).to.equal('Name');
      expect(axiosStub.get.called).to.be.true;
    });
  });
  
  describe('appendToSheet()', () => {
    it('should append data successfully', async () => {
      // Arrange
      const mockResponse = {
        data: { updates: { updatedRows: 1 } }
      };
      
      googleStub.sheets().spreadsheets.values.append.resolves(mockResponse);
      
      // Override the private variable for testing
      sheetsService.canWrite = true;
      
      // Act
      const result = await sheetsService.appendToSheet(['Test', 'Tech', 'Pending']);
      
      // Assert
      expect(result).to.be.true;
      expect(googleStub.sheets().spreadsheets.values.append.called).to.be.true;
    });
  });
  
  describe('getAuthInfo()', () => {
    it('should return correct auth info', () => {
      // Arrange
      fsStub.existsSync.returns(true);
      
      // Act
      const result = sheetsService.getAuthInfo();
      
      // Assert
      expect(result).to.have.property('authType');
      expect(result).to.have.property('canWrite');
      expect(result).to.have.property('serviceAccountEmail');
    });
  });
});
