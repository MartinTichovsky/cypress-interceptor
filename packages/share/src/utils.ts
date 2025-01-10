import {
    BodyFormatFetch,
    BodyFormatXHR,
    ResponseCatchType
} from "cypress-interceptor-server/src/types";

export const createMatcher =
    (subject: Record<string, string | number>, strictMatch = false) =>
    (query: Record<string, string | string[] | number>) =>
        Object.keys(subject).every((key) => key in query && query[key] === subject[key])
            ? strictMatch
                ? Object.keys(query).every((key) => key in subject && query[key] === subject[key])
                : true
            : false;

export const formDataOrURLSearchParamsToObject = (formData: FormData | URLSearchParams) => {
    const obj: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
        obj[key] = value;
    }

    return obj;
};

export const isObject = (val: unknown): val is Record<string, unknown> =>
    typeof val === "object" && !Array.isArray(val) && val !== null;

export const fireRequest = () => cy.get("#fire_request").click();

export const objectIncludes = (
    object1: Record<string, unknown> | undefined,
    object2: Record<string, unknown>
) =>
    Object.keys(object2).every((key) => object1 && key in object1 && object1[key] === object2[key]);

export const objectToFormData = (data: Record<string, unknown>) => {
    const formData = new FormData();

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            formData.append(key, data[key] as string | Blob);
        }
    }

    return formData;
};

export const objectToURLSearchParams = (data: Record<string, unknown>) => {
    const params = new URLSearchParams();

    for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            params.append(key, data[key] as string);
        }
    }
    return params;
};

export const convertToRequestBody = (
    body: Record<string, unknown>,
    bodyFormat: BodyFormatFetch | BodyFormatXHR
) => {
    switch (bodyFormat) {
        case "document": {
            const parser = new DOMParser();
            const xml = `<root>${Object.entries(body)
                .map(([key, value]) => `<${key}>${String(value)}</${key}>`)
                .join("")}</root>`;

            return new XMLSerializer().serializeToString(
                parser.parseFromString(xml, "application/xml")
            );
        }
        case "formdata":
            return JSON.stringify(formDataOrURLSearchParamsToObject(objectToFormData(body)));
        case "urlencoded":
            return JSON.stringify(formDataOrURLSearchParamsToObject(objectToURLSearchParams(body)));
        default:
            return JSON.stringify(body);
    }
};

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
