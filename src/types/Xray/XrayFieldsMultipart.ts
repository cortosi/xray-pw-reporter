export interface XrayFieldsMultipart {
    assignee: { id: string },
    issuetype: { name: string } | { id: string }
    project: { key: string } | { id: string }
    summary: string,
    [key: string]: any
}