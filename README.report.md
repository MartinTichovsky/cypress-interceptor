# Network Report Generation

The **Network Report** feature is a powerful enhancement for analyzing network requests in your Cypress tests. It generates detailed HTML reports with visualizations and statistics about all network requests captured by Cypress Interceptor.

## Features

- 📊 **Visual Charts**: Interactive charts showing request duration over time
- 📈 **Performance Metrics**: Min, max, and average request durations
- 📋 **Detailed Tables**: Complete request/response data including headers, bodies, and status codes
- 🎯 **Flexible Generation**: Create reports during test execution or from existing statistics files
- 📁 **Batch Processing**: Generate multiple reports from folders containing statistics files

## Table of Contents

- [Quick Start](#quick-start)
  - [Basic Usage in Cypress Tests](#basic-usage-in-cypress-tests)
  - [Generate Reports for All Tests](#generate-reports-for-all-tests)
  - [Generate Reports Only for Failed Tests](#generate-reports-only-for-failed-tests)
  - [Custom File Names](#custom-file-names)
- [API Reference](#api-reference)
  - [`createNetworkReport(options)`](#createnetworkreportoptions)
  - [`createNetworkReportFromFile(filePath, outputDir, fileName?)`](#createnetworkreportfromfilefilepath-outputdir-filename)
  - [`createNetworkReportFromFolder(folderPath, outputDir)`](#createnetworkreportfromfolderfolderpath-outputdir)
- [Advanced Usage Examples](#advanced-usage-examples)
  - [Conditional Report Generation](#conditional-report-generation)
  - [Integration with CI/CD](#integration-with-cicd)
  - [Custom Report Processing](#custom-report-processing)
- [Report Contents](#report-contents)
  - [Performance Overview](#performance-overview)
  - [Interactive Chart](#interactive-chart)
  - [Detailed Data Table](#detailed-data-table)
- [Best Practices](#best-practices)
  - [1. Organize Reports by Test Type](#1-organize-reports-by-test-type)
  - [2. Clean Up Old Reports](#2-clean-up-old-reports)
  - [3. Generate Reports Only for Long-Running Tests](#3-generate-reports-only-for-long-running-tests)
- [Troubleshooting](#troubleshooting)
  - [Common Issues](#common-issues)
- [Example Report](#example-report)

## Quick Start

### Basic Usage in Cypress Tests

Import the report function in your test file:

```typescript
import { createNetworkReport } from "cypress-interceptor/report";
```

### Generate Reports for All Tests

Add this to your `e2e.ts` or `e2e.js` file to create reports after every test:

```typescript
afterEach(() => {
    createNetworkReport({
        outputDir: 'network-reports'
    });
});
```

### Generate Reports Only for Failed Tests

If you want to generate reports only when tests fail (recommended for CI/CD):

```typescript
afterEach(function() {
    if (this.currentTest?.state === "failed") {
        createNetworkReport({
            outputDir: 'failed-test-reports'
        });
    }
});
```

### Custom File Names

You can specify custom file names for your reports:

```typescript
afterEach(() => {
    createNetworkReport({
        outputDir: 'reports',
        fileName: 'my-custom-report-name'
    });
});
```

## API Reference

### `createNetworkReport(options)`

Creates an HTML report from the current Cypress test execution. This function must be called within a Cypress test context.

**Parameters:**
- `options.outputDir` (string, required): Directory where the HTML report will be saved
- `options.fileName` (string, optional): Custom name for the report file (without extension)

**Example:**
```typescript
createNetworkReport({
    outputDir: './test-reports',
    fileName: 'api-performance-report'
});
```

### `createNetworkReportFromFile(filePath, outputDir, fileName?)`

Creates an HTML report from an existing `.stats.json` file. This function must be called from Node.js context (not within Cypress tests), typically in Cypress tasks or Node.js scripts.

**Parameters:**
- `filePath` (string, required): Path to the `.stats.json` file
- `outputDir` (string, required): Directory where the HTML report will be saved
- `fileName` (string, optional): Custom name for the report file (without extension)

**Example:**
```typescript
import { createNetworkReportFromFile } from "cypress-interceptor/report";

// In cypress.config.js/ts setupNodeEvents
on('task', {
    generateReportFromStats() {
        createNetworkReportFromFile(
            './cypress/fixtures/test-results.stats.json',
            './reports',
            'custom-report-name'
        );
        return null;
    }
});
```

### `createNetworkReportFromFolder(folderPath, outputDir)`

Creates HTML reports for all `.stats.json` files found in a folder. This function must be called from Node.js context.

**Parameters:**
- `folderPath` (string, required): Path to the folder containing `.stats.json` files
- `outputDir` (string, required): Directory where the HTML reports will be saved

**Example:**
```typescript
import { createNetworkReportFromFolder } from "cypress-interceptor/report";

// Generate reports for all stats files in a directory
createNetworkReportFromFolder(
    './cypress/stats-files',
    './batch-reports'
);
```

## Advanced Usage Examples

### Conditional Report Generation

Generate reports based on specific conditions:

```typescript
afterEach(function() {
    const testTitle = this.currentTest?.title || '';
    const isApiTest = testTitle.includes('API');
    
    if (isApiTest || this.currentTest?.state === "failed") {
        createNetworkReport({
            outputDir: 'conditional-reports',
            fileName: `${testTitle.replace(/\s+/g, '-').toLowerCase()}`
        });
    }
});
```

### Integration with CI/CD

For continuous integration environments:

```typescript
// In cypress.config.js
export default defineConfig({
    e2e: {
        setupNodeEvents(on, config) {
            // Generate reports after test suite completion
            on('after:run', () => {
                if (process.env.CI) {
                    createNetworkReportFromFolder(
                        './cypress/logs',
                        './ci-reports'
                    );
                }
            });
        }
    }
});
```

### Custom Report Processing

Using Cypress tasks for more control:

```typescript
// In cypress.config.js
on('task', {
    generateCustomReport(options) {
        const { statsFile, outputDir, testName } = options;
        
        createNetworkReportFromFile(
            statsFile,
            outputDir,
            `report-${testName}-${Date.now()}`
        );
        
        return `Report generated for ${testName}`;
    }
});

// In your test file
cy.task('generateCustomReport', {
    statsFile: './path/to/stats.json',
    outputDir: './custom-reports',
    testName: 'user-authentication'
});
```

## Report Contents

Each generated HTML report includes:

### Performance Overview
- **Total Requests**: Number of network requests captured
- **Average Duration**: Mean response time across all requests
- **Min/Max Duration**: Fastest and slowest request times
- **Generation Date**: When the report was created

### Interactive Chart
- Visual timeline of request durations
- Hover for detailed information
- Color-coded performance indicators

### Detailed Data Table
For each request:
- **Timestamp**: When the request was made
- **URL**: Request endpoint
- **Method**: HTTP method (GET, POST, etc.)
- **Duration**: Response time in milliseconds
- **Status Code**: HTTP response status
- **Headers**: Request and response headers
- **Body**: Request and response bodies
- **Query Parameters**: URL query parameters

## Best Practices

### 1. Organize Reports by Test Type
```typescript
const getOutputDir = (testTitle: string) => {
    if (testTitle.includes('API')) return 'reports/api-tests';
    if (testTitle.includes('UI')) return 'reports/ui-tests';
    return 'reports/general';
};

afterEach(function() {
    createNetworkReport({
        outputDir: getOutputDir(this.currentTest?.title || '')
    });
});
```

### 2. Clean Up Old Reports
```typescript
// In cypress.config.js
before(() => {
    cy.task('cleanReports');
});

on('task', {
    cleanReports() {
        const fs = require('fs');
        const path = require('path');
        const reportsDir = './reports';
        
        if (fs.existsSync(reportsDir)) {
            fs.rmSync(reportsDir, { recursive: true });
        }
        fs.mkdirSync(reportsDir, { recursive: true });
        
        return null;
    }
});
```

### 3. Generate Reports Only for Long-Running Tests
```typescript
beforeEach(() => {
    cy.startTiming(); // Cypress Interceptor timing helper
});

afterEach(function() {
    cy.stopTiming().then((duration) => {
        // Generate report only for tests that took longer than 5 seconds
        if (duration && duration > 5000) {
            createNetworkReport({
                outputDir: 'slow-test-reports'
            });
        }
    });
});
```

## Troubleshooting

### Common Issues

**Report not generated:**
- Ensure `outputDir` exists or can be created
- Verify you have write permissions to the output directory
- Check that Cypress Interceptor is properly imported

**Empty reports:**
- Make sure Cypress Interceptor is capturing requests
- Verify that network requests occur during your test execution

**Node.js context errors:**
- `createNetworkReportFromFile` and `createNetworkReportFromFolder` must be called from Node.js context (Cypress tasks, not test code)

## Example Report

You can find a sample of a generated report [here](./report-sample/report.html).

The sample report demonstrates all the features including:
- Interactive performance charts
- Detailed request/response tables
- Performance statistics
- Professional styling and responsive design