/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayImportResponse {
    /**
     * Unique progressive id
     */
    id: string,

    /**
     * Test Execution Just created
     */
    key: string,

    /**
     * Link to execution on Jira project
     */
    self: string
}