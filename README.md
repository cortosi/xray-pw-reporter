# xray-pw-reporter

## Overview

xray-pw-reporter is a node module designed to import test execution results into Xray, a popular test management tool for Jira. This project facilitates seamless integration and automated reporting of test outcomes, enhancing your test management workflow.




## Features

- Automated Import: Automatically import test execution results into Xray.
- Customization: Supports customizable configurations to fit your specific needs.

## Installation

Install my-project with npm

```bash
  npm install xray-pw-reporter
```
    
## Usage/Examples

```typescript
reporter: [
    ["xray-pw-reporter", {

      // Setting output dir for json file. Default: "/xray-pw-reporter"
      // reportOutDir: "<path here>",

      // Importing type
      importType: "REST" | "MANUAL",

      // Jira Project ID
      project: "<PROJECT ID>,

      // The summary for the test execution issue
      // summary: "Execution Summary",

      // Override test details on Jira
      overrideTestDetail: false,

      // Saving video evidence on jira
      saveVideoEvidence: false,

      // Saving trace evidence on jira
      saveTraceEvidence: false,

      // The jira issue execution where to import the results (if jira issue does not exist, a new execution will be created)
      // (used only for "REST" Import)
      testExecutionKey: "JKEY-100",

      // The test plan where the new jira issue execution will be created 
      // (used only for "REST" Import)
      testPlanKey: "JKEY-100",

      // client_id
      // (used only for "REST" Import)
      xrayClientID: "<CLIENT_ID HERE>",

      // secret
      // (used only for "REST" Import)
      xraySecret: "<SECRET HERE>"
    }]
]
```

For a normal test, you just have to indicate the JiraIssue as a comment above the test:

```typescript
/**
 * @JiraIssue JKEY-10
 */
test('Test that passes', async ({ page }) => {
    // Steps here
})
```
## Demo
