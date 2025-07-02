import {
    BodyFormatFetch,
    BodyFormatXHR,
    ResponseCatchType
} from "cypress-interceptor-server/src/types";

import { getResponseHeaders } from "./selectors";

export enum XMLHttpRequestLoad {
    AddEventListener_Load = "`addEventListener` - load",
    AddEventListener_Readystatechange = "`addEventListener` - readystatechange",
    Onload = "`onreadystatechange`",
    Onreadystatechange = "`onload`"
}

type XMLHttpRequestTestFunction = (
    onResponse: (request: XMLHttpRequest, resolve: VoidFunction) => void
) => void;

export const checkResponseHeaders = (id: string, mockHeaders: { [key: string]: string }) =>
    getResponseHeaders(id).then((headers: [[string, string]] | undefined) =>
        cy.wrap(
            headers &&
                Object.keys(mockHeaders).every((key) =>
                    headers.find(
                        ([headerKey, headerValue]) =>
                            headerKey === key && headerValue === mockHeaders[key]
                    )
                )
        )
    );

export const createMatcher =
    (subject: Record<string, string | number>, strictMatch = false) =>
    (query: Record<string, string | string[] | number>) =>
        Object.keys(subject).every((key) => key in query && query[key] === subject[key])
            ? strictMatch
                ? Object.keys(query).every((key) => key in subject && query[key] === subject[key])
                : true
            : false;

export const createXMLHttpRequestTest = (
    testName: string,
    testFunction: XMLHttpRequestTestFunction,
    filter?: XMLHttpRequestLoad[]
) => {
    Object.values(XMLHttpRequestLoad)
        .filter((value) => (filter ? filter.includes(value) : true))
        .forEach((value) => {
            it(`${testName} - ${value}`, () =>
                createXMLHttpRequestTestFunction(testFunction, value));
        });
};

export const createXMLHttpRequestTestOnly = (
    testName: string,
    testFunction: XMLHttpRequestTestFunction,
    filter?: XMLHttpRequestLoad[]
) => {
    Object.values(XMLHttpRequestLoad)
        .filter((value) => (filter ? filter.includes(value) : true))
        .forEach((value) => {
            it["only"](`${testName} - ${value}`, () =>
                createXMLHttpRequestTestFunction(testFunction, value)
            );
        });
};

const createXMLHttpRequestTestFunction = (
    testFunction: XMLHttpRequestTestFunction,
    value: XMLHttpRequestLoad
) =>
    testFunction((request, resolve) => {
        switch (value) {
            case XMLHttpRequestLoad.AddEventListener_Load:
                request.addEventListener("load", () => {
                    resolve();
                });

                return;
            case XMLHttpRequestLoad.AddEventListener_Readystatechange:
                request.addEventListener("readystatechange", () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        resolve();
                    }
                });

                return;
            case XMLHttpRequestLoad.Onload:
                request.onload = () => {
                    resolve();
                };

                return;
            case XMLHttpRequestLoad.Onreadystatechange:
                request.onreadystatechange = () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        resolve();
                    }
                };

                return;
        }
    });

export const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && !Array.isArray(val) && val !== null;

export const fireRequest = () => cy.get("#fire_request").click();

export const objectIncludes = (
    object1: Record<string, unknown> | undefined,
    object2: Record<string, unknown>
) =>
    Object.keys(object2).every((key) => object1 && key in object1 && object1[key] === object2[key]);

const testCases: {
    bodyFormats: (BodyFormatFetch | BodyFormatXHR)[];
    resourceType: "fetch" | "xhr";
    responseCatchTypes: (ResponseCatchType | undefined)[];
}[] = [
    {
        bodyFormats: ["blob", "formdata", "json", "urlencoded"],
        resourceType: "fetch",
        responseCatchTypes: [undefined]
    },
    {
        bodyFormats: ["arraybuffer", "blob", "document", "formdata", "typedarray", "urlencoded"],
        resourceType: "xhr",
        responseCatchTypes: [undefined]
    },
    {
        bodyFormats: ["json"],
        resourceType: "xhr",
        responseCatchTypes: ["addEventListener", "onload", "onreadystatechange"]
    }
];

export const resourceTypeDescribe = (
    name: string,
    execution: (
        resourceType: "fetch" | "xhr",
        resourceTypeSecondary: "fetch" | "xhr",
        testName: (name: string) => string
    ) => void
) => {
    const resourceTypes: ("fetch" | "xhr")[] = ["fetch", "xhr"];

    resourceTypes.forEach((resourceType, index) => {
        const testName = (name: string) => `${name} [resourceType='${resourceType}']`;

        describe(testName(name), () =>
            execution(
                resourceType,
                resourceTypes[index === 0 ? resourceTypes.length - 1 : index - 1],
                testName
            )
        );
    });
};

export const resourceTypeDescribeOnly = (
    name: string,
    execution: (
        resourceType: "fetch" | "xhr",
        resourceTypeSecondary: "fetch" | "xhr",
        testName: (name: string) => string
    ) => void,
    filter?: ("fetch" | "xhr")[]
) => {
    let resourceTypes: ("fetch" | "xhr")[] = ["fetch", "xhr"];

    if (filter) {
        resourceTypes = resourceTypes.filter((value) => filter.includes(value));
    }

    resourceTypes.forEach((resourceType, index) => {
        const testName = (name: string) => `${name} [resourceType='${resourceType}']`;

        describe.only(testName(name), () =>
            execution(
                resourceType,
                resourceTypes[index === 0 ? resourceTypes.length - 1 : index - 1],
                testName
            )
        );
    });
};

export const resourceTypeIt = (
    name: string,
    execution: (resourceType: "fetch" | "xhr", resourceTypeSecondary: "fetch" | "xhr") => void
) => {
    const resourceTypes: ("fetch" | "xhr")[] = ["fetch", "xhr"];

    resourceTypes.forEach((resourceType, index) => {
        const testName = (name: string) => `${name} [resourceType='${resourceType}']`;

        it(testName(name), () =>
            execution(
                resourceType,
                resourceTypes[index === 0 ? resourceTypes.length - 1 : index - 1]
            )
        );
    });
};

export const resourceTypeOnly = (
    name: string,
    execution: (resourceType: "fetch" | "xhr", resourceTypeSecondary: "fetch" | "xhr") => void,
    filter?: ("fetch" | "xhr")[]
) => {
    let resourceTypes: ("fetch" | "xhr")[] = ["fetch", "xhr"];

    if (filter) {
        resourceTypes = resourceTypes.filter((value) => filter.includes(value));
    }

    resourceTypes.forEach((resourceType, index) => {
        const testName = (name: string) => `${name} [resourceType='${resourceType}']`;

        it.only(testName(name), () =>
            execution(
                resourceType,
                resourceTypes[index === 0 ? resourceTypes.length - 1 : index - 1]
            )
        );
    });
};

export const testCaseDescribe = (
    name: string,
    execution: (
        resourceType: "fetch" | "xhr",
        bodyFormat: BodyFormatFetch | BodyFormatXHR,
        responseCatchType: ResponseCatchType | undefined,
        testName: (name: string) => string
    ) => void
) => {
    testCases.forEach(({ bodyFormats, resourceType, responseCatchTypes }) =>
        bodyFormats.forEach((bodyFormat) =>
            responseCatchTypes.forEach((responseCatchType) => {
                const testName = (name: string) =>
                    `${name} [resourceType='${resourceType}'] [bodyFormat='${bodyFormat}']${responseCatchType ? ` [responseCatchType='${responseCatchType}']` : ""}`;

                describe(testName(name), () =>
                    execution(resourceType, bodyFormat, responseCatchType, testName)
                );
            })
        )
    );
};

export const testCaseIt = (
    name: string,
    execution: (
        resourceType: "fetch" | "xhr",
        bodyFormat: BodyFormatFetch | BodyFormatXHR,
        responseCatchType: ResponseCatchType | undefined
    ) => void
) => {
    testCases.forEach(({ bodyFormats, resourceType, responseCatchTypes }) =>
        bodyFormats.forEach((bodyFormat) =>
            responseCatchTypes.forEach((responseCatchType) => {
                const testName = (name: string) =>
                    `${name} [resourceType='${resourceType}'] [bodyFormat='${bodyFormat}']${responseCatchType ? ` [responseCatchType='${responseCatchType}']` : ""}`;

                it(testName(name), () => execution(resourceType, bodyFormat, responseCatchType));
            })
        )
    );
};

export const toRegExp = (value: string) => value.replace(/\//g, "\\/").replace(/\./g, "\\.");

export const wait = async (timeout: number) =>
    new Promise((resolve) => setTimeout(resolve, timeout));

export const wrap = (fnc: VoidFunction) => cy.wrap(null).then(fnc);
