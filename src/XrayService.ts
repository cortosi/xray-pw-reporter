import { Logger } from "./Logger"
import { ReporterOptions } from "./types/ReporterOptions"
import { XrayImportResponse } from "./types/Xray/XrayImportResponse"
import { XrayJson } from "./types/Xray/XrayJson"
import { XrayInfoMultipart } from "./types/Xray/XrayInfoMultipart"
import { XrayReport } from "./types/Xray/XrayReport"

/**
 * Service class to interact with the Xray API for managing test executions and results.
 */
export default class XrayService {
    // Stores the authentication token after successful login
    private authToken: string = ''

    // Regex to extract the Jira base URL from a given URL
    private JIRA_URL_REGEX = /https:\/\/([^.\/]+\.atlassian\.net)/

    /**
     * Constructor to initialize the service with reporter options.
     * @param options - The configuration options for the Xray integration.
     */
    constructor(private options: ReporterOptions) { }

    /**
     * Extracts the Jira base URL from a given URL using a regex.
     * @param url - The URL from which to extract the Jira base URL.
     * @returns The extracted Jira URL, or undefined if not found.
     */
    private async extractJiraURL(url: string) {
        const result = url.match(this.JIRA_URL_REGEX)
        return result ? result[1] : undefined
    }

    /**
     * Authenticates with the Xray API using the client ID and secret provided in the options.
     * Throws an error if authentication fails.
     */
    async authenticate() {
        const AUTH_ENDPOINT = "https://xray.cloud.getxray.app/api/v2/authenticate"

        const response = await fetch(AUTH_ENDPOINT, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: this.options.xrayClientID,
                client_secret: this.options.xraySecret,
            }),
        })

        if (response.status !== 200) {
            if (response.status === 401) {
                throw new Error(
                    `⛔️ Authentication error: Check the client_id and client_secret.\n`
                )
            } else {
                throw new Error(
                    `⛔️ Authentication error: ${response.status} - ${response.statusText}\n`
                )
            }
        }

        // Save the authentication token for future requests
        this.authToken = await response.json()
        Logger.log(`⚡ Successfully authenticated to Xray API. ⚡`)
    }

    /**
     * Uploads a test execution report to the Xray API.
     * @param report - The test execution report in JSON format.
     * @param cardData - Optional data for MS Teams webhook integration.
     * @returns The Jira issue URL of the execution created or updated.
     */
    async uploadExecution(report: XrayJson): Promise<string> {
        const IMPORT_ENDPOINT = "https://xray.cloud.getxray.app/api/v2/import/execution"

        const response = await fetch(IMPORT_ENDPOINT, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.authToken}`,
            },
            body: JSON.stringify(report),
        })

        if (response.status !== 200) {
            throw new Error(
                `⛔️ Error importing execution to Xray: ${response.status} - ${await response.text()}\n`
            )
        }

        const jsonResponse: XrayImportResponse = await response.json()
        const jiraUrl = await this.extractJiraURL(jsonResponse.self)
        const jiraIssueURL = `https://${jiraUrl}/browse/${jsonResponse.key}`

        // Log different scenarios based on the provided testExecutionKey
        if (this.options.testExecutionKey) {
            if (this.options.testExecutionKey !== jsonResponse.key) {
                Logger.log(`⚠️ Execution key mismatch. New execution created: ${jsonResponse.key} -> ${jiraIssueURL}`)
            } else {
                Logger.log(`✅ Results imported to Execution: ${jsonResponse.key} -> ${jiraIssueURL}`)
            }
        } else {
            Logger.log(`✅ New Execution created: ${jsonResponse.key} -> ${jiraIssueURL}`)
        }

        return jiraIssueURL
    }

    /**
     * Uploads a test execution report to the Xray API using a multipart request.
     * @param info - Metadata describing the execution issue.
     * @param results - The test execution results.
     * @returns The Jira issue URL of the execution created or updated.
     */
    async uploadMultipartExec(info: XrayInfoMultipart, results: XrayReport): Promise<string> {
        const IMPORT_MULTIPART_ENDPOINT = "https://xray.cloud.getxray.app/api/v2/import/execution/multipart"

        const formData = new FormData()
        formData.append("info", new Blob([JSON.stringify(info)], { type: "application/json" }), "info.json")
        formData.append("results", new Blob([JSON.stringify(results)], { type: "application/json" }), "results.json")

        const response = await fetch(IMPORT_MULTIPART_ENDPOINT, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Authorization": `Bearer ${this.authToken}`,
            },
            body: formData,
        })

        if (response.status !== 200) {
            throw new Error(
                `⛔️ Error importing multipart execution to Xray: ${response.status} - ${await response.text()}\n`
            )
        }

        const jsonResponse = await response.json()
        const jiraUrl = await this.extractJiraURL(jsonResponse.self)
        const newJiraIssueURL = `https://${jiraUrl}/browse/${jsonResponse.key}`

        // Log details based on the presence of a test plan
        if (this.options.testPlanKey) {
            Logger.log(`✅ Results imported to Test Plan: ${info.xrayFields?.testPlanKey}, new Execution: ${jsonResponse.key} -> ${newJiraIssueURL}`)
        } else {
            Logger.log(`✅ Results imported to a new Execution: ${jsonResponse.key} -> ${newJiraIssueURL}`)
        }

        return newJiraIssueURL
    }
}
