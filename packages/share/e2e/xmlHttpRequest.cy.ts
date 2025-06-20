/**
 * AI generated tests (manually edited)
 */

import { SERVER_URL } from "cypress-interceptor-server/src/resources/constants";
import { getParamsFromDynamicRequest } from "cypress-interceptor-server/src/resources/dynamic";

const createTests = (disableInterceptor: boolean) => {
    beforeEach(() => {
        if (disableInterceptor) {
            cy.destroyInterceptor();

            cy.window().then(async (win) => {
                expect("originFetch" in win).to.eq(false);
                expect("originXMLHttpRequest" in win).to.eq(false);
            });
        }
    });

    describe(`XMLHttpRequest with interceptor ${disableInterceptor ? "disabled" : "enabled"}`, () => {
        beforeEach(() => {
            cy.visit("/");
        });

        it("should handle GET request with response body and headers", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const responseBody = { message: "GET request successful", data: [1, 2, 3] };
                    const responseHeaders = {
                        "X-Custom-Header": "test-value"
                    };
                    const responseStatus = 200;

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/users",
                        responseBody,
                        responseHeaders,
                        status: responseStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.send();

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(responseStatus);
                        expect(xhr.statusText).to.equal("OK");

                        const responseData = JSON.parse(xhr.responseText);
                        expect(responseData).to.deep.equal(responseBody);

                        expect(xhr.getResponseHeader("X-Custom-Header")).to.equal(
                            responseHeaders["X-Custom-Header"]
                        );

                        resolve();
                    };
                });
            });
        });

        it("should handle POST request with request body and custom headers", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { name: "John Doe", email: "john@example.com" };
                    const requestHeaders = {
                        Authorization: "Bearer token123",
                        "X-API-Key": "api-key-456"
                    };
                    const responseBody = { id: 1, created: true };
                    const responseStatus = 201;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: "/api/users/create",
                        responseBody,
                        responseHeaders: undefined,
                        status: responseStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.setRequestHeader("Authorization", requestHeaders["Authorization"]);
                    xhr.setRequestHeader("X-API-Key", requestHeaders["X-API-Key"]);

                    xhr.send(JSON.stringify(requestBody));

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(responseStatus);
                        expect(xhr.statusText).to.equal("Created");

                        const responseData = JSON.parse(xhr.responseText);
                        expect(responseData).to.deep.equal(responseBody);

                        resolve();
                    };
                });
            });
        });

        it("should handle POST request with query parameters (like PUT)", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { status: "active", priority: "high" };
                    const queryParams = { userId: "123", version: "v2", action: "update" };
                    const responseStatus = 200;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: queryParams,
                        method: "POST",
                        path: "/api/users/update",
                        responseBody: undefined,
                        responseHeaders: undefined,
                        status: responseStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(responseStatus);
                        expect(xhr.readyState).to.equal(4); // DONE
                        resolve();
                    };
                });
            });
        });

        it("should handle POST request for deletion and test readyState changes", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const expectedStatus = 204;
                    const readyStates: number[] = [];
                    const requestBody = { action: "delete", confirm: true };

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: "/api/users/456/delete",
                        responseBody: undefined,
                        responseHeaders: undefined,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.onreadystatechange = () => {
                        readyStates.push(xhr.readyState);

                        if (xhr.readyState === 4) {
                            expect(xhr.status).to.equal(expectedStatus);
                            expect(readyStates).to.include.members([1, 2, 4]);
                            resolve();
                        }
                    };

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));
                });
            });
        });

        it("should handle error responses (404 Not Found)", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const expectedStatus = 404;
                    const errorResponseBody = { error: "Resource not found", code: "NOT_FOUND" };

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/nonexistent",
                        responseBody: errorResponseBody,
                        responseHeaders: undefined,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.send();

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(expectedStatus);
                        expect(xhr.statusText).to.equal("Not Found");

                        const errorData = JSON.parse(xhr.responseText);
                        expect(errorData).to.deep.equal(errorResponseBody);

                        resolve();
                    };
                });
            });
        });

        it("should handle server error responses (500 Internal Server Error)", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const expectedStatus = 500;
                    const errorResponseBody = {
                        error: "Internal server error",
                        timestamp: "2024-01-01T00:00:00Z"
                    };

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "POST",
                        path: "/api/error-endpoint",
                        responseBody: errorResponseBody,
                        responseHeaders: undefined,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.send();

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(expectedStatus);
                        expect(xhr.statusText).to.equal("Internal Server Error");

                        const errorData = JSON.parse(xhr.responseText);
                        expect(errorData).to.deep.equal(errorResponseBody);

                        resolve();
                    };
                });
            });
        });

        it("should handle POST request with complex response headers (like PATCH)", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { field: "updated-value", operation: "patch" };
                    const responseHeaders = {
                        "Last-Modified": "Wed, 21 Oct 2023 07:28:00 GMT",
                        ETag: '"123456789"',
                        "Cache-Control": "no-cache"
                    };
                    const expectedStatus = 200;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: "/api/resources/patch",
                        responseBody: undefined,
                        responseHeaders,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(expectedStatus);

                        // Test all response headers
                        for (const [key, value] of Object.entries(responseHeaders)) {
                            expect(xhr.getResponseHeader(key)).to.equal(value);
                        }

                        // Test getting all headers
                        const allHeaders = xhr.getAllResponseHeaders();
                        expect(allHeaders).to.include("content-type:");
                        expect(allHeaders).to.include("last-modified:");

                        resolve();
                    };
                });
            });
        });

        it("should handle request with both query parameters and request body", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { action: "process", data: { items: [1, 2, 3] } };
                    const queryParams = { format: "json", include: "metadata", limit: "10" };
                    const responseHeaders = { "X-Processing-Time": "150ms" };
                    const responseBody = { processed: true, count: 3 };
                    const responseStatus = 200;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: queryParams,
                        method: "POST",
                        path: "/api/process",
                        responseBody,
                        responseHeaders,
                        status: responseStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();
                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(responseStatus);

                        const responseData = JSON.parse(xhr.responseText);
                        expect(responseData).to.deep.equal(responseBody);

                        expect(xhr.getResponseHeader("X-Processing-Time")).to.equal(
                            responseHeaders["X-Processing-Time"]
                        );

                        resolve();
                    };
                });
            });
        });

        it("should handle progress events and loading states", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { largeData: "x".repeat(1000) };
                    let progressCalled = false;
                    let loadStartCalled = false;
                    let loadEndCalled = false;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: SERVER_URL.ResponseWithProgress,
                        responseBody: undefined,
                        responseHeaders: undefined,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.onloadstart = () => {
                        loadStartCalled = true;
                    };

                    xhr.onprogress = () => {
                        progressCalled = true;
                    };

                    xhr.onloadend = () => {
                        loadEndCalled = true;
                    };

                    xhr.onload = () => {
                        // because `onloadend` is called after `onload`
                        setTimeout(() => {
                            expect(loadStartCalled).to.be.true;
                            expect(progressCalled).to.be.true;
                            expect(loadEndCalled).to.be.true;

                            resolve();
                        }, 100);
                    };

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));
                });
            });
        });

        it("should handle different GET and POST scenarios comprehensively", () => {
            cy.window().then(async (win) => {
                const testCases = [
                    { method: "GET" as const, path: "/api/get-test", status: 200, body: undefined },
                    {
                        method: "GET" as const,
                        path: "/api/head-like-test",
                        status: 200,
                        body: undefined
                    },
                    {
                        method: "POST" as const,
                        path: "/api/options-like-test",
                        status: 200,
                        body: { operation: "options" }
                    }
                ];

                const promises = testCases.map((testCase) => {
                    return new Promise<string>((resolve) => {
                        const params = getParamsFromDynamicRequest({
                            body: testCase.body,
                            query: undefined,
                            method: testCase.method,
                            path: testCase.path,
                            responseBody: undefined,
                            responseHeaders: undefined,
                            status: testCase.status,
                            type: "xhr"
                        });

                        const xhr = new win.XMLHttpRequest();
                        xhr.open(testCase.method, params.url);

                        if (testCase.body) {
                            xhr.setRequestHeader("Content-Type", "application/json");
                            xhr.send(JSON.stringify(testCase.body));
                        } else {
                            xhr.send();
                        }

                        xhr.onload = () => {
                            expect(xhr.status).to.equal(testCase.status);
                            resolve(testCase.method);
                        };
                    });
                });

                return Promise.all(promises).then((results) => {
                    expect(results).to.have.length(3);
                    expect(results).to.include.members(["GET", "GET", "POST"]);
                });
            });
        });

        it("should handle response with custom status text and multiple headers", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const multipleHeaders = {
                        "X-Rate-Limit": "1000",
                        "X-Rate-Remaining": "999",
                        "X-Rate-Reset": "1640995200",
                        Server: "nginx/1.20.1",
                        "Access-Control-Allow-Origin": "*",
                        "Custom-Header": "test-value"
                    };
                    const responseBody = { success: true, timestamp: Date.now() };
                    const expectedStatus = 200;

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/with-headers",
                        responseBody: responseBody,
                        responseHeaders: multipleHeaders,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.send();

                    xhr.onreadystatechange = () => {
                        if (xhr.readyState === 4) {
                            expect(xhr.status).to.equal(expectedStatus);

                            // Test response body
                            const responseData = JSON.parse(xhr.responseText);
                            expect(responseData).to.deep.equal(responseBody);

                            // Test all headers individually
                            Object.entries(multipleHeaders).forEach(([headerName, headerValue]) => {
                                expect(xhr.getResponseHeader(headerName)).to.equal(headerValue);
                            });

                            // Test case-insensitive header access
                            expect(xhr.getResponseHeader("custom-header")).to.equal(
                                multipleHeaders["Custom-Header"]
                            );
                            expect(xhr.getResponseHeader("CUSTOM-HEADER")).to.equal(
                                multipleHeaders["Custom-Header"]
                            );

                            resolve();
                        }
                    };
                });
            });
        });

        it("should handle XMLHttpRequest with different ready states and events", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { test: "ready-state-testing" };
                    const expectedStatus = 200;
                    const events: string[] = [];
                    const readyStates: number[] = [];

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: "/api/ready-state-test",
                        responseBody: undefined,
                        responseHeaders: undefined,
                        status: expectedStatus,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    // Track all possible events
                    xhr.onloadstart = () => events.push("loadstart");
                    xhr.onload = () => events.push("load");
                    xhr.onloadend = () => events.push("loadend");
                    xhr.onprogress = () => events.push("progress");

                    xhr.onreadystatechange = () => {
                        readyStates.push(xhr.readyState);
                        events.push(`readystatechange-${xhr.readyState}`);

                        if (xhr.readyState === 4) {
                            // wait for the other events to be triggered
                            setTimeout(() => {
                                expect(xhr.status).to.equal(expectedStatus);
                                expect(readyStates).to.include.members([1, 2, 3, 4]);
                                expect(events).to.include("loadstart");
                                expect(events).to.include("load");
                                expect(events).to.include("loadend");
                                expect(events).to.include("readystatechange-4");
                                resolve();
                            }, 100);
                        }
                    };

                    xhr.open(params.method!, params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");
                    xhr.send(JSON.stringify(requestBody));
                });
            });
        });

        it("should handle various status codes and response scenarios", () => {
            cy.window().then(async (win) => {
                const statusTests = [
                    { status: 200, path: "/api/ok", method: "GET" as const },
                    { status: 201, path: "/api/created", method: "POST" as const },
                    { status: 202, path: "/api/accepted", method: "POST" as const },
                    { status: 400, path: "/api/bad-request", method: "GET" as const },
                    { status: 401, path: "/api/unauthorized", method: "GET" as const },
                    { status: 403, path: "/api/forbidden", method: "GET" as const }
                ];

                const promises = statusTests.map((test) => {
                    return new Promise<number>((resolve) => {
                        const testBody = test.method === "POST" ? { statusTest: true } : undefined;

                        const params = getParamsFromDynamicRequest({
                            body: testBody,
                            query: undefined,
                            method: test.method,
                            path: test.path,
                            responseBody: undefined,
                            responseHeaders: undefined,
                            status: test.status,
                            type: "xhr"
                        });

                        const xhr = new win.XMLHttpRequest();
                        xhr.open(test.method, params.url);

                        if (testBody) {
                            xhr.setRequestHeader("Content-Type", "application/json");
                            xhr.send(JSON.stringify(testBody));
                        } else {
                            xhr.send();
                        }

                        xhr.onload = () => {
                            expect(xhr.status).to.equal(test.status);
                            expect(xhr.readyState).to.equal(4);
                            resolve(xhr.status);
                        };
                    });
                });

                return Promise.all(promises).then((results) => {
                    expect(results).to.have.length(6);
                    expect(results).to.include.members([200, 201, 202, 400, 401, 403]);
                });
            });
        });

        it("should handle timeout property correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const xhr = new win.XMLHttpRequest();

                    // Test default timeout value
                    expect(xhr.timeout).to.equal(0);

                    // Test setting timeout
                    xhr.timeout = 5000;
                    expect(xhr.timeout).to.equal(5000);

                    // Test timeout during actual request
                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/timeout-test",
                        responseBody: { success: true },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    xhr.open(params.method!, params.url);
                    xhr.timeout = 10000; // 10 seconds timeout

                    xhr.onload = () => {
                        expect(xhr.timeout).to.equal(10000);
                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should handle withCredentials property correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const xhr = new win.XMLHttpRequest();

                    // Test default withCredentials value
                    expect(xhr.withCredentials).to.equal(false);

                    // Test setting withCredentials
                    xhr.withCredentials = true;
                    expect(xhr.withCredentials).to.equal(true);

                    // Test withCredentials during actual request
                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/credentials-test",
                        responseBody: { authenticated: true },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    xhr.open(params.method!, params.url);
                    xhr.withCredentials = true;

                    xhr.onload = () => {
                        expect(xhr.withCredentials).to.equal(true);
                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should handle upload property and events correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const requestBody = { largeData: "x".repeat(5000) };
                    let uploadProgressCalled = false;
                    let uploadLoadStartCalled = false;
                    let uploadLoadCalled = false;

                    const params = getParamsFromDynamicRequest({
                        body: requestBody,
                        query: undefined,
                        method: "POST",
                        path: "/api/upload-test",
                        responseBody: { uploaded: true },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    // Test that upload property exists
                    expect(xhr.upload).to.exist;
                    expect(xhr.upload).to.be.instanceOf(win.XMLHttpRequestUpload);

                    // Add upload event listeners
                    xhr.upload.addEventListener("loadstart", () => {
                        uploadLoadStartCalled = true;
                    });

                    xhr.upload.addEventListener("progress", () => {
                        uploadProgressCalled = true;
                    });

                    xhr.upload.addEventListener("load", () => {
                        uploadLoadCalled = true;
                    });

                    xhr.open("POST", params.url);
                    xhr.setRequestHeader("Content-Type", "application/json");

                    xhr.onload = () => {
                        // Give some time for upload events to fire
                        setTimeout(() => {
                            expect(uploadProgressCalled).to.be.true;
                            expect(uploadLoadCalled).to.be.true;
                            expect(uploadLoadStartCalled).to.be.true;
                            resolve();
                        }, 100);
                    };

                    xhr.send(JSON.stringify(requestBody));
                });
            });
        });

        it("should handle responseURL property correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: { param1: "value1", param2: "value2" },
                        method: "GET",
                        path: "/api/responseurl-test",
                        responseBody: { url: "test" },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    // responseURL should be empty before request
                    expect(xhr.responseURL).to.equal("");

                    xhr.open(params.method!, params.url);

                    xhr.onload = () => {
                        // responseURL should contain the request URL after completion
                        expect(xhr.responseURL).to.include("/api/responseurl-test");
                        expect(xhr.responseURL).to.include("param1=value1");
                        expect(xhr.responseURL).to.include("param2=value2");
                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should handle overrideMimeType function correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/mimetype-test",
                        responseBody: { xml: "<xml><data>test</data></xml>" },
                        responseHeaders: { "Content-Type": "application/xml" },
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);

                    // Test overrideMimeType function exists and can be called
                    expect(xhr.overrideMimeType).to.be.a("function");

                    // Override MIME type before sending
                    xhr.overrideMimeType("text/xml");

                    xhr.onload = () => {
                        expect(xhr.status).to.equal(200);
                        expect(xhr.responseText).to.include("<xml>");
                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should handle responseXML property correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const xmlContent = '<?xml version="1.0"?><root><item>test</item></root>';

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/xml-test",
                        responseString: xmlContent,
                        responseHeaders: { "Content-Type": "application/xml" },
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);
                    xhr.overrideMimeType("text/xml");

                    xhr.onload = () => {
                        // responseXML should be accessible
                        expect(xhr.responseXML).to.exist;
                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should throw error when accessing responseText with non-text responseType", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/responsetype-test",
                        responseBody: { data: "test" },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.open(params.method!, params.url);

                    // Set responseType to json
                    xhr.responseType = "json";
                    expect(xhr.responseType).to.equal("json");

                    xhr.onload = () => {
                        // Accessing responseText with responseType 'json' should throw error
                        expect(() => {
                            xhr.responseText;
                        }).to.throw();

                        // But response property should work
                        expect(xhr.response).to.exist;

                        resolve();
                    };

                    xhr.send();
                });
            });
        });

        it("should handle different event types correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    const events: string[] = [];

                    const params = getParamsFromDynamicRequest({
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/events-test",
                        responseBody: { events: "test" },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    // Add different event listeners
                    xhr.addEventListener("loadstart", () => events.push("loadstart"));
                    xhr.addEventListener("load", () => events.push("load"));
                    xhr.addEventListener("loadend", () => events.push("loadend"));
                    xhr.addEventListener("readystatechange", () => events.push("readystatechange"));
                    xhr.addEventListener("progress", () => events.push("progress"));

                    // Test custom event (not load/readystatechange/progress)
                    xhr.addEventListener("abort", () => events.push("abort"));
                    xhr.addEventListener("error", () => events.push("error"));
                    xhr.addEventListener("timeout", () => events.push("timeout"));

                    xhr.open(params.method!, params.url);

                    xhr.onload = () => {
                        // Give some time for all events to fire
                        setTimeout(() => {
                            expect(events).to.include("loadstart");
                            expect(events).to.include("load");
                            expect(events).to.include("loadend");
                            expect(events).to.include("readystatechange");
                            resolve();
                        }, 100);
                    };

                    xhr.send();
                });
            });
        });

        it("should handle abort event correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    let abortCalled = false;

                    const params = getParamsFromDynamicRequest({
                        duration: 2000,
                        body: undefined,
                        query: undefined,
                        method: "GET",
                        path: "/api/abort-test",
                        responseBody: { test: "abort" },
                        responseHeaders: undefined,
                        status: 200,
                        type: "xhr"
                    });

                    const xhr = new win.XMLHttpRequest();

                    xhr.onabort = () => {
                        abortCalled = true;
                    };

                    xhr.addEventListener("abort", () => {
                        // because `onabort` is called after `abort`
                        setTimeout(() => {
                            expect(abortCalled).to.be.true;
                            resolve();
                        }, 100);
                    });

                    xhr.open(params.method!, params.url);
                    xhr.send();

                    // Abort the request immediately
                    setTimeout(() => {
                        xhr.abort();
                    }, 100);
                });
            });
        });

        it("should handle error event correctly", () => {
            cy.window().then(async (win) => {
                return new Promise<void>((resolve) => {
                    let errorCalled = false;

                    const xhr = new win.XMLHttpRequest();

                    xhr.onerror = () => {
                        errorCalled = true;
                    };

                    xhr.addEventListener("error", () => {
                        // because `onerror` is called after `error`
                        setTimeout(() => {
                            expect(errorCalled).to.be.true;
                            resolve();
                        }, 100);
                    });

                    // Try to make a request to an invalid URL to trigger error
                    xhr.open("GET", "http://invalid-url-that-should-fail");
                    xhr.send();
                });
            });
        });
    });
};

// we must be sure that the tests are applicable to the original fetch and xhr
createTests(true);
// tests with interceptor enabled
createTests(false);
