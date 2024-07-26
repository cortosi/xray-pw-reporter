import { XrayTest } from "./Xray/XrayTest"

export class Test {
    private _testKey: string
    private _steps: string[] = []
    protected _testType: string

    private _xrayTest: XrayTest = {}

    constructor(testKey: string, xrayTest?: XrayTest) {
        this._testKey = testKey
        this._testType = "SD"
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

    containStep(title: string): boolean {
        return this._steps.includes(title)
    }

    saveStep(title: string): void {
        this._steps.push(title)
    }
}

export class DDT extends Test {

    constructor(testKey: string) {
        super(testKey)
        this._testType = "DDT"
    }
}