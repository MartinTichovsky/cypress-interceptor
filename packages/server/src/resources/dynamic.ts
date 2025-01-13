import {
    BodyFormatFetch,
    BodyFormatXHR,
    DynamicRequest,
    WSCommunication,
    WSMessage
} from "../types";
import { crossDomainFetch } from "./constants";

const createRequestBodyForFetch = (
    data: Record<string, unknown>,
    format: BodyFormatFetch | BodyFormatXHR | undefined
) => {
    switch (format) {
        case "arraybuffer": {
            const jsonStr = JSON.stringify(data);
            const buffer = new ArrayBuffer(jsonStr.length);
            const view = new Uint8Array(buffer);

            for (let i = 0; i < jsonStr.length; i++) {
                view[i] = jsonStr.charCodeAt(i);
            }

            return buffer;
        }
        case "blob":
            return new Blob([JSON.stringify(data)], { type: "application/json" });
        case "formdata": {
            const formData = new FormData();

            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    formData.append(key, data[key] instanceof Blob ? data[key] : String(data[key]));
                }
            }

            return formData;
        }
        case "typedarray": {
            const json = JSON.stringify(data);
            const uint8Array = new TextEncoder().encode(json);

            return uint8Array;
        }
        case "urlencoded": {
            const params = new URLSearchParams();

            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    params.append(key, String(data[key]));
                }
            }

            return params;
        }
        default:
            return JSON.stringify(data);
    }
};

const createRequestBodyForXHR = (
    data: Record<string, unknown>,
    format: BodyFormatFetch | BodyFormatXHR | undefined
) => {
    if (format === "document") {
        const parser = new DOMParser();
        const xml = `<root>${Object.entries(data)
            .map(([key, value]) => `<${key}>${String(value)}</${key}>`)
            .join("")}</root>`;

        return parser.parseFromString(xml, "application/xml");
    }

    return createRequestBodyForFetch(data, format);
};

const getContentType = (
    isCrossDomainScriptFetch: boolean,
    format: BodyFormatFetch | BodyFormatXHR | undefined
) => {
    if (isCrossDomainScriptFetch) {
        return "application/javascript";
    }

    switch (format) {
        case "arraybuffer":
        case "blob":
        case "typedarray":
            return "application/octet-stream";
        case "document":
            return "application/xml";
        case "formdata":
            return "multipart/form-data";
        case "urlencoded":
            return "application/x-www-form-urlencoded";
        default:
            return "application/json";
    }
};

const wait = async (timeout: number) => new Promise((executor) => setTimeout(executor, timeout));

const wsCommunication = async (
    webSocket: WebSocket,
    communication: WSCommunication[] | undefined
) => {
    if (!communication?.length) {
        return;
    }

    if (communication[0].sendDelay) {
        await wait(communication[0].sendDelay);
    }

    webSocket.send(
        JSON.stringify({
            data: communication[0].sendData,
            delay: communication[0].responseDelay,
            response: communication[0].responseData
        })
    );

    communication.shift();
};

const wsSendQueue = async (webSocket: WebSocket, sendQueue: WSMessage[] | undefined) => {
    if (!sendQueue?.length) {
        return;
    }

    if (sendQueue[0].delay) {
        await wait(sendQueue[0].delay);
    }

    webSocket.send(sendQueue[0].data);

    sendQueue.shift();

    void wsSendQueue(webSocket, sendQueue);
};

const requestQueue: DynamicRequest[] = [];

// need for firing a request by a click on a button
(window as Window & { fireRequest?: () => void }).fireRequest = () => {
    if (!requestQueue.length) {
        return;
    }

    const request = requestQueue.shift();

    if (request) {
        processRequest(request);
    }
};

const getSrc = (path: string, params: Record<string, unknown>) => {
    const searchParams = new URLSearchParams(objectToURLSearch(params));
    const searchString = searchParams.toString();

    return `${
        path.match(/^(http(s)?)|(ws:\/\/)/)
            ? path
            : `${location.origin}${path.startsWith("/") ? "" : "/"}${path}`
    }${searchString ? "?" : ""}${searchString}`;
};

const objectToURLSearch = (object: Record<string, unknown>) => {
    const result: Record<string, string> = {};

    for (const key in object) {
        if (object[key] === undefined) {
            continue;
        }

        result[key] = String(object[key]);
    }

    return result;
};

const parseResponseHeaders = (headersString: string) => {
    const headers: [string, string][] = [];
    const headerLines = headersString.trim().split(/[\r\n]+/);

    headerLines.forEach((line) => {
        const [key, value] = line.split(": ", 2);

        if (key && value !== undefined) {
            headers.push([key.toLowerCase(), value]);
        }
    });

    return headers;
};

const processEntry = (entry: DynamicRequest) => {
    const type = entry.type;
    const path = entry.path;

    if (!type || !path) {
        console.warn("Type or path is missing");
        return;
    }

    const params = {
        ...(typeof entry.query === "object" ? entry.query : undefined),
        ...("bigData" in entry && entry.bigData ? { bigData: true } : undefined),
        duration: "duration" in entry ? entry.duration : undefined,
        enableCache: "enableCache" in entry ? entry.enableCache : undefined,
        path,
        responseBody:
            "responseBody" in entry && entry.responseBody
                ? type === "fetch" || type === "xhr"
                    ? JSON.stringify(entry.responseBody)
                    : entry.responseBody
                : undefined,
        status: "status" in entry ? entry.status : undefined
    };

    const body = "body" in entry ? entry.body : undefined;
    const cancelIn = "cancelIn" in entry ? entry.cancelIn : undefined;
    const headers = "headers" in entry ? entry.headers : undefined;
    const method = "method" in entry ? entry.method : undefined;
    const requests = "requests" in entry ? entry.requests : undefined;

    const url = getSrc(path, params);

    const isCrossDomainScriptFetch = url.startsWith(crossDomainFetch);

    if (type === "fetch") {
        const startTime = performance.now();
        const controller = new AbortController();

        fetch(url, {
            body:
                body && method === "POST"
                    ? createRequestBodyForFetch(body, entry.bodyFormat)
                    : undefined,
            headers: {
                "Content-Type": getContentType(isCrossDomainScriptFetch, entry.bodyFormat),
                ...(headers ? headers : {})
            },
            method: method ?? "GET",
            signal: controller.signal
        })
            .then(async (response) => {
                const duration = performance.now() - startTime;

                try {
                    const div = document.createElement("div");

                    const divResponse = document.createElement("div");
                    divResponse.setAttribute("data-response-type", "body");

                    if (!entry.bigData) {
                        divResponse.innerHTML = isCrossDomainScriptFetch
                            ? await response.text()
                            : JSON.stringify(await response.json());
                    }

                    div.appendChild(divResponse);

                    const divStatusCode = document.createElement("div");
                    divStatusCode.setAttribute("data-response-type", "status-code");
                    divStatusCode.innerHTML = response.status.toString();

                    div.appendChild(divStatusCode);

                    const divHeaders = document.createElement("div");
                    divHeaders.setAttribute("data-response-type", "headers");
                    divHeaders.innerHTML = JSON.stringify([...response.headers.entries()]);

                    div.appendChild(divHeaders);

                    const divDuration = document.createElement("div");
                    divDuration.setAttribute("data-response-type", "duration");
                    divDuration.innerHTML = duration.toString();

                    div.appendChild(divDuration);

                    wrapInSection(`${path}_loaded`, div);
                } catch (e) {
                    console.error(e);
                }

                try {
                    processRequests(requests);
                } catch (e) {
                    console.error(e);
                }
            })
            .catch((e) => {
                console.error(e);
            });

        if (cancelIn !== undefined) {
            setTimeout(() => {
                controller.abort();
            }, cancelIn);
        }
    } else if (type === "xhr") {
        const startTime = performance.now();
        const request = new XMLHttpRequest();

        const sendHeaders = {
            "Content-Type": getContentType(isCrossDomainScriptFetch, entry.bodyFormat),
            ...(headers ? headers : {})
        };

        const onRequestDone = () => {
            const duration = performance.now() - startTime;

            try {
                const div = document.createElement("div");

                const divResponse = document.createElement("div");
                divResponse.setAttribute("data-response-type", "body");

                if (!entry.bigData) {
                    divResponse.innerHTML = isCrossDomainScriptFetch
                        ? request.responseText
                        : JSON.stringify(request.response);
                }

                div.appendChild(divResponse);

                const divStatusCode = document.createElement("div");
                divStatusCode.setAttribute("data-response-type", "status-code");
                divStatusCode.innerHTML = request.status.toString();

                div.appendChild(divStatusCode);

                const divHeaders = document.createElement("div");
                divHeaders.setAttribute("data-response-type", "headers");
                divHeaders.innerHTML = JSON.stringify(
                    parseResponseHeaders(request.getAllResponseHeaders())
                );

                div.appendChild(divHeaders);

                const divDuration = document.createElement("div");
                divDuration.setAttribute("data-response-type", "duration");
                divDuration.innerHTML = duration.toString();

                div.appendChild(divDuration);

                wrapInSection(`${path}_loaded`, div);
            } catch (e) {
                console.error(e);
            }

            try {
                processRequests(requests);
            } catch (e) {
                console.error(e);
            }
        };

        switch (entry.responseCatchType) {
            case "addEventListener":
                request.addEventListener("load", () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        onRequestDone();
                    }
                });
                break;
            case undefined:
            case "onreadystatechange":
                request.onreadystatechange = () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        onRequestDone();
                    }
                };
                break;
            case "onload":
                request.onload = () => {
                    if (request.readyState === XMLHttpRequest.DONE) {
                        onRequestDone();
                    }
                };
                break;
        }

        request.open(method ?? "GET", url);

        Object.entries(sendHeaders).forEach(([key, value]) => {
            request.setRequestHeader(key, value);
        });

        if (!isCrossDomainScriptFetch) {
            request.responseType = "json";
        }

        request.send(
            body && method === "POST" ? createRequestBodyForXHR(body, entry.bodyFormat) : undefined
        );

        // when multiple XHR requested at once, the Abort function can be called
        // before the request really begins
        if (cancelIn !== undefined) {
            setTimeout(() => {
                request.abort();
            }, cancelIn);
        }
    } else if (type === "websocket") {
        const params = {
            ...entry.query,
            autoResponse: entry.autoResponse ? JSON.stringify(entry.autoResponse) : undefined
        };

        const webSocket = new WebSocket(
            getSrc(`ws://localhost:3000/${path}`, params),
            entry.protocols
        );

        const div = document.createElement("div");

        webSocket.onmessage = (response) => {
            const divResponse = document.createElement("div");
            divResponse.setAttribute("data-response-type", "message");
            divResponse.innerHTML = response.data;

            div.appendChild(divResponse);

            void wsCommunication(webSocket, entry.communication);

            if (entry.close) {
                webSocket.close(entry.close.code, entry.close.reason);
            }
        };

        webSocket.onopen = () => {
            void wsCommunication(webSocket, entry.communication);
            void wsSendQueue(webSocket, entry.sendQueue);
            wrapInSection(`${path}_loaded`, div);
        };

        if (entry.error) {
            (webSocket as WebSocket & { error: (event: Event) => void }).error(new Event("error"));
        }
    }
};

const processRequest = (entry: DynamicRequest) => {
    const delay = entry.delay;

    if (delay) {
        setTimeout(() => processEntry(entry), delay);
    } else {
        processEntry(entry);
    }
};

const processRequests = (requests: DynamicRequest[] | undefined) => {
    if (!requests?.length) {
        return;
    }

    for (const entry of requests) {
        if (entry.fireOnClick) {
            requestQueue.push(entry);
            continue;
        }

        processRequest(entry);
    }
};

const wrapInSection = (path: string, element: Node) => {
    const section = document.createElement("section");
    section.setAttribute("id", path);

    section.appendChild(element);

    document.body.append(section);
};

(() => {
    const searchParams = new URLSearchParams(location.search);
    const requestsJSON = searchParams.get("requests");

    if (!requestsJSON) {
        return;
    }

    try {
        const requests: DynamicRequest[] | undefined = JSON.parse(requestsJSON);

        if (!Array.isArray(requests)) {
            return;
        }

        processRequests(requests);
    } catch (e) {
        console.error(e);
    }
})();
