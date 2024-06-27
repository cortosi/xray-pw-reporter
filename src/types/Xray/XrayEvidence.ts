/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export default interface XrayEvidence {
    /**
     * The attachment data encoded in base64
     */
    data?: string

    /**
     * The file name for the attachment
     */
    filename?: string

    /**
     * The Content-Type representation header is used to indicate the original media type of the resource
     */
    contentType?: string
}