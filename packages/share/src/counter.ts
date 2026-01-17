import {
    COUNTER_SERVER_URL,
    I_TEST_ID_HEADER
} from "cypress-interceptor-server/src/resources/constants";
import { RequestServerLog } from "cypress-interceptor-server/src/types";

export const getCounter = (iTestName: string) =>
    cy.request<RequestServerLog[]>({
        headers: {
            [I_TEST_ID_HEADER]: iTestName
        },
        method: "GET",
        url: `${COUNTER_SERVER_URL.GetCounter}`
    });

export const resetCounter = (iTestName: string) =>
    cy.request({
        headers: {
            [I_TEST_ID_HEADER]: iTestName
        },
        method: "POST",
        url: `${COUNTER_SERVER_URL.ResetCounter}`
    });
