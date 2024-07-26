import {
    FullConfig, FullResult, Reporter, Suite,
    TestCase, TestResult, TestStep
} from "playwright/types/testReporter"
import { parse } from "@babel/parser"
import * as fs from 'fs'
import * as path from 'path'
import { XrayIteration } from './types/Xray/XrayIteration'
import { Logger } from './Logger'
import { DDT, Test } from './types/Test'
import { XrayStepDef } from './types/Xray/XrayStepDef'
import XrayStepResult from './types/Xray/XrayStepResult'
import XrayEvidence from './types/Xray/XrayEvidence'
import { XrayJson } from './types/Xray/XrayJson'
import XrayService from './XrayService'
import { z } from "zod"
import { XrayInfoMultipart } from "./types/Xray/XrayInfoMultipart"

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

type Component = { name: string; id: string } | { id: string; name: string };

// Reporter Options Type
export type ReporterOptions = {
    importType: "MANUAL" | "REST"
    testExecutionKey: string
    project: string
    testPlanKey: string
    newExecution: {
        assignee: { id: string },
        issuetype: { name: string } | { id: string }
        summary: string
        description?: string
        components: Component[]
        requiredFields: [
            { [field: string]: any }
        ]
    }
    overrideTestDetail: boolean
    reportOutDir: string
    saveVideoEvidence: boolean
    saveTraceEvidence: boolean
    xrayClientID: string
    xraySecret: string,
    debug: boolean
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
    private reportPath: string
    private infoPath: string
    private xrayReport: XrayJson = { tests: [] }
    private info = {} as XrayInfoMultipart
    private testMap = new Map<string, Test>()
    private specsCommentsMap = new Map<string, Map<number, string>>()
    private xrayService: XrayService

    /**
     * Creates an instance of XrayPwReporter.
     * @param {ReporterOptions} options - The options for configuring the Xray integrator.
     */
    constructor(private readonly options: ReporterOptions) {
        this.reportPath = options.reportOutDir ? `${options.reportOutDir}/xray-report.json` : "xray-pw-reporter/results.json"
        this.infoPath = options.reportOutDir ? `${options.reportOutDir}/xray-report.json` : "xray-pw-reporter/issueFields.json"
        this.xrayService = new XrayService(options)

        try {
            this.validateOptions()
        } catch (error) {
            if (error instanceof Error)
                Logger.error(error.message)

            process.exit(1)
        }
    }

    /**
     * Validates the provided options to ensure required fields are present and valid.
     * @throws {Error} Will throw an error if any required option is missing or invalid.
     */
    private validateOptions() {
        const { importType, project, xrayClientID, xraySecret, testExecutionKey, testPlanKey } = this.options

        if (!['REST', 'MANUAL'].includes(importType)) {
            throw new Error(`\n${"-".repeat(91)}\n ⛔️ XRAY-PW-REPORTER -> Provide a valid importing method { importType: "MANUAL" | "REST" }⚡\n${"-".repeat(91)}\n`)
        }

        if (!project) {
            throw new Error(`\n${"-".repeat(93)}\n ⛔️ XRAY-PW-REPORTER -> Provide the project ID in the reporter options: { project: string }⚡\n${"-".repeat(93)}\n`)
        }

        if (importType === "REST") {
            if (!xrayClientID) {
                throw new Error(`\n${"-".repeat(139)}\n ⛔️ XRAY-PW-REPORTER -> You selected the REST method, please also provide the CLIENT ID in the reporter options: { xrayClientID: string }⚡\n${"-".repeat(139)}\n`)
            }

            if (!xraySecret) {
                throw new Error(`\n${"-".repeat(134)}\n ⛔️ XRAY-PW-REPORTER -> You selected the REST method, please also provide the SECRET in the reporter options: { xraySecret: string }⚡\n${"-".repeat(134)}\n`)
            }

            if (testExecutionKey) {
                this.xrayReport.testExecutionKey = testExecutionKey
            }

            if (testPlanKey) {
                if (!this.options.newExecution) {
                    throw new Error(`\n${"-".repeat(107)}\n ⛔️ XRAY-PW-REPORTER -> In order to import the execution in the plan, please provide newExecution object.⚡\n${"-".repeat(107)}\n`)
                }
            }

            if (this.options.newExecution) {
                if (!this.options.newExecution.summary) {
                    throw new Error(`⛔️ XRAY-PW-REPORTER -> In order to create a new execution into ${testPlanKey}, please also provide the execution summary in the reporter options.\n`)
                }

                if (!this.options.newExecution.assignee) {
                    throw new Error(`⛔️ XRAY-PW-REPORTER -> In order to create a new execution into ${testPlanKey}, please also provide the assignee for the execution in the reporter options.\n`)
                }

                if (!this.options.newExecution.issuetype) {
                    throw new Error(`⛔️ XRAY-PW-REPORTER -> In order to create a new execution into ${testPlanKey}, please also provide the execution issue id in the reporter options.\n`)
                }

                this.info.xrayFields = { testPlanKey: testPlanKey }
                this.info.fields = {
                    assignee: this.options.newExecution.assignee,
                    issuetype: this.options.newExecution.issuetype,
                    project: { key: this.options.project },
                    summary: this.options.newExecution.summary
                }

                // Pushing mandatory
                if (this.options.newExecution.requiredFields)
                    Object.assign(this.info.fields, this.options.newExecution.requiredFields[0])
            }
        }

        Logger.log(`\n${"-".repeat(56)}\n⚡ XRAY-PW-REPORTER -> Checking Options... Options OK.⚡\n${"-".repeat(56)}`)
    }

    /**
     * Reads and retrieves the test dataset from a JSON file.
     * @param {string} testKey - The key identifier for the test case.
     * @returns {XrayIteration[] | undefined} The iterations of the test case if successful, undefined if an error occurs.
     */
    private readTestDataset(testKey: string): XrayIteration[] | undefined {
        const fullPath = path.dirname(__dirname)
        const regexResp = /^(.*?)node_modules/.exec(fullPath)
        const appRoot = regexResp ? regexResp[1] : ""

        const filePath = path.join(appRoot, 'data', 'datasets', `${testKey}.dataset.json`)
        try {
            const json = fs.readFileSync(filePath, 'utf8')
            return JSON.parse(json).dataset
        } catch (error) {
            Logger.error(`Error while reading dataset for TestCase: ${testKey} - ${error}`)
            return undefined
        }
    }

    private validateDataset(testKey: string) {
        const fullPath = path.dirname(__dirname)
        const regexResp = /^(.*?)node_modules/.exec(fullPath)
        const appRoot = regexResp ? regexResp[1] : ""

        const filePath = path.join(appRoot, 'data', 'datasets', `${testKey}.dataset.json`)

        const parameterSchema = z.object({
            name: z.string(),
            value: z.string(),
        })

        const datasetSchema = z.object({
            dataset: z.array(z.object({
                parameters: z.array(parameterSchema),
            })),
        })

        try {
            const fileContent = fs.readFileSync(filePath, 'utf8')
            const jsonData = JSON.parse(fileContent)

            datasetSchema.parse(jsonData)

            return true
        } catch (error) {
            return false
        }
    }

    /**
     * Extracts the unique identifier key for the test case from comments or titles.
     * @param {TestCase} test - The test case object.
     * @returns {string | undefined} The extracted test key, or undefined if not found.
     */
    private extractTestKey(test: TestCase): string | undefined {
        const comments = this.getTestComments(test.location.file, test)

        if (!comments)
            return undefined

        return comments.JiraIssue
    }

    private extractDDTKey(test: TestCase): string | undefined {
        const comments = this.getTestComments(test.location.file, test)

        if (!comments)
            return undefined

        return comments.DDT
    }

    /**
     * Extracts the summary description from the test case title.
     * @param {TestCase} test - The test case object.
     * @returns {string} The extracted test summary.
     */
    private extractDDTSummary(test: TestCase): string {
        const match = test.title.match(DDT_TITLE_REGEX)

        return match ? match[1].trim() : test.title
    }

    /**
     * Extracts the iteration number from the test case title, applicable for data-driven tests.
     * @param {TestCase} test - The test case object.
     * @returns {number | undefined} The extracted iteration number, or undefined if not applicable.
     */
    private extractIterationNumber(test: TestCase): number | undefined {
        const match = test.title.match(DDT_TITLE_REGEX)

        return match ? parseInt(match[2]) - 1 : undefined
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
    private determineDDTStatus(test: DDT): string {
        const iterations = test.xrayTest.iterations

        if (iterations) {
            if (iterations.some(iteration => iteration.status === "failed"))
                return Status.FAILED

            if (iterations.every(iteration => iteration.status === "passed"))
                return Status.PASSED

            if (iterations.some(iteration => iteration.status === "skipped"))
                return Status.EXECUTING
        }

        return Status.PASSED
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
            Logger.log(`${"-".repeat(99)}\n⚡ XRAY-PW-REPORTER -> Creating xray-report... report saved to '${this.reportPath}'⚡\n${"-".repeat(99)}`)
        } catch (error) {
            if (error instanceof Error)
                Logger.error(`${"-".repeat(57)}\n⚡ XRAY-PW-REPORTER -> Error while saving report locally⚡\n${"-".repeat(57)}`)
        }
    }

    private async saveInfoLocally() {
        try {
            fs.mkdirSync(path.dirname(this.infoPath), { recursive: true })
            fs.writeFileSync(this.infoPath, JSON.stringify(this.info, null, 2), 'utf8')
        } catch (error) {
            if (error instanceof Error)
                Logger.error(`${"-".repeat(57)}\n⚡ XRAY-PW-REPORTER -> Error while saving issueFields locally⚡\n${"-".repeat(57)}`)
        }
    }

    private getXrayStatus(pwStatus: string) {
        switch (pwStatus) {
            case "passed":
                return Status.PASSED
            case "failed":
            case "timedOut":
                return Status.FAILED
            case "skipped":
            case "interrupted":
                return Status.TODO
        }
    }

    // INTERFACE'S METHODS
    async onBegin(config: FullConfig, suite: Suite): Promise<void> {
        if (suite.allTests().length == 0) {
            Logger.log("No tests found.\n")
            process.exit(0)
        }

        this.parsingSpecs(suite)
        Logger.totalTestsNumber = suite.allTests().length
        Logger.log(`Executing ${suite.allTests().length} tests...\n`)
    }

    async onTestBegin(test: TestCase, result: TestResult) {
        const testKey = this.extractTestKey(test)
        const ddtKey = this.extractDDTKey(test)

        const saveNewTest = (key: string, isDDT: boolean) => {
            const newTest = isDDT ? new DDT(key) : new Test(key)

            newTest.xrayTest.testKey = key

            // TestInfo
            if (this.options.overrideTestDetail) {
                newTest.xrayTest.testInfo = {
                    type: "Manual",
                    projectKey: this.options.project,
                    summary: isDDT ? this.extractDDTSummary(test) : test.title,
                }
            }

            this.testMap.set(key, newTest)
        }

        if (testKey) {
            saveNewTest(testKey, false)
        }

        if (ddtKey && this.isTestDDT(test)) {
            if (this.validateDataset(ddtKey) && !this.testMap.has(ddtKey)) {
                saveNewTest(ddtKey, true)
            }
        }
    }

    async onTestEnd(test: TestCase, result: TestResult) {
        const testKey = this.extractTestKey(test)
        const ddtKey = this.extractDDTKey(test)

        const updateTestDetails = async (testMapped: Test) => {
            if (testMapped) {
                if (!(testMapped instanceof DDT))
                    testMapped.xrayTest.status = this.getXrayStatus(result.status)

                testMapped.xrayTest.evidence = await this.extractEvidences(result.attachments)
            }
        }

        if (testKey) {
            const testMapped = this.testMap.get(testKey)!
            await updateTestDetails(testMapped)
        }

        if (ddtKey && this.isTestDDT(test)) {
            const testMapped = this.testMap.get(ddtKey)!

            // Save iteration for tests without steps
            const iterationNumber = this.extractIterationNumber(test)!

            if (!testMapped.xrayTest.iterations) {
                testMapped.xrayTest.iterations = []
            }

            if (!testMapped.xrayTest.iterations[iterationNumber]) {
                // First time this iteration runs
                testMapped.xrayTest.iterations[iterationNumber] = {
                    status: result.status,
                    steps: [],
                    parameters: this.readTestDataset(ddtKey)![iterationNumber].parameters
                }
            }

            await updateTestDetails(testMapped)
        }

        Logger.logTestResult(test, result, testKey || (this.isTestDDT(test) ? ddtKey : undefined))
    }

    async onStepEnd(test: TestCase, result: TestResult, step: TestStep): Promise<void> {
        const testKey = this.extractTestKey(test)
        const ddtKey = this.extractDDTKey(test)

        // Return if not step or step nested
        if (!(step.category == "test.step") || step.parent)
            return

        const newStepResult: XrayStepResult = {
            status: step.error ? Status.FAILED : Status.PASSED,
            actualResult: step.error ? step.error.message : "OK",
        }

        const newStepDef: XrayStepDef = {
            action: step.title,
            data: "",
            result: "",
        }

        const addStepResult = (testMapped: Test) => {
            if (testMapped.xrayTest.steps) {
                testMapped.xrayTest.steps.push(newStepResult)
            } else {
                testMapped.xrayTest.steps = [newStepResult]
            }
        }

        const addStepDef = (testMapped: Test) => {
            if (this.options.overrideTestDetail) {
                if (!testMapped.xrayTest.testInfo!.steps) {
                    testMapped.xrayTest.testInfo!.steps = [newStepDef]
                } else {
                    // Pushing new stepDef if not exist
                    const stepDefExists = testMapped.xrayTest.testInfo!.steps.some(existingStep =>
                        existingStep.action === newStepDef.action
                    )

                    if (!stepDefExists) {
                        testMapped.xrayTest.testInfo!.steps.push(newStepDef)
                    }
                }
            }
        }

        if (testKey) {
            const testMapped = this.testMap.get(testKey)
            if (testMapped && !testMapped.containStep(step.title)) {
                addStepResult(testMapped)
                addStepDef(testMapped)
                testMapped.saveStep(step.title)
            }
        }

        if (ddtKey && this.isTestDDT(test)) {
            const testMapped = this.testMap.get(ddtKey)
            if (testMapped && !testMapped.containStep(step.title)) {
                const iterationNumber = this.extractIterationNumber(test)!

                if (!testMapped.xrayTest.iterations) {
                    testMapped.xrayTest.iterations = []
                }

                if (!testMapped.xrayTest.iterations[iterationNumber]) {
                    // First time this iteration runs
                    testMapped.xrayTest.iterations[iterationNumber] = {
                        steps: [newStepResult],
                        parameters: this.readTestDataset(ddtKey)![iterationNumber].parameters
                    }
                } else {
                    // Iteration already present, just push step result
                    testMapped.xrayTest.iterations[iterationNumber].steps.push(newStepResult)
                }

                // Updating iteration status
                testMapped.xrayTest.iterations[iterationNumber].status = step.error ? Status.FAILED : Status.PASSED

                addStepDef(testMapped)
                testMapped.saveStep(step.title)
            }
        }
    }

    async onEnd(result: FullResult) {
        Logger.log("\nExecution done.\n")

        if (!interrupted) {
            for (const [, test] of this.testMap.entries()) {
                if (test.testType === "DDT") {
                    test.xrayTest.status = this.determineDDTStatus(test)
                }
                this.xrayReport.tests.push(test.xrayTest)
            }

            // Saving report locally
            if (this.xrayReport.tests.length > 0 && (this.options.importType == "MANUAL" || this.options.debug)) {
                await this.saveReportLocally()
                await this.saveInfoLocally()
            }

            if (this.options.importType == "REST") {
                try {
                    await this.xrayService.authenticate()

                    if (!this.options.testPlanKey && (this.options.testExecutionKey && !this.options.newExecution))
                        await this.xrayService.uploadExecution(this.xrayReport)
                    else
                        await this.xrayService.uploadMultipartExec(this.info, this.xrayReport)
                } catch (error) {
                    if (error instanceof Error) {
                        Logger.error(error.message)
                    }
                }
            }
        }
    }
}

process.addListener("SIGINT", () => {
    interrupted = true
})
