import { TestResult } from "@playwright/test/reporter"
import { Mutex } from "async-mutex"
const clc = require("cli-color")

const xrayLog = clc.blackBright.bold
const xrayErrorLog = clc.redBright.bold
const xrayWarningLog = clc.yellow.bold
const xrayPassedTest = clc.greenBright.bold
const xrayFailedTest = clc.redBright.bold

/**
 * Logger class to handle test progress and result logging with formatted output.
 */
export class Logger {
    // Keeps track of the current test progress number
    private static testProgressNumber: number = 1

    // Total number of tests in the suite
    public static totalTestsNumber: number = 0

    /**
     * Logs the result of a test based on its status.
     * @param test - The test object.
     * @param result - The test result object, containing status and duration.
     * @param issueKey - The associated Jira issue key (if available).
     */
    public static logTestResult(test: any, result: TestResult, issueKey?: string): void {
        switch (result.status) {
            case "passed":
                this.printTestSuccess(test, result.duration, issueKey)
                break
            case "failed":
            case "timedOut":
                this.printTestFail(test, result.duration, issueKey)
                break
            case "skipped":
                this.printTestSkipped(test, result.duration, issueKey)
                break
            default:
            // No action for other statuses
        }

        this.incrProgress() // Update progress after logging the result
    }

    /**
     * Logs a general information message.
     * @param str - The message string to be logged.
     */
    public static log(str: string) {
        console.log(xrayLog(str))
    }

    /**
     * Logs an error message in red.
     * @param str - The error message string to be logged.
     */
    public static error(str: string) {
        console.log(xrayErrorLog(str))
    }

    /**
     * Increments the current progress counter.
     * Uses a Mutex to avoid race conditions when multiple threads may attempt updates.
     */
    private static incrProgress() {
        const mutex = new Mutex()

        mutex.waitForUnlock().then(() => {
            Logger.testProgressNumber++
        })
    }

    /**
     * Returns the current progress as a formatted string.
     * Example: "3/10"
     */
    private static getProgress(): string {
        return `${this.testProgressNumber}/${this.totalTestsNumber}\t`
    }

    /**
     * Returns a notification string if the test is excluded.
     * @param issueKey - The Jira issue key associated with the test (if available).
     */
    private static notifyExcluded(issueKey?: string): string {
        return issueKey ? '' : ` - ${xrayWarningLog("⚡ Excluded.⚡")}`
    }

    /**
     * Formats the duration from milliseconds into a readable string.
     * @param milliseconds - Duration in milliseconds.
     * @returns A human-readable duration (e.g., "1.5m", "30s", "120msec").
     */
    private static formatDuration(milliseconds: number): string {
        const seconds = milliseconds / 1000

        if (seconds >= 60) {
            const minutes = seconds / 60
            return `${minutes.toFixed(1)}m`
        } else if (seconds >= 1) {
            return `${Math.floor(seconds)}s`
        } else {
            return `${milliseconds}msec`
        }
    }

    /**
     * Logs a success message for a test.
     * @param test - The test object.
     * @param duration - The test execution duration in milliseconds.
     * @param issueKey - The associated Jira issue key (if available).
     */
    private static printTestSuccess(test: any, duration: number, issueKey?: string) {
        console.log(
            this.getProgress() +
            xrayPassedTest(`✅ ${test._projectId} ✅ ` + test.title) +
            this.notifyExcluded(issueKey) +
            ` - ${this.formatDuration(duration)}`
        )
    }

    /**
     * Logs a failure message for a test.
     * @param test - The test object.
     * @param duration - The test execution duration in milliseconds.
     * @param issueKey - The associated Jira issue key (if available).
     */
    private static printTestFail(test: any, duration: number, issueKey?: string) {
        console.log(
            this.getProgress() +
            xrayFailedTest(`❌ ${test._projectId} ❌ ` + test.title) +
            this.notifyExcluded(issueKey) +
            ` - ${this.formatDuration(duration)}`
        )
    }

    /**
     * Logs a skipped test message.
     * @param test - The test object.
     * @param duration - The test execution duration in milliseconds.
     * @param issueKey - The associated Jira issue key (if available).
     */
    private static printTestSkipped(test: any, duration: number, issueKey?: string) {
        console.log(
            this.getProgress() +
            xrayLog(`⏩ ${test._projectId} ⏩ ` + test.title) +
            this.notifyExcluded(issueKey)
        )
    }
}
