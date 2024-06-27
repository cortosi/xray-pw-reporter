import { Info } from "./XrayInfo";
import { XrayTest } from "./XrayTest";

/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayReport {
    /**
     * The test execution key where to import the execution results
     */
    info?: Info;

    /**
     * The test execution key where to import the execution results
     */
    readonly tests?: XrayTest[];

    /**
     * The Test Run result detail
     */
    testExecutionKey?: string;
}
