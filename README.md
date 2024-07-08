
## Usage/Examples

```typescript
reporter: [
    ["xray-pw-reporter", {

      // Setting output dir for json file. Default: "/xray-pw-reporter"
      // reportOutDir: "<path here>",

      // Importing type (Mandatory)
      importType: "REST" | "MANUAL",

      // Jira Project ID (Mandatory)
      project: "<PROJECT ID>",

      // Override test details on Jira
      overrideTestDetail: false,

      // Saving video evidence on jira
      saveVideoEvidence: false,

      // Saving trace evidence on jira
      saveTraceEvidence: false,

      // The jira issue execution where to import the results (if jira issue does not exist, a new execution will be created)
      // (used only for "REST" Import)
      // this field takes precedence over testPlanKey. This means that even if the testPlanKey field is defined,
      // the reporter will try to import the execution under the key defined here
      testExecutionKey: "JKEY-100",

      // The test plan where the new jira issue execution will be created 
      // (used only for "REST" Import)
      // The testExecutionKey has pirority over this field. This means that even if this field is defined, 
      // the reporter will try to import the execution into the key defined on testExecutionKey
      testPlanKey: "JKEY-100",

      // This object describes how the new Execution Issue will be created (unlike testExecutionKey, this field allows you to describe all the fields of the new execution)
      // The new execution will be imported and linked to the plan defined in testPlanKey, 
      // if testPlanKey is not defined, it will only be imported as a new execution and will not be linked
      newExecution: {
        "assignee": {
          "id": "712040:aa4a7b1c-ce1b-4114-a079-e7e2bf90afec"
        },
        "issuetype": {
          "name": "Test Execution"
        },
        "summary": `Brand new Execution`,
        "requiredFields": [
          {
            "components": [
              {
                "name": "COMPONENT1"
              }
            ],
            "description": "this is the execution description"
          }
        ]
      },

      // Xray client_id
      // (Mandatory only for "REST" Import)
      xrayClientID: "<CLIENT_ID HERE>",

      // Xray secret
      // (Mandatory only for "REST" Import)
      xraySecret: "<SECRET HERE>"
    }]
]
```

If some fields are required, you can add them like:

```typescript
reporter: [
    ["xray-pw-reporter", {
    
    // ...
    newExecution: {
        "assignee": {
          "id": "712040:aa4a7b1c-ce1b-4114-a079-e7e2bf90afec"
        },
        "issuetype": {
          "name": "Test Execution"
        },
        "summary": `Brand new Execution`,
        // Required Fields
        "requiredFields": [
          {
            "components": [
              {
                "name": "COMPONENT1"
              }
            ],
            "description": "this is the execution description"
          }
        ]
      },
    // ...

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

**If JiraIssue is not defined, test will be marked as ⚡ Excluded.⚡**

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

- A file name: "<jirakey>.dataset.json" have to be created under /data/datasets/ 
- Dataset must follow the syntax below:

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
- ⚠️**Test title must follow the syntax: TEST_NAME -> Iteration X**⚠️
- ⚠️**the dataset file name must be the same as the @DDT tag**⚠️

```typescript
import { test, expect } from '@playwright/test';
import { dataset as ds110 } from "../data/datasets/jkey-110.dataset.json"

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