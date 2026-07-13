export const crossDomainFetch = "https://www.gstatic.com/charts/loader.js";
export const I_TEST_ID_HEADER = "X-Test-Id";

// Single source of truth for the server ports. Change these to change the ports everywhere.
export const PORT = 3000;
export const SECOND_PORT = 3001;

export const HOST = `localhost:${PORT}`;
export const SECOND_HOST = `localhost:${SECOND_PORT}`;
export const WS_HOST = `ws://localhost:${PORT}`;

export enum SERVER_URL {
    AutoResponseFormData = "auto-response-form-data",
    BlobResponse = "blob-response",
    BrokenStream = "broken-stream",
    Cookies = "cookies",
    InvalidJson = "invalid-json",
    ResponseWithProgress = "response-with-progress",
    WebSocketArrayBuffer = "array-buffer",
    WebSocketClose = "websocket-close"
}

export enum COUNTER_SERVER_URL {
    GetCounter = `/${I_TEST_ID_HEADER}/counter/get-counter`,
    ResetCounter = `/${I_TEST_ID_HEADER}/counter/reset-counter`
}
