import { XrayParameter } from "./XrayParameter";
import XrayStepResult from "./XrayStepResult";

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayIteration {

    /**
     * An array of parameters along with their values
     */
    parameters?: XrayParameter[],

    /**
     * The log for the iteration
     */
    log?: string,

    /**
     * A duration for the iteration
     */
    duration?: string,

    /**
     * The status for the iteration (PASSED, FAILED, EXECUTING, TODO, custom statuses ...)
     */
    status?: string,

    /**
     * An array of step results (for Manual tests)
     */
    steps: XrayStepResult[],
}