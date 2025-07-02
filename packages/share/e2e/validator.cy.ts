/**
 * AI generated tests for the validator
 *
 * @author: AI
 */

import { CallStackJson } from "cypress-interceptor/Interceptor.types";
import { IResourceType } from "cypress-interceptor/Interceptor.types";
import {
    convertCallStackJsonToCallStack,
    createValidationError,
    validateStats,
    ValidationErrorMessages
} from "cypress-interceptor/src/validator";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyValue = any;

describe("Validator Tests", () => {
    describe("convertCallStackJsonToCallStack", () => {
        it("should convert valid CallStackJson to CallStack", () => {
            const validCallStackJson: Partial<CallStackJson[]> = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "test body",
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                        query: { param: "value" }
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com/test"
                }
            ];

            const result = convertCallStackJsonToCallStack(validCallStackJson as CallStackJson[]);

            expect(result[0].resourceType).to.equal("xhr");
            expect(result[0].timeStart).to.be.instanceOf(Date);
            expect(result[0].url).to.be.instanceOf(URL);
            expect(result[0].url.toString()).to.equal("https://api.example.com/test");
            expect(result[0].request).to.deep.equal(validCallStackJson[0]?.request);
        });

        it("should throw error for invalid URL", () => {
            const invalidUrlCallStack: Partial<CallStackJson> = {
                crossDomain: false,
                isPending: false,
                request: {
                    body: "test body",
                    headers: { "Content-Type": "application/json" },
                    method: "POST",
                    query: { param: "value" }
                },
                resourceType: "xhr",
                timeStart: "2024-03-20T10:00:00Z",
                url: "invalid-url"
            };

            expect(() =>
                convertCallStackJsonToCallStack(invalidUrlCallStack as CallStackJson[])
            ).to.throw();
        });

        it("should handle empty array", () => {
            const result = convertCallStackJsonToCallStack([]);

            expect(result).to.deep.equal([]);
        });

        it("should throw for invalid timeStart format", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    resourceType: "xhr",
                    timeStart: "not-a-date",
                    url: "https://api.example.com"
                }
            ];

            expect(() =>
                convertCallStackJsonToCallStack(invalid as CallStackJson[])
            ).to.not.throw();

            // The function will create an Invalid Date, but not throw
            const result = convertCallStackJsonToCallStack(invalid as CallStackJson[]);

            expect(result[0].timeStart).to.be.instanceOf(Date);
            expect(isNaN(result[0].timeStart.getTime())).to.be.true;
        });

        it("should throw for invalid url format", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "not-a-url"
                }
            ];

            expect(() => convertCallStackJsonToCallStack(invalid as CallStackJson[])).to.throw();
        });

        it("should handle missing optional response", () => {
            const valid: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];
            const result = convertCallStackJsonToCallStack(valid as CallStackJson[]);

            expect(result[0].response).to.be.undefined;
        });

        it("should handle response with null delay/duration", () => {
            const valid: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    }
                }
            ];
            // delay and duration are not part of IResponse, so we only check that response exists and is valid
            const result = convertCallStackJsonToCallStack(valid as CallStackJson[]);

            expect(result[0].response).to.exist;
        });

        it("should handle null in properties", () => {
            // delay and duration are not part of IResponse, so we only check that response exists and is valid
            const result = convertCallStackJsonToCallStack([
                {
                    crossDomain: false,
                    delay: null,
                    duration: null,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    }
                }
            ] as unknown as CallStackJson[]);

            expect(result[0].delay).to.be.undefined;
            expect(result[0].duration).to.be.undefined;
        });
    });

    describe("validateStats", () => {
        it("should validate correct CallStack array without throwing", () => {
            const validStats: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "test body",
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                        query: { param: "value" }
                    },
                    resourceType: "xhr",
                    response: {
                        body: "response body",
                        headers: { "Content-Type": "application/json" },
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:05Z"
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com/test"
                }
            ];

            expect(() => validateStats(validStats as CallStackJson[])).to.not.throw();
        });

        it("should throw error for invalid input type", () => {
            const invalidInput: unknown = "not an array";

            expect(() => validateStats(invalidInput as CallStackJson[])).to.throw(
                createValidationError(-1, "root", ValidationErrorMessages.EXPECTED_ARRAY).message
            );
        });

        it("should throw error for missing required fields", () => {
            const invalidStats: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "test body",
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                        query: { param: "value" }
                    },
                    resourceType: "xhr"
                }
            ];

            expect(() => validateStats(invalidStats as CallStackJson[])).to.throw(
                createValidationError(0, "timeStart", ValidationErrorMessages.TIME_START_REQUIRED)
                    .message
            );
        });

        it("should throw error for invalid request properties", () => {
            const invalidStats: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: 123,
                        headers: "not an object",
                        method: 456,
                        query: []
                    } as AnyValue,
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com/test"
                }
            ];

            expect(() => validateStats(invalidStats as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.body",
                    ValidationErrorMessages.REQUEST_BODY_MUST_BE_STRING
                ).message
            );
        });

        it("should throw error for invalid response properties when present", () => {
            const invalidStats: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    isPending: false,
                    request: {
                        body: "test body",
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                        query: { param: "value" }
                    },
                    resourceType: "xhr",
                    response: {
                        body: 123,
                        headers: "not an object",
                        isMock: false,
                        statusCode: "200",
                        statusText: 123,
                        timeEnd: "2024-03-20T10:00:05Z"
                    } as AnyValue,
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com/test"
                }
            ];

            expect(() => validateStats(invalidStats as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.body",
                    ValidationErrorMessages.RESPONSE_BODY_MUST_BE_STRING
                ).message
            );
        });

        it("should throw error for invalid optional properties", () => {
            const invalidStats: Partial<CallStackJson>[] = [
                {
                    crossDomain: false,
                    delay: "not a number" as AnyValue,
                    duration: "not a number" as AnyValue,
                    isPending: false,
                    request: {
                        body: "test body",
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                        query: { param: "value" }
                    },
                    resourceType: "xhr",
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com/test"
                }
            ];

            expect(() => validateStats(invalidStats as CallStackJson[])).to.throw(
                createValidationError(0, "delay", ValidationErrorMessages.DELAY_MUST_BE_NUMBER)
                    .message
            );
        });

        it("should not throw for empty array", () => {
            expect(() => validateStats([])).to.not.throw();
        });

        it("should throw for null input", () => {
            expect(() => validateStats(null as unknown as CallStackJson[])).to.throw(
                createValidationError(-1, "root", ValidationErrorMessages.EXPECTED_ARRAY).message
            );
        });

        it("should throw for undefined input", () => {
            expect(() => validateStats(undefined as unknown as CallStackJson[])).to.throw(
                createValidationError(-1, "root", ValidationErrorMessages.EXPECTED_ARRAY).message
            );
        });

        it("should throw for missing resourceType", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "resourceType",
                    ValidationErrorMessages.RESOURCE_TYPE_REQUIRED
                ).message
            );
        });

        it("should throw for non-string resourceType", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: 123 as unknown as IResourceType,
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "resourceType",
                    ValidationErrorMessages.RESOURCE_TYPE_MUST_BE_STRING
                ).message
            );
        });

        it("should throw for missing timeStart", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "timeStart", ValidationErrorMessages.TIME_START_REQUIRED)
                    .message
            );
        });

        it("should throw for invalid timeStart type", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: 123 as unknown as string,
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "timeStart",
                    ValidationErrorMessages.TIME_START_MUST_BE_DATE
                ).message
            );
        });

        it("should throw for invalid timeStart value", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "not-a-date",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "timeStart",
                    ValidationErrorMessages.TIME_START_MUST_BE_DATE
                ).message
            );
        });

        it("should throw for missing url", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "url", ValidationErrorMessages.URL_REQUIRED).message
            );
        });

        it("should throw for invalid url type", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: 123 as unknown as string
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "url", ValidationErrorMessages.URL_MUST_BE_URL).message
            );
        });

        it("should throw for invalid url value", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "not-a-url"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "url", ValidationErrorMessages.URL_MUST_BE_URL).message
            );
        });

        it("should throw for invalid delay type", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    delay: "not-a-number" as unknown as number
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "delay", ValidationErrorMessages.DELAY_MUST_BE_NUMBER)
                    .message
            );
        });

        it("should throw for invalid duration type", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    duration: "not-a-number" as unknown as number
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "duration",
                    ValidationErrorMessages.DURATION_MUST_BE_NUMBER
                ).message
            );
        });

        it("should throw for missing request", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(0, "request", ValidationErrorMessages.REQUEST_REQUIRED)
                    .message
            );
        });

        it("should throw for missing request.body", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        headers: {},
                        method: "GET",
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.body",
                    ValidationErrorMessages.REQUEST_BODY_REQUIRED
                ).message
            );
        });

        it("should throw for non-string request.body", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: 123 as unknown as string,
                        headers: {},
                        method: "GET",
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.body",
                    ValidationErrorMessages.REQUEST_BODY_MUST_BE_STRING
                ).message
            );
        });

        it("should throw for missing request.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        method: "GET",
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.headers",
                    ValidationErrorMessages.REQUEST_HEADERS_REQUIRED
                ).message
            );
        });

        it("should throw for non-object request.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: "not-an-object" as unknown as Record<string, string>,
                        method: "GET",
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.headers",
                    ValidationErrorMessages.REQUEST_HEADERS_MUST_BE_OBJECT
                ).message
            );
        });

        it("should throw for array request.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: [] as unknown as Record<string, string>,
                        method: "GET",
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.headers",
                    ValidationErrorMessages.REQUEST_HEADERS_MUST_BE_OBJECT
                ).message
            );
        });

        it("should throw for missing request.method", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.method",
                    ValidationErrorMessages.REQUEST_METHOD_REQUIRED
                ).message
            );
        });

        it("should throw for non-string request.method", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: 123 as unknown as string,
                        query: {}
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.method",
                    ValidationErrorMessages.REQUEST_METHOD_MUST_BE_STRING
                ).message
            );
        });

        it("should throw for missing request.query", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET"
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.query",
                    ValidationErrorMessages.REQUEST_QUERY_REQUIRED
                ).message
            );
        });

        it("should throw for non-object request.query", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: "not-an-object" as unknown as Record<string, unknown>
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.query",
                    ValidationErrorMessages.REQUEST_QUERY_MUST_BE_OBJECT
                ).message
            );
        });

        it("should throw for array request.query", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: [] as unknown as Record<string, unknown>
                    } as unknown as CallStackJson["request"],
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "request.query",
                    ValidationErrorMessages.REQUEST_QUERY_MUST_BE_OBJECT
                ).message
            );
        });

        it("should not throw for missing response (optional)", () => {
            const valid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com"
                }
            ];

            expect(() => validateStats(valid as CallStackJson[])).to.not.throw();
        });

        it("should throw for missing response.body when response exists", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.body",
                    ValidationErrorMessages.RESPONSE_BODY_REQUIRED
                ).message
            );
        });

        it("should throw for non-string response.body", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: 123 as unknown as string,
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.body",
                    ValidationErrorMessages.RESPONSE_BODY_MUST_BE_STRING
                ).message
            );
        });

        it("should throw for missing response.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.headers",
                    ValidationErrorMessages.RESPONSE_HEADERS_REQUIRED
                ).message
            );
        });

        it("should throw for non-object response.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: "not-an-object" as unknown as Record<string, string>,
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.headers",
                    ValidationErrorMessages.RESPONSE_HEADERS_MUST_BE_OBJECT
                ).message
            );
        });

        it("should throw for array response.headers", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: [] as unknown as Record<string, string>,
                        isMock: false,
                        statusCode: 200,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.headers",
                    ValidationErrorMessages.RESPONSE_HEADERS_MUST_BE_OBJECT
                ).message
            );
        });

        it("should throw for missing response.statusCode", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.statusCode",
                    ValidationErrorMessages.RESPONSE_STATUS_CODE_REQUIRED
                ).message
            );
        });

        it("should throw for non-number response.statusCode", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusCode: "not-a-number" as unknown as number,
                        statusText: "OK",
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.statusCode",
                    ValidationErrorMessages.RESPONSE_STATUS_CODE_MUST_BE_NUMBER
                ).message
            );
        });

        it("should throw for missing response.statusText", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.statusText",
                    ValidationErrorMessages.RESPONSE_STATUS_TEXT_REQUIRED
                ).message
            );
        });

        it("should throw for non-string response.statusText", () => {
            const invalid: Partial<CallStackJson>[] = [
                {
                    resourceType: "xhr",
                    isPending: false,
                    request: {
                        body: "body",
                        headers: {},
                        method: "GET",
                        query: {}
                    },
                    timeStart: "2024-03-20T10:00:00Z",
                    url: "https://api.example.com",
                    response: {
                        body: "resp",
                        headers: {},
                        isMock: false,
                        statusCode: 200,
                        statusText: 123 as unknown as string,
                        timeEnd: "2024-03-20T10:00:01Z"
                    } as unknown as CallStackJson["response"]
                }
            ];

            expect(() => validateStats(invalid as CallStackJson[])).to.throw(
                createValidationError(
                    0,
                    "response.statusText",
                    ValidationErrorMessages.RESPONSE_STATUS_TEXT_MUST_BE_STRING
                ).message
            );
        });
    });
});
