/**
 * Options for configuring the Xray integration and reporting.
 */
export type ReporterOptions = {
    /**
     * Type of import to Xray.
     * - "MANUAL": Manual import of test results.
     * - "REST": REST API-based import of test results.
     */
    importType: "MANUAL" | "REST"

    /**
     * The Jira execution issue key where the results will be imported.
     * If it does not exist, a new execution will be created.
     */
    testExecutionKey: string

    /**
     * The Jira project key where the test cases belong.
     */
    project: string

    /**
     * The Jira test plan key to which the test execution will be linked.
     * If `testExecutionKey` is provided, it takes precedence.
     */
    testPlanKey: string

    /**
     * Details for creating a new test execution in Jira.
     * This is used when `testExecutionKey` is not provided or the execution does not exist.
     */
    newExecution: {
        /**
         * The assignee of the new execution issue.
         */
        assignee: { id: string }

        /**
         * The reporter of the new execution issue.
         */
        reporter: { id: string }

        /**
         * The issue type of the execution.
         * It can be defined by name or ID.
         */
        issuetype: { name: string } | { id: string }

        /**
         * Summary of the execution issue.
         */
        summary: string

        /**
         * Optional description for the execution issue.
         */
        description?: string

        /**
         * Components associated with the execution.
         */
        components: Component[]

        /**
         * Additional required fields for creating the execution issue.
         */
        requiredFields: [
            { [field: string]: any } // A dynamic object for custom fields.
        ]
    }

    /**
     * If true, overrides test details in Jira (e.g., steps, summary).
     */
    overrideTestDetail: boolean

    /**
     * Directory where the report files will be saved.
     */
    reportOutDir: string

    /**
     * If true, includes video evidence in the test execution results.
     */
    saveVideoEvidence: boolean

    /**
     * If true, includes trace evidence in the test execution results.
     */
    saveTraceEvidence: boolean

    /**
     * The client ID for authenticating with the Xray API.
     */
    xrayClientID: string

    /**
     * The client secret for authenticating with the Xray API.
     */
    xraySecret: string

    /**
     * The user ID that will be marked as the executor of the tests.
     */
    executedBy: string

    /**
     * If true, enables sending test execution results to a Microsoft Teams webhook.
     */
    useTeamsWebhook: boolean

    /**
     * URL of the Microsoft Teams webhook where execution results will be posted.
     */
    teamsWebhook: string

    /**
     * If true, enables debug mode to log additional information during execution.
     */
    debug: boolean
}

/**
 * Represents a component associated with a test execution or test case.
 */
type Component = { name: string; id: string } | { id: string; name: string }