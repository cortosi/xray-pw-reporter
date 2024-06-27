/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface Info {
    /**
     * The project key where the test execution will be created
     */
    project?: string

    /**
     * The summary for the test execution issue
     */
    summary?: string

    /**
     * The description for the test execution issue
     */
    description?: string

    /**
     * The version name for the Fix Version field of the test execution issue
     */
    version?: string

    /**
     * A revision for the revision custom field
     */
    revision?: string

    /**
     * The userid for the Jira user who executed the tests
     */
    user?: string

    /**
     * The start date for the test execution issue
     */
    startDate?: string

    /**
     * The finish date for the test execution issue
     */
    finishDate?: string

    /**
     * The test plan key for associating the test execution issue
     */
    testPlanKey?: string

    /**
     * The test environments for the test execution issue
     */
    testEnvironments?: string
}
