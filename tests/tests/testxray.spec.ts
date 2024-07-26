// import { test } from "@playwright/test"
import { dataset as ds110 } from "../data/datasets/prov-8.dataset.json"
import { dataset as ds111 } from "../data/datasets/prov-9.dataset.json"
import { dataset as ds112 } from "../data/datasets/prov-10.dataset.json"
import { dataset as ds113 } from "../data/datasets/prov-11.dataset.json"
import { expect, test } from "@playwright/test"

test.describe('', { tag: "@testxray" }, () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("https://www.google.com/")
    })

    /**
     * @JiraIssue PROV-2
     */
    test('Test with step loops', async ({ page }) => {
        await test.step('Validation', async () => {
            await expect.poll(async () => {
                await test.step('Step Loop', async () => {

                })
                return 0
            }).toBe(1)
        })
    })

    /**
     * @JiraIssue PROV-3
     */
    test('Test that passes without steps', async ({ page }) => {
        // No steps defined
    })

    /**
     * @JiraIssue PROV-4
     */
    test('Test that passes with a single step', async ({ page }) => {
        await test.step('Step 1', async () => {
            // Implementation of step 1
        })
    })

    /**
     * @JiraIssue PROV-5
     */
    test('Test that passes with multiple steps', async ({ page }) => {
        await test.step('Step 1', async () => {
            // Implementation of step 1
        })
        await test.step('Step 2', async () => {
            // Implementation of step 2
        })
    })

    /**
     * @JiraIssue PROV-6
     */
    test('Test that fails without steps', async ({ page }) => {
        throw new Error('Test error')
    })

    /**
     * @JiraIssue PROV-7
     */
    test('Test with one passing step and one failing step', async ({ page }) => {
        await test.step('Step 1', async () => {
            // Implementation of step 1
        })
        await test.step('Step 2', async () => {
            throw new Error('Error in step 2')
        })
    })

    test.describe.serial(() => {
        /**
         * @JiraIssue PROV-12
         */
        test('Serial test that passes (1)', async ({ page }) => {
            await test.step('Step 1', async () => {
            })
            await test.step('Step 2', async () => {
            })
        })

        /**
         * @JiraIssue PROV-13
         */
        test('Serial test that fails (2)', async ({ page }) => {
            await test.step('Step 1', async () => {
                throw Error("Error in step 1")
            })
        })

        /**
         * @JiraIssue PROV-14
         */
        test('Serial test that it is skipped due previous failure (3)', async ({ page }) => {
            await test.step('Step 1', async () => {
                throw Error("Error in step 1")
            })
        })
    })

    // DDTS
    ds110.forEach((item, index) => {
        /**
         * @DDT PROV-8
         */
        test(`Data-driven test that passes without steps -> Iteration ${index + 1}`, async ({ page }) => {
            // No steps defined
        })
    })

    ds111.forEach((item, index) => {
        /**
         * @DDT PROV-9
         */
        test(`Data-driven test with a single step -> Iteration ${index + 1}`, async ({ page }) => {
            await test.step('Step 1', async () => {
                // Implementation of step 1
            })
        })
    })

    ds112.forEach((item, index) => {
        /**
         * @DDT PROV-10
         */
        test(`Data-driven test with multiple steps -> Iteration ${index + 1}`, async ({ page }) => {
            await test.step('Step 1', async () => {
                // Implementation of step 1
            })
            await test.step('Step 2', async () => {
                // Implementation of step 2
            })
        })
    })

    ds113.forEach((item, index) => {
        /**
         * @DDT PROV-11
         */
        test(`Data-driven test with mixed iterations (2 fails) -> Iteration ${index + 1}`, async ({ page }) => {
            await test.step('Step 1', async () => {
                // Implementation of step 1
            })
            await test.step('Step 2', async () => {
                if (index === 1) { // Fails only on the second iteration
                    throw new Error('Error in step 2 of the second iteration')
                }
            })
        })
    })

    // ds113.forEach((item, index) => {
    //     /**
    //      * @DDT PROV-114
    //      */
    //     test(`Data-driven test with mixed stepss -> Iteration ${index + 1}`, async ({ page }) => {
    //         await test.step('Step 1', async () => {
    //             // Implementation of step 1
    //         })
    //         await test.step('Step 2', async () => {
    //             if (index === 1) { // Fails only on the second iteration
    //                 throw new Error('Error in step 2 of the second iteration')
    //             }
    //         })
    //     })
    // })
})


