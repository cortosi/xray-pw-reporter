import { TestResult } from "@playwright/test/reporter";
import { XrayParameter } from "./types/Xray/XrayParameter";
const clc = require("cli-color");

export const xrayLog = clc.blackBright.bold
export const xrayErrorLog = clc.redBright.bold
export const xrayWarningLog = clc.yellow.bold
export const xrayPassedTest = clc.greenBright.bold
export const xrayFailedTest = clc.redBright.bold

export class Logger {
    static logTestResult(test: any, result: TestResult, comments?: { [key: string]: string }, ddtParams?: XrayParameter[]): void {
        let coloredOutput: string;
        let nonColoredOutput: string;

        if (ddtParams && comments) {
            // Extracting values only
            const values = ddtParams.map(param => param.value).join(', ');

            coloredOutput = `${test.title} | DDT for test: ${test.parent.title} (${comments.DDT}) | `;
            nonColoredOutput = values;
        } else {
            coloredOutput = `${test.title}`;
            nonColoredOutput = '';
        }

        switch (result.status) {
            case "passed":
                console.log(xrayPassedTest(`\t✅ ${test._projectId} ✅ ` + coloredOutput) + nonColoredOutput);
                break;
            case "failed":
            case "timedOut":
                console.log(xrayFailedTest(`\t❌ ${test._projectId} ❌ ` + coloredOutput) + nonColoredOutput);
                break;
            case "skipped":
                console.log(`\t⏩ ${test._projectId} ⏩ ` + coloredOutput + nonColoredOutput);
                break;
            default:
                console.log(coloredOutput + nonColoredOutput);
        }
    }
}