import "cypress-interceptor";
import "cypress-interceptor/websocket";

import { SERVER_URL } from "cypress-interceptor-server/src/resources/constants";
import {
    getInitForFetchFromParams,
    getParamsFromDynamicRequest
} from "cypress-interceptor-server/src/resources/dynamic";
import { DynamicRequest } from "cypress-interceptor-server/src/types";

const outputDir = "_logs";
const testPath_Fetch_1 = "stats/fetch-1";

before(() => {
    cy.task("clearLogs", [outputDir]);
});

beforeEach(() => {
    cy.visit("/");
});

const createTests = (disableInterceptor: boolean) => {
    beforeEach(() => {
        if (disableInterceptor) {
            cy.destroyInterceptor();

            cy.window().then((win) => {
                expect("originFetch" in win).to.eq(false);
                expect("originXMLHttpRequest" in win).to.eq(false);
            });
        }
    });

    describe(`Edge Cases and Error Scenarios with interceptor ${disableInterceptor ? "disabled" : "enabled"}`, () => {
        describe("Fetch Edge Cases", () => {
            it("should handle fetch with AbortController", () => {
                cy.window().then(async (win) => {
                    const controller = new AbortController();

                    const entry: DynamicRequest = {
                        method: "GET",
                        path: "abort-test",
                        status: 200,
                        type: "fetch"
                    };

                    const fetchPromise = win.fetch(
                        ...getInitForFetchFromParams(entry, getParamsFromDynamicRequest(entry), {
                            controller
                        })
                    );

                    // Abort the request after 500ms
                    setTimeout(() => controller.abort(), 500);

                    return fetchPromise.catch((error) => {
                        expect(error.name).to.equal("AbortError");
                    });
                });
            });

            it("should handle fetch with streaming response", () => {
                const responseBody = { data: "chunk1\nchunk2\nchunk3" };

                cy.window().then(async (win) => {
                    const entry: DynamicRequest = {
                        method: "GET",
                        path: testPath_Fetch_1,
                        responseBody,
                        status: 200,
                        type: "fetch"
                    };

                    return win
                        .fetch(
                            ...getInitForFetchFromParams(entry, getParamsFromDynamicRequest(entry))
                        )
                        .then(async (response) => {
                            const reader = response.body?.getReader();
                            const chunks = [];

                            while (true) {
                                const { done, value } = await reader!.read();
                                if (done) {
                                    break;
                                }
                                chunks.push(new TextDecoder().decode(value));
                            }

                            const expected = JSON.stringify(responseBody);

                            expect(chunks.join("")).to.equal(expected);
                        });
                });
            });

            it("should handle fetch with credentials", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: "credentials-test",
                    status: 200,
                    type: "fetch"
                };

                cy.window().then(async (win) => {
                    return win
                        .fetch(
                            ...getInitForFetchFromParams(
                                entry,
                                getParamsFromDynamicRequest(entry),
                                {
                                    requestInit: {
                                        credentials: "include",
                                        headers: {
                                            Authorization: "Bearer test-token"
                                        }
                                    }
                                }
                            )
                        )
                        .then((response) => {
                            expect(response.status).to.equal(200);
                        });
                });
            });
        });

        describe("XMLHttpRequest Edge Cases", () => {
            it("should handle XHR with progress events", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        let uploadProgressEvents = 0;
                        let progressEvents = 0;

                        xhr.upload.onprogress = () => uploadProgressEvents++;
                        xhr.onprogress = () => progressEvents++;

                        xhr.open("POST", "/progress-test");
                        xhr.send("test data");

                        xhr.onload = () => {
                            expect(uploadProgressEvents).to.be.greaterThan(0);
                            expect(progressEvents).to.equal(0);
                            resolve(undefined);
                        };
                    });
                });
            });

            it("should handle XHR with timeout", () => {
                const entry: DynamicRequest = {
                    duration: 2000,
                    method: "GET",
                    path: "timeout-test",
                    status: 200,
                    type: "xhr"
                };

                const params = getParamsFromDynamicRequest(entry);

                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.timeout = 1000;

                        xhr.ontimeout = () => {
                            expect(xhr.readyState).to.equal(4);
                            resolve(undefined);
                        };

                        xhr.open("GET", params.url);
                        xhr.send();
                    });
                });
            });

            it("should handle XHR with custom headers", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.open("GET", "/headers-test");
                        xhr.setRequestHeader("X-Custom-Header", "test-value");
                        xhr.setRequestHeader("Content-Type", "application/json");
                        xhr.send();

                        xhr.onload = () => {
                            expect(xhr.status).to.equal(200);
                            resolve(undefined);
                        };
                    });
                });
            });

            it("should handle XHR with Blob response", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: SERVER_URL.BlobResponse,
                    status: 200,
                    type: "xhr"
                };

                const params = getParamsFromDynamicRequest(entry);

                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.open("GET", params.url);
                        xhr.responseType = "blob";

                        xhr.onload = () => {
                            expect(xhr.response).to.be.instanceof(win.Blob);
                            resolve(undefined);
                        };

                        xhr.send();
                    });
                });
            });

            it("should handle fetch with Blob response", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: SERVER_URL.BlobResponse,
                    status: 200,
                    type: "fetch"
                };

                cy.window().then(async (win) => {
                    const response = await win.fetch(
                        ...getInitForFetchFromParams(entry, getParamsFromDynamicRequest(entry))
                    );
                    const blob = await response.blob();
                    expect(blob).to.be.instanceof(win.Blob);
                });
            });

            it("should handle malformed response in XHR", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: SERVER_URL.InvalidJson,
                    type: "xhr"
                };

                const params = getParamsFromDynamicRequest(entry);

                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.open("GET", params.url);
                        xhr.responseType = "json";

                        xhr.onload = () => {
                            expect(xhr.status).to.equal(200);
                            expect(xhr.response).to.be.null;
                            resolve(undefined);
                        };

                        xhr.onerror = () => {
                            expect(false).to.be.true;
                        };

                        xhr.send();
                    });
                });
            });

            it("should handle malformed response in fetch", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: SERVER_URL.InvalidJson,
                    type: "fetch"
                };

                cy.window().then(async (win) => {
                    const response = await win.fetch(
                        ...getInitForFetchFromParams(entry, getParamsFromDynamicRequest(entry))
                    );

                    expect(response.status).to.equal(200);

                    let error: unknown;

                    try {
                        await response.json();
                        expect(false).to.be.true; // Should not reach here
                    } catch (e) {
                        error = e;
                    }

                    expect(error).not.to.be.undefined;
                });
            });
        });

        describe("WebSocket Edge Cases", () => {
            it("should handle WebSocket binary data", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const entry: DynamicRequest = {
                            path: SERVER_URL.WebSocketArrayBuffer,
                            type: "websocket"
                        };

                        const params = getParamsFromDynamicRequest(entry);

                        const ws = new win.WebSocket(params.url);

                        ws.binaryType = "arraybuffer";

                        ws.onopen = () => {
                            const data = new Uint8Array([1, 2, 3, 4, 5]);

                            ws.send(data);
                        };

                        ws.onmessage = (event) => {
                            expect(event.data instanceof win.ArrayBuffer).to.be.true;
                            resolve(undefined);
                        };
                    });
                });
            });

            it("should handle WebSocket with multiple protocols", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const entry: DynamicRequest = {
                            path: "protocols-test",
                            type: "websocket"
                        };

                        const params = getParamsFromDynamicRequest(entry);

                        const ws = new win.WebSocket(params.url, ["protocol1", "protocol2"]);

                        ws.onopen = () => {
                            expect(ws.protocol).to.be.oneOf(["protocol1", "protocol2"]);
                            resolve(undefined);
                        };
                    });
                });
            });

            it("should handle WebSocket with ping/pong", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const entry: DynamicRequest = {
                            path: "ping-test",
                            type: "websocket"
                        };

                        const params = getParamsFromDynamicRequest(entry);

                        const ws = new win.WebSocket(params.url);

                        const response = "pong";

                        ws.onopen = () => {
                            ws.send(
                                JSON.stringify({
                                    data: "ping",
                                    delay: 500,
                                    response
                                })
                            );
                        };

                        ws.onmessage = (event) => {
                            if (event.data === response) {
                                resolve(undefined);
                            }
                        };
                    });
                });
            });
        });

        describe("Concurrent Requests", () => {
            it("should handle multiple concurrent fetch requests", () => {
                cy.window().then(async (win) => {
                    const entry1: DynamicRequest = {
                        method: "GET",
                        path: "concurrent-1",
                        status: 200,
                        type: "fetch"
                    };

                    const entry2: DynamicRequest = {
                        method: "GET",
                        path: "concurrent-2",
                        status: 200,
                        type: "fetch"
                    };

                    const entry3: DynamicRequest = {
                        method: "GET",
                        path: "concurrent-3",
                        status: 200,
                        type: "fetch"
                    };

                    const requests = [
                        win.fetch(
                            ...getInitForFetchFromParams(
                                entry1,
                                getParamsFromDynamicRequest(entry1)
                            )
                        ),
                        win.fetch(
                            ...getInitForFetchFromParams(
                                entry2,
                                getParamsFromDynamicRequest(entry2)
                            )
                        ),
                        win.fetch(
                            ...getInitForFetchFromParams(
                                entry3,
                                getParamsFromDynamicRequest(entry3)
                            )
                        )
                    ];

                    return Promise.all(requests).then((responses) => {
                        expect(responses).to.have.length(3);

                        responses.forEach((response) => {
                            expect(response.status).to.equal(200);
                        });
                    });
                });
            });

            it("should handle mixed concurrent requests (fetch, XHR, WebSocket)", () => {
                const entry1: DynamicRequest = {
                    method: "GET",
                    path: "mixed-1",
                    status: 200,
                    type: "fetch"
                };

                const entry2: DynamicRequest = {
                    method: "GET",
                    path: "mixed-2",
                    status: 200,
                    type: "xhr"
                };

                const entry3: DynamicRequest = {
                    path: "mixed-3",
                    type: "websocket"
                };

                cy.window().then(async (win) => {
                    const fetchPromise = win.fetch(
                        ...getInitForFetchFromParams(entry1, getParamsFromDynamicRequest(entry1))
                    );

                    const params2 = getParamsFromDynamicRequest(entry2);

                    const xhrPromise = new Promise<XMLHttpRequest>((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        xhr.open("GET", params2.url);
                        xhr.onload = () => resolve(xhr);
                        xhr.send();
                    });

                    const params3 = getParamsFromDynamicRequest(entry3);

                    const wsPromise = new Promise<WebSocket>((resolve) => {
                        const ws = new win.WebSocket(params3.url);
                        ws.onopen = () => resolve(ws);
                    });

                    return Promise.all([fetchPromise, xhrPromise, wsPromise]).then(
                        ([fetchRes, xhrRes, wsRes]) => {
                            expect(fetchRes.status).to.equal(200);
                            expect(xhrRes.status).to.equal(200);
                            expect(wsRes.readyState).to.equal(1); // OPEN
                        }
                    );
                });
            });
        });

        describe("Error Handling Scenarios", () => {
            it("should handle network errors in fetch", () => {
                cy.window().then(async (win) => {
                    return win
                        .fetch("http://localhost:3333/invalid-url")
                        .then(() => {
                            expect(true).to.be.false;
                        })
                        .catch((error) => {
                            expect(error).to.be.instanceof(win.TypeError);
                            expect(error.message).to.include("Failed to fetch");
                        });
                });
            });

            it("should handle an invalid url for WebSocket", () => {
                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const ws = new win.WebSocket("ws://localhost:3003/ws/");

                        ws.onerror = () => {
                            expect(ws.readyState).to.equal(3); // CLOSED
                            resolve(undefined);
                        };
                    });
                });
            });

            it("should handle WebSocket connection errors", () => {
                const entry: DynamicRequest = {
                    path: SERVER_URL.WebSocketClose,
                    type: "websocket"
                };

                const params = getParamsFromDynamicRequest(entry);

                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const ws = new win.WebSocket(params.url);
                        let openCalled = false;

                        ws.onopen = () => {
                            expect(ws.readyState).to.equal(1); // OPEN
                            openCalled = true;
                        };

                        ws.onclose = () => {
                            expect(ws.readyState).to.equal(3); // CLOSED
                            expect(openCalled).to.be.true;
                            resolve(undefined);
                        };
                    });
                });
            });
        });

        describe("Request/Response Transformation", () => {
            it("should handle fetch with FormData", () => {
                const entry: DynamicRequest = {
                    bodyFormat: "formdata",
                    method: "POST",
                    path: SERVER_URL.AutoResponseFormData,
                    status: 200,
                    type: "fetch"
                };

                cy.window().then(async (win) => {
                    const testFileName = "test.txt";
                    const testFileContent = "test content";
                    const testKey = "text";
                    const testValue = "test value";

                    const formData = new win.FormData();

                    formData.append("file", new win.File([testFileContent], testFileName));
                    formData.append(testKey, testValue);

                    return win
                        .fetch(
                            ...getInitForFetchFromParams(
                                entry,
                                getParamsFromDynamicRequest(entry),
                                {
                                    requestInit: {
                                        body: formData
                                    }
                                }
                            )
                        )
                        .then(async (response) => {
                            const json = await response.json();

                            expect(response.status).to.equal(200);

                            expect(json).to.have.property("receivedFields");
                            expect(json).to.have.property("receivedFiles");

                            expect(json.receivedFields).to.deep.equal({
                                [testKey]: testValue
                            });
                            expect(json.receivedFiles).to.have.length(1);
                            expect(json.receivedFiles[0]).to.have.property(
                                "originalname",
                                testFileName
                            );
                        });
                });
            });
        });

        describe("State Management", () => {
            it("should handle fetch request cancellation after response started", () => {
                const entry: DynamicRequest = {
                    method: "GET",
                    path: "cancel-after-start",
                    responseBody: { data: "streaming response" },
                    status: 200,
                    type: "fetch"
                };

                cy.window().then(async (win) => {
                    const controller = new AbortController();
                    const signal = controller.signal;

                    const fetchPromise = win.fetch(
                        ...getInitForFetchFromParams(entry, getParamsFromDynamicRequest(entry), {
                            requestInit: {
                                signal
                            }
                        })
                    );

                    return fetchPromise.then(async (response) => {
                        const reader = response.body?.getReader();
                        controller.abort(); // Cancel after response started

                        try {
                            await reader!.read();
                            expect(false).to.be.true;
                        } catch (error: unknown) {
                            expect((error as Error).name).to.equal("AbortError");
                        }
                    });
                });
            });

            it("should handle all XHR state changes", () => {
                const entry: DynamicRequest = {
                    duration: 1000,
                    method: "GET",
                    path: SERVER_URL.ResponseWithProgress,
                    status: 200,
                    type: "xhr"
                };

                const params = getParamsFromDynamicRequest(entry);

                cy.window().then((win) => {
                    return new Promise((resolve) => {
                        const xhr = new win.XMLHttpRequest();
                        const states: number[] = [];

                        xhr.onreadystatechange = () => {
                            states.push(xhr.readyState);

                            if (xhr.readyState === 4) {
                                expect(states).to.deep.equal([1, 2, 3, 4]);
                                resolve(undefined);
                            }
                        };

                        xhr.open("GET", params.url);
                        xhr.send();
                    });
                });
            });
        });
    });
};

// we must be sure that the tests are applicable to the original fetch and xhr
createTests(true);
// tests with interceptor enabled
createTests(false);
