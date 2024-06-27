import { xrayErrorLog, xrayLog } from "./Logger";
import { ReporterOptions } from ".";
import { XrayImportResponse } from "./types/Xray/XrayImportResponse";
import { XrayJson } from "./types/Xray/XrayJson";

process.on('SIGINT', async () => {
    process.exit(0); // Uscita dal processo con successo
});

export default class XrayService {
    private authToken: string = '';
    private JIRA_URL_REGEX = /https:\/\/([^.\/]+\.atlassian\.net)/

    constructor(private options: ReporterOptions) { }

    private async extractJiraURL(url: string) {
        const result = url.match(this.JIRA_URL_REGEX)

        if (result) {
            return result[1]
        }
    }

    async authenticate(): Promise<void> {
        process.stdout.write(xrayLog("-------------------------------------------------------\n⚡ XRAY-INTEGRATOR -> Authenticating to Xray Server..."))

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
                throw new Error(xrayErrorLog("⛔️ XRAY-INTEGRATOR -> error while authenticating to Xray Server. Check the client_id and client_secret⚡\n-------------------------------------------------------\n"))
            else
                throw new Error(xrayErrorLog(`⛔️ XRAY-INTEGRATOR -> error while authenticating to Xray Server. ${response.status} -> ${response.statusText}⚡\n-------------------------------------------------------\n`))
        } else {
            this.authToken = await response.json()
            console.log(xrayLog('\n\t\t\tAuthenticated successfully.⚡\n-------------------------------------------------------\n'))
        }
    }

    async uploadExecution(report: XrayJson): Promise<void> {
        console.log(xrayLog("\n-----------------------------------------------------------------------"))
        process.stdout.write(xrayLog(`⚡ XRAY-INTEGRATOR -> Uploading execution result to Xray...`))

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
            throw new Error(xrayErrorLog(` error while Importing to Xray Server. ${response.status} -> ${response.statusText}⚡\n`))
        } else {
            const jsonResponse: XrayImportResponse = await response.json()

            console.log(xrayLog(" Import OK⚡"))
            console.log(xrayLog("-----------------------------------------------------------------------"))

            if (this.options.testExecutionKey && jsonResponse.key != this.options.testExecutionKey)
                console.log(xrayErrorLog(`⚡ Execution Issue: "${this.options.testExecutionKey}" does not exist. A new issue has been created⚡\n`))

            console.log(xrayLog("--------------------------------------"))
            console.log(xrayLog("⚡ EXECUTION SUCCESSFULLY IMPORTED ⚡"))
            console.log(xrayLog("--------------------------------------"))

            const jiraUrl = await this.extractJiraURL(jsonResponse.self)

            console.log((`\n\t ❇️  Results imported in the issue: ${jsonResponse.key} -> https://${jiraUrl}/browse/${jsonResponse.key}❇️\n`))
        }
    }
}
