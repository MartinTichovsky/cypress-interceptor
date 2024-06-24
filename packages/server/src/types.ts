export interface WSMessage {
    data: string;
    delay?: number;
}

export interface WSCommunication {
    responseData?: string;
    responseDelay?: number;
    sendData: string;
    sendDelay?: number;
}

export type DynamicRequest = {
    /**
     * If true, a click will be required to fire the request
     */
    fireOnClick?: boolean;
} & (
    | ({
          /**
           * If true, the response will contain "Cache-Control": "public, max-age=3600",
           * and the request will be cached for all the tests
           */
          enableCache?: boolean;
          /**
           * Receive big response
           */
          bigData?: boolean;
          /**
           * Delay when start the request
           */
          delay?: number;
          /**
           * Duration of the request
           */
          duration?: number;
          /**
           * A relative path, such as /script.js, /testing-endpoint, etc.
           */
          path: string;
          /**
           * A custom query
           */
          query?: Record<string, string>;
          /**
           * Possible following requests after this one
           */
          requests?: DynamicRequest[];
          /**
           * Custom response status
           */
          status?: number;
      } & (
          | {
                /**
                 * The response
                 */
                responseBody?: string;
                type: "image" | "script" | "stylesheet";
            }
          | {
                /**
                 * Body sent by fetch
                 */
                body?: unknown;
                /**
                 * A time when the request is canceled. Must be lower then duration
                 */
                cancelIn?: number;
                /**
                 * Headers sent by fetch
                 */
                headers?: Record<string, string>;
                /**
                 * The response
                 */
                responseBody?: Record<string, unknown>;
                /**
                 * The request method
                 */
                method: "GET" | "POST";
                type: "fetch" | "xhr";
            }
      ))
    | {
          /**
           * A data send to the server when create for getting custom responses
           */
          autoResponse?: WSMessage[];
          /**
           * Close after receiving a message
           */
          close?: {
              code?: number;
              reason?: string;
          };
          /**
           * Communication between the client and server
           */
          communication?: WSCommunication[];
          /**
           * Delay when start the request
           */
          delay?: number;
          /**
           * Throw an error
           */
          error?: boolean;
          /**
           * A relative path to ws://localhost:3000/{path}
           */
          path: string;
          /**
           * Protocols of the websocket
           */
          protocols?: string | string[];
          /**
           * A custom query
           */
          query?: Record<string, string>;
          /**
           * A queue of sending messages
           */
          sendQueue?: WSMessage[];
          /**
           * Websocket Type
           */
          type: "websocket";
      }
);
