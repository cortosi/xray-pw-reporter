import { TestResult } from "@playwright/test/reporter"
import { Mutex } from "async-mutex"
const clc = require("cli-color")

const xrayLog = clc.blackBright.bold
const xrayErrorLog = clc.redBright.bold
const xrayWarningLog = clc.yellow.bold
const xrayPassedTest = clc.greenBright.bold
const xrayFailedTest = clc.redBright.bold

export class Logger {
    private static testProgressNumber: number = 1
    public static totalTestsNumber: number = 0

    private static incrProgress() {
        const mutex = new Mutex()

        mutex
            .waitForUnlock()
            .then(() => {
                Logger.testProgressNumber++
            })
    }

    private static getProgress(): string {
        return `${this.testProgressNumber}/${this.totalTestsNumber}\t`
    }

    private static notifyExcluded(issueKey?: string): string {
        return issueKey ? '' : ` -${xrayWarningLog("⚡ Excluded.⚡")}`
    }

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

    private static printTestSuccess(test: any, duration: number, issueKey?: string) {
        console.log(this.getProgress() + xrayPassedTest(`✅ ${test._projectId} ✅ ` + test.title) + this.notifyExcluded(issueKey) + ` - ${this.formatDuration(duration)}`)
    }

    private static printTestFail(test: any, duration: number, issueKey?: string) {
        console.log(this.getProgress() + xrayFailedTest(`❌ ${test._projectId} ❌ ` + test.title) + this.notifyExcluded(issueKey) + ` - ${this.formatDuration(duration)}`)
    }

    private static printTestSkipped(test: any, duration: number, issueKey?: string) {
        console.log(this.getProgress() + xrayLog(`⏩ ${test._projectId} ⏩ ` + test.title) + this.notifyExcluded(issueKey))
    }

    static logTestResult(test: any, result: TestResult, issueKey?: string): void {
        // const values = ddtParams.map(param => param.value).join(', ')

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
        }

        this.incrProgress()
    }

    static log(str: string) {
        console.log(xrayLog(str))
    }

    static error(str: string) {
        console.log(xrayErrorLog(str))
    }
}
