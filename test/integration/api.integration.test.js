/**
 * Integration tests for API endpoints
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const { expect } = chai;
const proxyquire = require('proxyquire').noCallThru();

chai.use(chaiHttp);

describe('API Integration Tests', () => {
  let app;
  let server;
  let sheetsServiceStub;
  let csvServiceStub;
  let workflowTriggerStub;
  
  // Setup before all tests
  before(() => {
    // Stub services
    sheetsServiceStub = {
      initGoogleSheets: sinon.stub(),
      fetchSheetData: sinon.stub(),
      appendToSheet: sinon.stub(),
      updateSheetRow: sinon.stub(),
      getAuthInfo: sinon.stub().returns({
        authType: 'api_key',
        canWrite: false,
        serviceAccountEmail: null
      }),
      sheetsConfigured: true,
      canWrite: false
    };
    
    csvServiceStub = {
      fetchCSVData: sinon.stub(),
      saveContactLocally: sinon.stub().returns(true),
      getLocalContacts: sinon.stub().returns([])
    };
    
    workflowTriggerStub = {
      triggerWorkflow: sinon.stub().resolves({
        success: true,
        message: 'Workflow triggered successfully',
        data: { executionId: '1234' }
      }),
      getWorkflowHistory: sinon.stub().returns([])
    };
    
    // Load app with stubbed dependencies
    app = proxyquire('../server-optimized', {
      './src/services/googleSheets': sheetsServiceStub,
      './src/services/csvData': csvServiceStub,
      './workflow-trigger': workflowTriggerStub
    });
    
    // Start server for testing
    server = app.listen(3001);
  });
  
  // Cleanup after all tests
  after(() => {
    server.close();
    sinon.restore();
  });
  
  describe('Health Check API', () => {
    it('should return healthy status', (done) => {
      chai.request(app)
        .get('/api/health')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data.status).to.equal('healthy');
          done();
        });
    });
  });
  
  describe('Stats API', () => {
    it('should return statistics from sheets when available', (done) => {
      // Arrange
      const mockSheetData = [
        ['Name', 'Industry', 'Status'],
        ['User 1', 'Tech', 'Meeting Booked'],
        ['User 2', 'Finance', 'Pending'],
        ['User 3', 'Healthcare', 'Meeting Booked']
      ];
      
      sheetsServiceStub.fetchSheetData.resolves(mockSheetData);
      
      // Act & Assert
      chai.request(app)
        .get('/api/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('meetingsBooked').equal(2);
          expect(res.body.data).to.have.property('pending').equal(1);
          expect(res.body.source).to.equal('google_sheets');
          done();
        });
    });
    
    it('should fallback to CSV data when sheets data is not available', (done) => {
      // Arrange
      sheetsServiceStub.fetchSheetData.resolves(null);
      
      const mockCsvData = [
        { name: 'User 1', industry: 'Tech', status: 'Meeting Booked' },
        { name: 'User 2', industry: 'Finance', status: 'Pending' }
      ];
      
      csvServiceStub.fetchCSVData.returns(mockCsvData);
      
      // Act & Assert
      chai.request(app)
        .get('/api/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('meetingsBooked').equal(1);
          expect(res.body.data).to.have.property('pending').equal(1);
          expect(res.body.source).to.equal('csv_file');
          done();
        });
    });
  });
  
  describe('Workflow Trigger API', () => {
    it('should trigger workflow successfully', (done) => {
      // Arrange
      const contact = {
        name: 'Test User',
        industry: 'Technology',
        location: 'New York',
        status: 'Pending'
      };
      
      // Act & Assert
      chai.request(app)
        .post('/api/trigger-workflow')
        .send(contact)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(workflowTriggerStub.triggerWorkflow.calledWith(contact)).to.be.true;
          done();
        });
    });
    
    it('should return error for invalid contact data', (done) => {
      // Arrange
      const invalidContact = {
        // Missing required fields
        industry: 'Technology'
      };
      
      // Act & Assert
      chai.request(app)
        .post('/api/trigger-workflow')
        .send(invalidContact)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.success).to.be.false;
          done();
        });
    });
  });
  
  describe('Contacts API', () => {
    it('should fetch contacts from Google Sheets', (done) => {
      // Arrange
      const mockSheetData = [
        ['Name', 'Industry', 'Status'],
        ['User 1', 'Tech', 'Meeting Booked'],
        ['User 2', 'Finance', 'Pending']
      ];
      
      sheetsServiceStub.fetchSheetData.resolves(mockSheetData);
      
      // Act & Assert
      chai.request(app)
        .get('/api/contacts')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.lengthOf(2);
          expect(res.body.source).to.equal('google_sheets');
          done();
        });
    });
    
    it('should add new contact successfully', (done) => {
      // Arrange
      const newContact = {
        name: 'Test User',
        industry: 'Technology',
        location: 'New York',
        status: 'Pending',
        email: 'test@example.com'
      };
      
      sheetsServiceStub.appendToSheet.resolves(true);
      
      // Act & Assert
      chai.request(app)
        .post('/api/contacts')
        .send(newContact)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body.success).to.be.true;
          expect(res.body.data).to.have.property('name').equal('Test User');
          done();
        });
    });
  });
});
