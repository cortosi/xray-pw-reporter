import { TestResult } from "@playwright/test/reporter"

/**
 * Class to track and update metrics for test execution.
 * Keeps a record of the number of executed, passed, failed, and skipped tests,
 * as well as the total runtime of the test suite.
 */
export class ExecutionMetrics {
    // Total number of tests executed
    public static executed: number = 0

    // Total number of tests that passed
    public static passed: number = 0

    // Total number of tests that failed or timed out
    public static failed: number = 0

    // Total number of tests that were skipped
    public static skipped: number = 0

    // Total runtime of all tests (in seconds or other desired unit)
    public static runtime: number = 0

    /**
     * Updates the execution metrics based on the result of a test.
     * Increments the appropriate counter based on the test's status.
     * 
     * @param {TestResult} result - The result of the executed test, containing its status.
     */
    public static updateMetrics(result: TestResult): void {
        switch (result.status) {
            case "passed":
                ExecutionMetrics.passed++
                break
            case "failed":
            case "timedOut":
                ExecutionMetrics.failed++
                break
            case "skipped":
                ExecutionMetrics.skipped++
                break
            default:
        }
    }
}

