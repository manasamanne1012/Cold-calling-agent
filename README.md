# AI Cold Call Agent - Refactored Project

This project has been reorganized to follow industry best practices, with improved modular architecture, error handling, and logging.

## Project Structure

```
AI Cold Call Agent Website/
├── config.js                    # Centralized configuration
├── server-optimized.js          # Main application entry point
├── data/                        # CSV and test data
│   ├── contacts.csv
│   └── test-contacts.csv
├── logs/                        # Application logs (generated)
│   ├── combined.log
│   ├── errors/
│   ├── performance/
│   └── requests/
├── public/                      # Static assets
│   ├── dashboard.js
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── src/                         # Application source code
│   ├── middleware/              # Express middleware
│   │   └── errorHandler.js
│   ├── routes/                  # API and page routes
│   │   ├── api.js
│   │   ├── contacts.js
│   │   └── pages.js
│   ├── services/                # Business logic
│   │   ├── csvData.js
│   │   └── googleSheets.js
│   └── utils/                   # Utility functions
│       ├── logger.js
│       └── responseFormatter.js
└── tests/                       # Test files
    ├── kpi-tests-proper.js
    └── kpi-tests.js
```

## Key Improvements

1. **Modular Architecture**: Code is now organized into logical components:
   - `routes/` - API endpoints and route handlers
   - `services/` - Business logic and external service integration
   - `middleware/` - Request processing and error handling
   - `utils/` - Reusable utility functions

2. **Advanced Error Handling**: Centralized error processing with:
   - Consistent error response format
   - Detailed error logging
   - Production vs development error information

3. **Improved Logging**: Structured logging system:
   - Different log levels (error, warn, info, debug)
   - Separate log files for different types of data
   - Performance tracking

4. **Standardized API Responses**: Consistent response format:
   - Success/error status
   - Standard data structure
   - Timing information

5. **Centralized Configuration**: All settings in one place:
   - Environment-based configuration
   - Default values
   - Feature flags

## Running the Application

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```
   
   or
   
   ```
   npm start
   ```

3. Access the dashboard at:
   ```
   http://localhost:3000
   ```

## Available Tasks

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Check code for style issues
- `npm run lint:fix` - Auto-fix linting issues

## Configuration

Edit the `.env` file or environment variables to configure the application:

```
PORT=3000
NODE_ENV=development
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
```

For more detailed information, refer to the original README.md file.
