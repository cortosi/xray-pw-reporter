
# xray-pw-reporter

## Overview

xray-pw-reporter is a node module designed to import test execution results into Xray, a popular test management tool for Jira. This project facilitates seamless integration and automated reporting of test outcomes, enhancing your test management workflow.
**⚠️ Only works for Cloud versions ⚠️**




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

### Normal Tests

For a normal test, you just have to indicate the JiraIssue as a comment above the test:

```typescript
/**
 * @JiraIssue JKEY-10
 */
test('Test that passes', async ({ page }) => {
    // Steps here
})
```

if `test.step` have also been defined, the results of the latter will also be included:

```typescript
/**
 * @JiraIssue JKEY-10
 */
test('Test that passes', async ({ page }) => {
    await test.step('Step 1', async () => {
        // Implementation of step 1
    })
})
```
**⚠️Only steps wrapped into `test.step` will be included⚠️**

### Data driven Tests

For data driven tests (which correspond to tests with xray datasets), the matter is a little more complex:

- Dataset mush follow the syntax below:

```json
{
    "dataset": [
        {
            "parameters": [
                {
                    "name": "username",
                    "value": ""
                },
                {
                    "name": "password",
                    "value": "hello"
                },
                {
                    "name": "error",
                    "value": "enter username"
                }
            ]
        },
        {
            "parameters": [
                {
                    "name": "username",
                    "value": "hello@hello.com"
                },
                {
                    "name": "password",
                    "value": ""
                },
                {
                    "name": "error",
                    "value": "enter password"
                }
            ]
        }
    ]
}
```

- `@DDT`annotation must be specified above the test:
- ⚠️**Test title must follow the syntax: "TEST_NAME -> Iteration X"**⚠️

```typescript
import { test, expect } from '@playwright/test';
import { dataset as ds110 } from "../data/datasets/prov-110.dataset.json"

ds110.forEach((item, index) => {
    /**
     * @DDT JKEY-110
     */
    test(`Data-driven test with one step -> Iteration ${index + 1}`, async ({ page }) => {
        await test.step('Step1', async () => {
        })
    })
})
```
## Override Test Details

With option `overrideTestDetail` set to true, title and steps defined on PW test, will replace title and steps on Xray Issue. So, be carefull on using it :)
## DDT Demo

https://github.com/cortosi/xray-pw-reporter/assets/73166428/fc8f49c4-dc73-47a6-8f0b-9469ac32eceb

