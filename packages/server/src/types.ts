export type DynamicRequest = {
    /**
     * If true, the response will contain "Cache-Control": "public, max-age=3600",
     * and the request will be cached for all the tests
     */
    enableCache?: boolean;
    /**
     * Delay when start the request
     */
    delay?: number;
    /**
     * Duration of the request
     */
    duration?: number;
    /**
     * If true, a click will be required to fire the request
     */
    fireOnClick?: boolean;
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
          type: "fetch";
      }
);
