# Network Report Generation

The **Network Report** feature is a powerful enhancement for analyzing network requests in your Cypress tests. It generates detailed HTML reports with visualizations and statistics about all network requests captured by Cypress Interceptor.

## Features

- 📊 **Visual Charts**: Interactive charts showing request duration over time
- 📈 **Performance Metrics**: Min, max, and average request durations
- 🎯 **Performance Threshold**: Highlight requests exceeding configurable duration thresholds
- 📋 **Detailed Tables**: Complete request/response data including headers, bodies, and status codes
- 🎯 **Flexible Generation**: Create reports during test execution or from existing statistics files
- 📁 **Batch Processing**: Generate multiple reports from folders containing statistics files

## Table of Contents

- [Quick Start](#quick-start)
  - [Basic Usage in Cypress Tests](#basic-usage-in-cypress-tests)
  - [Generate Reports for All Tests](#generate-reports-for-all-tests)
  - [Generate Reports Only for Failed Tests](#generate-reports-only-for-failed-tests)
  - [Custom File Names](#custom-file-names)
  - [Performance Threshold Configuration](#performance-threshold-configuration)
- [API Reference](#api-reference)
  - [`createNetworkReport(options)`](#createnetworkreportoptions)
  - [`createNetworkReportFromFile(filePath, options)`](#createnetworkreportfromfilefilepath-options)
  - [`createNetworkReportFromFolder(folderPath, options)`](#createnetworkreportfromfolderfolderpath-options)
  - [ReportHtmlOptions Interface](#reporthtmloptions-interface)
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
        fileName: 'my-custom-report-name',
        outputDir: 'reports'
    });
});
```

### Performance Threshold Configuration

Set a custom threshold for highlighting slow requests (default is 3000ms):

```typescript
afterEach(() => {
    createNetworkReport({
        highDuration: 2000,  // Highlight requests taking longer than 2 seconds
        outputDir: 'reports'
    });
});
```

## API Reference

### `createNetworkReport(options)`

Creates an HTML report from the current Cypress test execution. This function must be called within a Cypress test context.

**Parameters:**
- `options` (ReportHtmlOptions, required): Configuration object for report generation

**Example:**
```typescript
createNetworkReport({
    fileName: 'api-performance-report',
    highDuration: 2500,
    outputDir: './test-reports'
});
```

### `createNetworkReportFromFile(filePath, options)`

Creates an HTML report from an existing `.stats.json` file. This function must be called from Node.js context (not within Cypress tests), typically in Cypress tasks or Node.js scripts.

**Parameters:**
- `filePath` (string, required): Path to the `.stats.json` file
- `options` (ReportHtmlOptions, required): Configuration object for report generation

**Example:**
```typescript
import { createNetworkReportFromFile } from "cypress-interceptor/report";

// In cypress.config.js/ts setupNodeEvents
on('task', {
    generateReportFromStats() {
        createNetworkReportFromFile(
            './cypress/fixtures/test-results.stats.json',
            {
                fileName: 'custom-report-name',
                highDuration: 5000,
                outputDir: './reports',
            }
        );
        return null;
    }
});
```

### `createNetworkReportFromFolder(folderPath, options)`

Creates HTML reports for all `.stats.json` files found in a folder. This function must be called from Node.js context.

**Parameters:**
- `folderPath` (string, required): Path to the folder containing `.stats.json` files
- `options` (Exclude<ReportHtmlOptions, "fileName">, required): Configuration object without fileName (auto-generated from file names)

**Example:**
```typescript
import { createNetworkReportFromFolder } from "cypress-interceptor/report";

// Generate reports for all stats files in a directory
createNetworkReportFromFolder(
    './cypress/stats-files',
    {
        highDuration: 2000,
        outputDir: './batch-reports'
    }
);
```

### ReportHtmlOptions Interface

The configuration object used by all report generation functions:

```typescript
interface ReportHtmlOptions {
    fileName?: string;        // Optional: Custom name for the report file (without extension)
    highDuration?: number;    // Optional: Threshold in milliseconds for highlighting slow requests (default: 3000)
    outputDir: string;        // Required: Directory where the HTML report will be saved
}
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
            fileName: `${testTitle.replace(/\s+/g, '-').toLowerCase()}`,
            highDuration: 1500,  // More strict threshold for API tests
            outputDir: 'conditional-reports'
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
                        {
                            highDuration: 5000,  // More lenient in CI environment
                            outputDir: './ci-reports'
                        }
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
        const { outputDir, statsFile, testName, threshold } = options;
        
        createNetworkReportFromFile(
            statsFile,
            {
                fileName: `report-${testName}-${Date.now()}`,
                highDuration: threshold || 3000,
                outputDir
            }
        );
        
        return `Report generated for ${testName}`;
    }
});

// In your test file
cy.task('generateCustomReport', {
    outputDir: './custom-reports',
    statsFile: './path/to/stats.json',
    testName: 'user-authentication',
    threshold: 2000
});
```

## Report Contents

Each generated HTML report includes:

### Performance Overview
- **Total Requests**: Number of network requests captured
- **Average Duration**: Mean response time across all requests
- **Min/Max Duration**: Fastest and slowest request times
- **Generation Date**: When the report was created
- **Performance Threshold**: Configured threshold for highlighting slow requests

### Interactive Chart
- Visual timeline of request durations
- Hover for detailed information
- Color-coded performance indicators (requests exceeding highDuration threshold are highlighted)

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
const getReportConfig = (testTitle: string) => {
    if (testTitle.includes('API')) {
        return {
            highDuration: 1000,  // Strict threshold for API tests
            outputDir: 'reports/api-tests'
        };
    }
    if (testTitle.includes('UI')) {
        return {
            highDuration: 5000,  // More lenient for UI tests
            outputDir: 'reports/ui-tests'
        };
    }
    return {
        highDuration: 3000,
        outputDir: 'reports/general'
    };
};

afterEach(function() {
    createNetworkReport(getReportConfig(this.currentTest?.title || ''));
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
                highDuration: Math.floor(duration * 0.1), // 10% of total test duration,
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

**Performance threshold not working:**
- Ensure `highDuration` is set as a number (in milliseconds)
- Check that the threshold value is reasonable for your application's performance characteristics

## Example Report

You can find a sample of a generated report [here](https://martintichovsky.github.io/cypress-interceptor/report-example/report.html).

The sample report demonstrates all the features including:
- Interactive performance charts with configurable thresholds
- Detailed request/response tables
- Performance statistics
- Professional styling and responsive design