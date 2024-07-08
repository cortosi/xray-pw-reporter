import { Logger } from "./Logger"
import { ReporterOptions } from "."
import { XrayImportResponse } from "./types/Xray/XrayImportResponse"
import { XrayJson } from "./types/Xray/XrayJson"
import { XrayInfoMultipart } from "./types/Xray/XrayInfoMultipart"
import { XrayReport } from "./types/Xray/XrayReport"

export default class XrayService {
    private authToken: string = ''
    private JIRA_URL_REGEX = /https:\/\/([^.\/]+\.atlassian\.net)/

    constructor(private options: ReporterOptions) { }

    private async extractJiraURL(url: string) {
        const result = url.match(this.JIRA_URL_REGEX)

        if (result) {
            return result[1]
        }
    }

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
            body: JSON.stringify({ client_id: this.options.xrayClientID, client_secret: this.options.xraySecret }),
        })


        if (response.status !== 200) {
            if (response.status === 401)
                throw new Error(`${"-".repeat(103)}\n⛔️ XRAY-PW-REPORTER -> error while authenticating to Xray Server. Check the client_id and client_secret\n${"-".repeat(103)}\n`)
            else
                throw new Error(`${"-".repeat(85)}\n⛔️ XRAY-PW-REPORTER -> error while authenticating to Xray Server. ${response.status} -> ${response.statusText}\n${"-".repeat(85)}\n`)
        } else {
            this.authToken = await response.json()
        }

        Logger.log(`${"-".repeat(47)}\n⚡ XRAY-PW-REPORTER -> Authenticated to Xray.⚡\n${"-".repeat(47)}`)
    }

    async uploadExecution(report: XrayJson): Promise<void> {
        const IMPORT_ENDPOINT = "https://xray.cloud.getxray.app/api/v2/import/execution"

        const response = await fetch(IMPORT_ENDPOINT, {
            method: "POST",
            mode: "cors",
            cache: "no-cache",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.authToken}`
            },
            body: JSON.stringify(report),
        })

        if (response.status !== 200) {
            throw new Error(`⛔️ Error while importing to Xray Server.\n⛔️ Status Code: ${response.status} -> ${await response.text()}\n`)
        } else {
            const jsonResponse: XrayImportResponse = await response.json()

            const jiraUrl = await this.extractJiraURL(jsonResponse.self)

            if (this.options.testExecutionKey) {
                if (this.options.testExecutionKey != jsonResponse.key)
                    Logger.log(`❇️  ⚠️  Execution Issue with key: ${this.options.testExecutionKey} does not exist, a new execution will host the results: ${jsonResponse.key} ⚠️   -> https://${jiraUrl}/browse/${jsonResponse.key} ❇️\n`)
                else
                    Logger.log(`❇️  Results imported in the Execution: ${jsonResponse.key} -> https://${jiraUrl}/browse/${jsonResponse.key} ❇️\n`)
            } else
                Logger.log(`❇️  New Execution created: ${jsonResponse.key} -> https://${jiraUrl}/browse/${jsonResponse.key} ❇️\n`)
        }
    }

    async uploadMultipartExec(info: XrayInfoMultipart, results: XrayReport) {
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
                "Authorization": `Bearer ${this.authToken}`
            },
            body: formData,
        })

        if (response.status !== 200) {
            throw new Error(`⛔️ Error while importing to Xray Server (multipart).\n⛔️ Status Code: ${response.status} -> ${await response.text()}\n`)
        } else {
            const jsonResponse = await response.json()

            const jiraUrl = await this.extractJiraURL(jsonResponse.self)

            if (this.options.testPlanKey)
                Logger.log((`❇️  Results imported in Plan: ${info.xrayFields?.testPlanKey}, new Execution issue: ${jsonResponse.key} -> https://${jiraUrl}/browse/${jsonResponse.key} ❇️\n`))
            else {
                const newExec: string = jsonResponse.key
                Logger.log((`❇️  Results imported in a new Execution: ${newExec} -> https://${jiraUrl}/browse/${jsonResponse.key} ❇️\n`))
            }
        }
    }
}
