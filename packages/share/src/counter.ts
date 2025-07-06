import {
    COUNTER_SERVER_URL,
    I_TEST_NAME_HEADER
} from "cypress-interceptor-server/src/resources/constants";

export const getCounter = (iTestName: string) =>
    cy.request<string[]>({
        headers: {
            [I_TEST_NAME_HEADER]: iTestName
        },
        method: "GET",
        url: `${COUNTER_SERVER_URL.GetCounter}`
    });

export const resetCounter = (iTestName: string) =>
    cy.request({
        headers: {
            [I_TEST_NAME_HEADER]: iTestName
        },
        method: "POST",
        url: `${COUNTER_SERVER_URL.ResetCounter}`
    });
