import {
    FullConfig, FullResult, Reporter, Suite,
    TestCase, TestResult, TestStep
} from "playwright/types/testReporter"
import { parse } from "@babel/parser"
import * as fs from 'fs'
import * as path from 'path'
import { XrayIteration } from './types/Xray/XrayIterations'
import { XrayParameter } from './types/Xray/XrayParameter'
import { Logger, xrayErrorLog, xrayLog, xrayWarningLog } from './Logger'
import { DDT, Test } from './types/Test'
import { XrayStepDef } from './types/Xray/XrayStepDef'
import XrayStepResult from './types/Xray/XrayStepResult'
import XrayEvidence from './types/Xray/XrayEvidence'
import { XrayJson } from './types/Xray/XrayJson'
import XrayService from './XrayService'

// Constants
const DDT_TITLE_REGEX: RegExp = /([\w\W]*)\s*->\s*Iteration ([1-9]\d*|1\d+)/
let interrupted: boolean = false

export enum Status {
    PASSED = 'passed',
    FAILED = 'failed',
    SKIPPED = 'skipped',
    EXECUTING = 'executing',
    TODO = 'todo',
}

// Reporter Options Type
export type ReporterOptions = {
    importType: "MANUAL" | "REST"
    testExecutionKey?: string
    project?: string
    testPlanKey?: string
    summary?: string
    description?: string
    overrideTestDetail?: boolean
    reportOutDir?: string
    saveVideoEvidence: boolean,
    saveTraceEvidence: boolean,
    xrayClientID: string,
    xraySecret: string
}

// Evidence Interface
interface PwEvidence {
    name: string,
    contentType: string,
    path?: string,
    body?: Buffer
}

/**
 * Implements a custom reporter for integrating test results with Xray, supporting REST and MANUAL import methods.
 */
export default class XrayPwReporter implements Reporter {
    private readonly reportPath: string
    private xrayReport: XrayJson = { tests: [] }
    private testMap = new Map<string, Test>()
    private specsCommentsMap = new Map<string, Map<number, string>>()
    private xrayService: XrayService

    /**
     * Creates an instance of XrayPwReporter.
     * @param {ReporterOptions} options - The options for configuring the Xray integrator.
     */
    constructor(private readonly options: ReporterOptions) {
        this.reportPath = options.reportOutDir ? `${options.reportOutDir}/xray-report.json` : "xray-pw-reporter/xray-report.json"
        this.xrayService = new XrayService(options)
        this.validateOptions()
    }

    /**
     * Validates the provided options to ensure required fields are present and valid.
     * @throws {Error} Will throw an error if any required option is missing or invalid.
     */
    private validateOptions() {
        const { importType, summary, project, xrayClientID, xraySecret } = this.options
        process.stdout.write(xrayLog("\n-------------------------------------------------------\n⚡ XRAY-INTEGRATOR -> Checking Options... "))

        if (!['REST', 'MANUAL'].includes(importType)) {
            throw new Error(xrayErrorLog(`⛔️ XRAY-INTEGRATOR -> Provide a valid importing method { importType: "MANUAL" | "REST" }⚡\n-------------------------------------------------------\n`))
        }

        if (importType === "REST") {
            if (!project) {
                throw new Error(xrayErrorLog("⛔️ XRAY-INTEGRATOR -> Provide the project ID in the reporter options: { project: string }⚡\n-------------------------------------------------------\n"))
            }

            if (!xrayClientID) {
                throw new Error(xrayErrorLog("⛔️ XRAY-INTEGRATOR -> You selected the REST method, please also provide the CLIENT ID in the reporter options: { xrayClientID: string }⚡\n-------------------------------------------------------\n"))
            }

            if (!xraySecret) {
                throw new Error(xrayErrorLog("⛔️ XRAY-INTEGRATOR -> You selected the REST method, please also provide the SECRET in the reporter options: { xraySecret: string }⚡\n-------------------------------------------------------\n"))
            }

            if (!summary) {
                console.log(xrayWarningLog(`⚠️  XRAY-INTEGRATOR -> You didn't provide a summary for the execution in the reporter options: { summary: string }, a default one will be applied`))
            }

            if (this.options.testExecutionKey) {
                this.xrayReport.testExecutionKey = this.options.testExecutionKey
            } else {
                this.xrayReport.info = {
                    project: project,
                    testPlanKey: this.options.testPlanKey,
                    summary: summary,
                    description: this.options.description,
                }
            }
        }

        console.log(xrayLog("Options OK.⚡\n-------------------------------------------------------"))
    }

    /**
     * Reads and retrieves the test dataset from a JSON file.
     * @param {string} testKey - The key identifier for the test case.
     * @returns {XrayIteration[] | undefined} The iterations of the test case if successful, undefined if an error occurs.
     */
    private readTestDataset(testKey: string): XrayIteration[] | undefined {
        const filePath = `data/datasets/${testKey}.dataset.json`
        try {
            const json = fs.readFileSync(filePath, 'utf8')
            return JSON.parse(json).dataset
        } catch (error) {
            console.error(xrayErrorLog(`Error while reading dataset for TestCase: ${testKey} - ${error}`))
            return undefined
        }
    }

    /**
     * Extracts the summary description from the test case title.
     * @param {TestCase} test - The test case object.
     * @returns {string} The extracted test summary.
     */
    private extractTestSummary(test: TestCase): string {
        const match = test.title.match(DDT_TITLE_REGEX)

        return match ? match[1].trim() : test.title
    }

    /**
     * Extracts the unique identifier key for the test case from comments or titles.
     * @param {TestCase} test - The test case object.
     * @returns {string | undefined} The extracted test key, or undefined if not found.
     */
    private extractTestKey(test: TestCase): string | undefined {
        const comments = this.getTestComments(test.location.file, test)
        return comments?.DDT || comments?.JiraIssue
    }

    /**
     * Extracts the iteration number from the test case title, applicable for data-driven tests.
     * @param {TestCase} test - The test case object.
     * @returns {number | undefined} The extracted iteration number, or undefined if not applicable.
     */
    private extractIterationNumber(test: TestCase): number | undefined {
        const match = test.title.match(DDT_TITLE_REGEX)

        return match ? parseInt(match[2]) : undefined
    }

    /**
     * Extracts evidences (attachments) from the test results.
     * @param {Array<PwEvidence>} attachments - The list of attachments to be processed.
     * @returns {Promise<Array<XrayEvidence>>} A promise that resolves to an array of Xray evidences.
     */
    private async extractEvidences(attachments: Array<PwEvidence>): Promise<Array<XrayEvidence>> {
        const evidences: Array<XrayEvidence> = []
        const { saveTraceEvidence, saveVideoEvidence } = this.options

        for (const attachment of attachments) {
            const { name, path: attachPath, contentType } = attachment

            if ((name === "trace" && saveTraceEvidence) || (name === "video" && saveVideoEvidence)) {
                const attachData = await fs.promises.readFile(attachPath!, { encoding: 'base64' })

                evidences.push({
                    data: attachData,
                    filename: attachPath ? path.basename(attachPath!) : 'file',
                    contentType,
                })
            }
        }

        return evidences
    }

    /**
     * Determines if the given test case is a data-driven test.
     * @param {TestCase} test - The test case object.
     * @returns {boolean} True if the test is data-driven, false otherwise.
     */
    private isTestDDT(test: TestCase): boolean {
        const testComments = this.getTestComments(test.location.file, test)
        const ddtTitleMatchResult = test.title.match(DDT_TITLE_REGEX)

        if (testComments && testComments.DDT && ddtTitleMatchResult)
            return true

        return false
    }

    /**
     * Determines the overall status of a data-driven test based on its iterations.
     * @param {Test} test - The test object representing a data-driven test.
     * @returns {string} The status of the data-driven test.
     */
    private determineDDTStatus(test: Test): string {
        const iterations = test.xrayTest.iterations

        if (iterations) {
            if (iterations.some(iteration => iteration.status === "failed"))
                return Status.FAILED

            if (iterations.every(iteration => iteration.status === "passed"))
                return Status.PASSED

            if (iterations.some(iteration => iteration.status === "skipped"))
                return Status.EXECUTING
        }

        return Status.TODO
    }

    /**
     * Parses and extracts specifications/comments from the test suite's source files.
     * @param {Suite} suite - The test suite object.
     */
    private parsingSpecs(suite: Suite): void {
        suite.allTests().forEach(test => {
            const testFilePath = test.location.file
            if (!this.specsCommentsMap.has(testFilePath)) {
                this.specsCommentsMap.set(testFilePath, this.getSourceComments(testFilePath))
            }
        })
    }

    /**
     * Retrieves comments from the specified source file.
     * @param {string} sourcePath - The path to the source file.
     * @returns {Map<number, string>} A map of line numbers to comments found in the source file.
     */
    private getSourceComments(sourcePath: string): Map<number, string> {
        const commentsMap = new Map<number, string>()

        if (!fs.existsSync(sourcePath)) {
            return commentsMap
        }

        const source = fs.readFileSync(sourcePath).toString('utf-8')

        const ast = parse(source, {
            sourceType: 'module',
            plugins: ['typescript']
        })

        ast.comments!.forEach((item: any) => {
            const startLine = item.loc.start.line
            const endLine = item.loc.end.line
            const comment = item.value

            if (startLine === 1) {
                commentsMap.set(1, item.value)
            }

            commentsMap.set(endLine, comment)
        })

        return commentsMap
    }

    /**
     * Retrieves specific comments associated with a test case from the source file.
     * @param {string} sourcePath - The path to the source file containing the test.
     * @param {TestCase} test - The test case object.
     * @returns {{ [key: string]: string } | undefined} An object containing parsed comments related to the test, or undefined if not found.
     */
    private getTestComments(sourcePath: string, test: TestCase): { [key: string]: string } | undefined {
        const commentRegex: RegExp = new RegExp(/@(\w+)\s+([^@]+)/g)
        const specCommentsMap = this.specsCommentsMap.get(sourcePath)

        if (!specCommentsMap)
            return

        const testLine = test.location.line
        let comments = specCommentsMap.get(testLine - 1)

        if (!comments)
            return

        const matches = comments.matchAll(commentRegex)
        const parsed: { [key: string]: string } = {}

        for (const match of matches) {
            parsed[match[1]] = match[2].trim().replace(/(\*+|\*+\/)$/g, '').trim()
        }

        return parsed
    }

    /**
     * Saves the generated Xray report locally as a JSON file.
     */
    private async saveReportLocally() {
        try {
            fs.mkdirSync(path.dirname(this.reportPath), { recursive: true })
            fs.writeFileSync(this.reportPath, JSON.stringify(this.xrayReport, null, 2), 'utf8')
            console.log(xrayLog(`⚡ XRAY-INTEGRATOR -> Creating xray-report... report saved to '${this.reportPath}'⚡`))
        } catch (error) {
            if (error instanceof Error)
                console.error(xrayErrorLog(`⚡ XRAY-INTEGRATOR -> Error while saving report locally⚡`))
        }
    }


    // INTERFACE'S METHODS
    async onBegin(config: FullConfig, suite: Suite): Promise<void> {
        if (this.options.importType == 'REST') {
            try {
                await this.xrayService.authenticate()
            } catch (error) {
                if (error instanceof Error) {
                    console.log(error.message)
                    process.exit(1)
                }
            }
        }

        this.parsingSpecs(suite)
        console.log(xrayLog(`Executing ${suite.allTests().length} tests...\n`))
    }

    async onStepEnd(test: TestCase, result: TestResult, step: TestStep): Promise<void> {
        const testSummary = this.extractTestSummary(test)
        const testKey = this.extractTestKey(test)
        const iterationNumber = this.extractIterationNumber(test)!
        const isDDT = this.isTestDDT(test)
        const TestClass = isDDT ? DDT : Test
        let dataset: XrayIteration[] | undefined

        const newStepResult: XrayStepResult = {
            status: step.error ? Status.FAILED : Status.PASSED,
            actualResult: step.error ? step.error.message : "OK",
        }

        // Manage step only if test.step
        if (testKey && step.category === "test.step") {
            const testMapped = this.testMap.get(testKey) || new TestClass(testKey)

            if (isDDT) {
                dataset = this.readTestDataset(testKey)

                if (dataset) {
                    if (!testMapped.xrayTest.iterations) {
                        testMapped.xrayTest.iterations = [] as XrayIteration[]
                    }

                    if (!testMapped.xrayTest.iterations[iterationNumber - 1]) {
                        testMapped.xrayTest.iterations[iterationNumber - 1] = {
                            steps: [newStepResult]
                        }
                    } else {
                        testMapped.xrayTest.iterations[iterationNumber - 1].steps?.push(newStepResult)
                    }
                }
            } else {
                // Getting test mapped if exist, create it otherwise
                if (!testMapped.xrayTest.steps) {
                    testMapped.xrayTest.steps = [newStepResult]
                } else {
                    testMapped.xrayTest.steps.push(newStepResult)
                }
            }

            this.testMap.set(testKey, testMapped)

            // If override defined, init testInfo and push step def
            if (this.options.overrideTestDetail) {

                // New Step Def
                const newStep: XrayStepDef = {
                    action: step.title,
                    data: '',
                    result: '',
                }

                if (!testMapped.xrayTest.testInfo || !testMapped.xrayTest.testInfo.steps) {
                    testMapped.xrayTest.testInfo = {
                        type: 'Manual',
                        projectKey: this.options.project,
                        summary: testSummary,
                        steps: [newStep] as XrayStepDef[],
                    }
                } else {
                    // Check if the step definition already exists
                    const stepDefExists = testMapped.xrayTest.testInfo.steps.some(existingStep =>
                        existingStep.action === newStep.action
                    )

                    if (!stepDefExists) {
                        testMapped.xrayTest.testInfo.steps.push(newStep)
                    }
                }

                this.testMap.set(testKey, testMapped)
            }
        }
    }

    async onTestEnd(test: TestCase, result: TestResult) {
        const testSummary = this.extractTestSummary(test)
        const testKey = this.extractTestKey(test)
        const iterationNumber = this.extractIterationNumber(test)
        const isDDT = this.isTestDDT(test)
        const TestClass = isDDT ? DDT : Test

        let ddtParameters: XrayParameter[] | undefined
        let testMapped

        if (testKey) {
            testMapped = this.testMap.get(testKey) || new TestClass(testKey)

            if (isDDT) {
                const dataset = this.readTestDataset(testKey)
                if (dataset) {
                    ddtParameters = dataset[iterationNumber! - 1]?.parameters

                    if (!testMapped.xrayTest.iterations) {
                        testMapped.xrayTest.iterations = []
                    }

                    if (ddtParameters) {
                        testMapped.xrayTest.iterations[iterationNumber! - 1] = {
                            parameters: ddtParameters,
                            status: result.status,
                        }
                    }
                }
            } else {
                testMapped = this.testMap.get(testKey) || new Test(testKey)
                testMapped.xrayTest.status = result.status
            }

            if (result.error && result.attachments && result.attachments.length > 0) {
                testMapped.xrayTest.evidence = await this.extractEvidences(result.attachments)
            }

            testMapped.xrayTest.status = result.status

            if (this.options.overrideTestDetail) {
                if (!testMapped.xrayTest.testInfo) {
                    testMapped.xrayTest.testInfo = {
                        type: 'Manual',
                        projectKey: this.options.project,
                        summary: testSummary,
                    }
                }
            }

            this.testMap.set(testKey, testMapped)
        }

        Logger.logTestResult(test, result, this.getTestComments(test.location.file, test), ddtParameters)
    }

    async onEnd(result: FullResult) {
        console.log(xrayLog("\nExecution done.\n\n"))

        if (!interrupted) {
            for (const [, test] of this.testMap.entries()) {
                if (test.testType === "DDT") {
                    test.xrayTest.status = this.determineDDTStatus(test)
                }
                this.xrayReport.tests.push(test.xrayTest)
            }

            // Saving report locally
            await this.saveReportLocally()

            if (this.options.importType == "REST") {
                try {
                    await this.xrayService.uploadExecution(this.xrayReport)
                } catch (error) {
                    if (error instanceof Error) {
                        console.log(error.message)
                    }
                }
            } else
                console.log(xrayLog("created successfully.⚡"))
        }
    }
}

process.addListener("SIGINT", () => {
    interrupted = true
})
