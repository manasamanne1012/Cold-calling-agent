/**
 * End-to-end test for the AI Cold Call Agent Website
 */
const puppeteer = require('puppeteer');
const { expect } = require('chai');
const sinon = require('sinon');

describe('E2E Tests', function() {
  // Increase timeout for E2E tests
  this.timeout(10000);
  
  let browser;
  let page;
  
  before(async () => {
    browser = await puppeteer.launch({
      headless: "new", // Use "new" for latest headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });
  
  after(async () => {
    await browser.close();
  });
  
  it('should load the dashboard page', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Check page title
    const title = await page.title();
    expect(title).to.equal('AI Cold Call Agent Dashboard');
    
    // Check for main elements
    const headerText = await page.$eval('header h1', el => el.textContent);
    expect(headerText).to.equal('AI Cold Call Agent Dashboard');
    
    // Check if contacts table exists
    const contactsTable = await page.$('#contactsTable');
    expect(contactsTable).to.not.be.null;
    
    // Check if the trigger button exists
    const triggerButton = await page.$('.trigger-button');
    expect(triggerButton).to.not.be.null;
  });
  
  it('should display stats section properly', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Check if stats section exists
    const statsSection = await page.$('.stats-container');
    expect(statsSection).to.not.be.null;
    
    // Check for stats metrics
    const statBoxes = await page.$$('.stat-box');
    expect(statBoxes.length).to.be.at.least(3); // At least 3 stat boxes
  });
  
  it('should open contact form when add contact button is clicked', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Check if form is initially hidden
    const formVisible = await page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('#contactForm')).display !== 'none';
    });
    expect(formVisible).to.be.false;
    
    // Click the add contact button
    await page.click('#addContactBtn');
    
    // Check if form is now visible
    const formVisibleAfterClick = await page.evaluate(() => {
      return window.getComputedStyle(document.querySelector('#contactForm')).display !== 'none';
    });
    expect(formVisibleAfterClick).to.be.true;
  });
  
  it('should validate form fields', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Open the form
    await page.click('#addContactBtn');
    
    // Submit empty form
    await page.click('#submitContactBtn');
    
    // Check for validation message
    const validationMessage = await page.evaluate(() => {
      return document.querySelector('#nameInput').validationMessage;
    });
    expect(validationMessage).to.not.be.empty;
  });
  
  it('should submit new contact data', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Intercept fetch requests
    await page.setRequestInterception(true);
    
    const requestPromise = new Promise(resolve => {
      page.on('request', request => {
        if (request.url().includes('/api/contacts') && request.method() === 'POST') {
          request.respond({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              data: {
                name: 'Test User',
                industry: 'Technology',
                email: 'test@example.com',
                status: 'Pending'
              }
            })
          });
          resolve(request.postData());
        } else {
          request.continue();
        }
      });
    });
    
    // Open form
    await page.click('#addContactBtn');
    
    // Fill out form
    await page.type('#nameInput', 'Test User');
    await page.type('#industryInput', 'Technology');
    await page.type('#emailInput', 'test@example.com');
    
    // Submit form
    await page.click('#submitContactBtn');
    
    // Get the request data
    const requestData = await requestPromise;
    const parsedData = JSON.parse(requestData);
    
    // Verify data
    expect(parsedData.name).to.equal('Test User');
    expect(parsedData.industry).to.equal('Technology');
    expect(parsedData.email).to.equal('test@example.com');
  });
  
  it('should trigger workflow for a contact', async () => {
    await page.goto('http://localhost:3000', {
      waitUntil: 'networkidle2'
    });
    
    // Intercept fetch requests
    await page.setRequestInterception(true);
    
    const triggerPromise = new Promise(resolve => {
      page.on('request', request => {
        if (request.url().includes('/api/trigger-workflow') && request.method() === 'POST') {
          request.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              message: 'Workflow triggered successfully',
              data: { executionId: '1234' }
            })
          });
          resolve(request.postData());
        } else {
          request.continue();
        }
      });
    });
    
    // Mock the contacts data
    await page.evaluate(() => {
      const mockRow = document.createElement('tr');
      mockRow.innerHTML = `
        <td>Test Contact</td>
        <td>Tech</td>
        <td>Pending</td>
        <td><button class="trigger-button" data-row="0">Trigger Call</button></td>
      `;
      document.querySelector('#contactsTable tbody').appendChild(mockRow);
    });
    
    // Click the trigger button for the first contact
    await page.click('.trigger-button');
    
    // Verify the trigger request
    const triggerData = await triggerPromise;
    expect(triggerData).to.not.be.null;
  });
});
