import { XrayStepDef } from "./XrayStepDef"

/**
 * @XrayDOC https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 * @description It is possible to create new test issues when importing execution results using the Xray JSON format. For this, a testInfo element must be provided in order for Xray to create the issues.
 * If it is the first time you are importing an execution with a testInfo, Xray will create the tests automatically. Sub-sequent executions will reuse the same test issues.
 * 
 * Any changes to the testInfo element will update the test issue specification in Jira.
 */
export interface XrayTestInfo {

    /**
     * The project key where the test issue will be created
     */
    projectKey?: string

    /**
     * The summary for the test issue
     */
    summary?: string

    /**
     * The test type (e.g. Manual, Cucumber, Generic)
     */
    type?: string

    /**
     * An array of requirement issue keys to associate with the test
     */
    requirementKeys?: string

    /**
     * The test issue labels
     */
    labels?: string

    /**
     * An array of test steps (for Manual tests)
     */
    steps?: XrayStepDef[]

    /**
     * The BDD scenario
     */
    scenario?: string

    /**
     * The generic test definition
     */
    definition?: string
}