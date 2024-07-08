import { XrayFields } from "./XrayFields";
import { XrayFieldsMultipart } from "./XrayFieldsMultipart";

export interface XrayInfoMultipart {
    xrayFields?: XrayFields,
    fields: XrayFieldsMultipart
}