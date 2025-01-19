import { ReporterOptions } from "./types/ReporterOptions"
import { TeamsWebhookData } from "./types/ms/TeamsWebhookData"

/**
 * Service class for sending data to a Microsoft Teams webhook.
 * This is used to post test execution results or other updates to a Teams channel.
 */
export default class MSTeamsWebhookService {
    /**
     * Creates an instance of MSTeamsWebhookService.
     * @param options - The reporter options, including the Teams webhook URL.
     */
    constructor(private readonly options: ReporterOptions) { }

    /**
     * Sends a payload to the Microsoft Teams webhook.
     * @param payload - The data to be sent to the webhook.
     * @throws {Error} If the POST request fails or the response status is not OK.
     */
    async sendWebhookData(payload: TeamsWebhookData) {
        const response = await fetch(this.options.teamsWebhook, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload), // Convert the payload to a JSON string
        })

        if (!response.ok)
            throw new Error(`${"-".repeat(99)}\n⛔️ XRAY-PW-REPORTER -> Error while sending POST request to the webhook\n${"-".repeat(99)}\n`)
    }
}
