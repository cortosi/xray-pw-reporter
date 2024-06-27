/**
 * https://docs.getxray.app/display/XRAYCLOUD/Using+Xray+JSON+format+to+import+execution+results
 */
export interface XrayStepDef {
    /**
     * The step action - native field
     */
    action: string,

    /**
     * The step data - native field
     */
    data: string,

    /**
     * The step expected result - native field
     */
    result: string
}