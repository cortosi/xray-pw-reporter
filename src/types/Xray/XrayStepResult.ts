import XrayEvidence from "./XrayEvidence"

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export default interface XrayStepResult {

    /**
     * The status for the test step (PASSED, FAILED, EXECUTING, TODO, custom statuses...)
     */
    status?: string

    /**
     * The comment for the step result
     */
    comment?: string

    /**
     * The actual result field for the step result
     */
    actualResult?: string

    /**
     * An array of evidence items of the test run
     */
    evidence?: XrayEvidence[]

    /**
     * An array of defect issue keys to associate with the test run
     */
    defects?: string
}