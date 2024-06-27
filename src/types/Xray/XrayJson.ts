import { Info } from "./XrayInfo"
import { XrayTest } from "./XrayTest"

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayJson {
    /**
     * The test execution key where to import the execution results
     */
    testExecutionKey?: string

    /**
     * The info object for creating new Test Execution issues (link)
     */
    info?: Info

    /**
     * The Test Run result details
     */
    tests: XrayTest[]
}