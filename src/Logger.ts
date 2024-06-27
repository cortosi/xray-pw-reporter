import { TestResult } from "@playwright/test/reporter";
import { XrayParameter } from "./types/Xray/XrayParameter";
import chalk = require("chalk");

export const xrayLog = chalk.hex("#363636").bold
export const xrayErrorLog = chalk.redBright.bold
export const xrayWarningLog = chalk.yellow.bold

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
                console.log(chalk.bold.green(`\t✅ ${test._projectId} ✅ ` + coloredOutput) + nonColoredOutput);
                break;
            case "failed":
            case "timedOut":
                console.log(chalk.bold.red(`\t❌ ${test._projectId} ❌ ` + coloredOutput) + nonColoredOutput);
                break;
            case "skipped":
                console.log(`\t⏩ ${test._projectId} ⏩ ` + coloredOutput + nonColoredOutput);
                break;
            default:
                console.log(coloredOutput + nonColoredOutput);
        }
    }
}