import { XrayIteration } from "./XrayIteration"
import { XrayTestInfo } from "./XrayTestInfo"
import XrayEvidence from "./XrayEvidence"
import XrayStepResult from "./XrayStepResult"

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayTest {

    /**
     * The test issue key
     */
    testKey?: string

    /**
     * The testInfo element
     */
    testInfo?: XrayTestInfo

    /**
     * The start date for the test run
     */
    start?: Date

    /**
     * The finish date for the test run
     */
    finish?: Date

    /**
     * The comment for the test run
     */
    comment?: string

    /**
     * The user id who executed the test run
     */
    executedBy?: string

    /**
     * The user id for the assignee of the test run
     */
    assignee?: string

    /**
     * The test run status (PASSED, FAILED, EXECUTING, TODO, custom statuses ...)
     */
    status?: string

    /**
     * The step results
     */
    steps?: XrayStepResult[],

    /**
     * The example results for BDD tests
     */
    examples?: string

    /**
     * The iteration containing data-driven test results
     */
    iterations?: XrayIteration[]

    /**
     * An array of defect issue keys to associate with the test run
     */
    defects?: string

    /**
     * An array of evidence items of the test run
     */
    evidence?: XrayEvidence[] | undefined

    /**
     * An array of custom fields for the test run
     */
    customFields?: string
}