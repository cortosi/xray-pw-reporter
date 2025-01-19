/**
 * Represents the data structure sent to a Microsoft Teams webhook
 * to report Jira issue execution results.
 */
export interface TeamsWebhookData {
    /**
     * Information about the Jira issue associated with the test execution.
     */
    jiraIssue: {
        /**
         * Summary of the test execution.
         * Example: "Automated Run - Functional Tests".
         */
        executionSummary: string

        /**
         * URL link to the Jira issue in the Xray project.
         * Example: "https://example.atlassian.net/browse/ISSUE-123".
         */
        link: string
    }

    /**
     * Test execution results summary.
     */
    results: {
        /**
         * Total number of tests executed in this run.
         * This is typically a stringified number (e.g., "20").
         */
        executed: string

        /**
         * Total number of tests that passed.
         * This is typically a stringified number (e.g., "15").
         */
        passed: string

        /**
         * Total number of tests that failed.
         * This is typically a stringified number (e.g., "3").
         */
        failed: string

        /**
         * Total number of tests that were skipped.
         * This is typically a stringified number (e.g., "2").
         */
        skipped: string

        /**
         * Total runtime of the test execution.
         * Example: "5m 30s" or "330 seconds".
         */
        runtime: string
    }
}
