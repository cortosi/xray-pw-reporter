import { XrayTest } from "./Xray/XrayTest"

export class Test {
    private _testKey: string
    private _testType: string

    private _xrayTest: XrayTest = {}

    constructor(testKey: string, testType?: string, xrayTest?: XrayTest) {
        this._testKey = testKey
        this._testType = testType ?? "SD"
        if (!(testKey == "OVERRIDE"))
            this._xrayTest.testKey = testKey
    }

    get xrayTest(): XrayTest {
        return this._xrayTest
    }

    get testKey(): string {
        return this._testKey
    }

    get testType(): string {
        return this._testType
    }
}

export class DDT extends Test {

    constructor(testKey: string) {
        super(testKey, "DDT")
    }
}