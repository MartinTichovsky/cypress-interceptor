import * as cors from "cors";
import * as express from "express";
import * as expressWs from "express-ws";
import * as path from "path";

import { getExampleResponse } from "./exampleResponse";

const app = expressWs(express()).app;
const port = 3000;

const wait = async (timeout: number) => new Promise((executor) => setTimeout(executor, timeout));

app.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public"), { redirect: false }));

interface TestingEndpointRequest {
    enableCache?: boolean;
    duration?: string;
    /**
     * Should be unique for every request
     */
    path: string;
    /**
     * The response body
     */
    responseBody?: string;
    status?: string;
}

const getResponseBody = (
    req: express.Request<unknown, unknown, unknown, TestingEndpointRequest>
) => {
    try {
        return {
            ...(req.query.responseBody ? JSON.parse(req.query.responseBody) : {})
        };
    } catch (ex) {
        console.warn(ex);
        return {};
    }
};

const getNumberFomString = (num: string | undefined, defaultNumber = 0) => {
    const result = parseInt(num ?? defaultNumber.toString());
    return result ? result : defaultNumber;
};

const XHRContentType = "application/json";

app.ws("/*", (ws) => {
    ws.on("message", (msg: string) => {
        try {
            // const data = JSON.parse(msg);
            ws.send(msg);
            // if (data.responseBody) {
            //     ws.send(data.responseBody);
            // }
        } catch {
            //
        }
    });
});

app.use<unknown, unknown, unknown, TestingEndpointRequest>((req, res, next) => {
    wait(getNumberFomString(req.query.duration))
        .then(() => {
            const url = req.url.replace(/\?(.*)$/, "").toLowerCase();
            const accepts = req.accepts();
            const match = url.match(/\/[^.]+(\.[a-zA-Z0-9]+)$/i);
            const contentType = req.headers["content-type"];

            const responseType =
                contentType === XHRContentType
                    ? XHRContentType
                    : match?.[1] ?? accepts?.[0]?.toLowerCase() ?? XHRContentType;

            res.type(responseType);

            if (req.query.status) {
                res.status(getNumberFomString(req.query.status, 200));
            } else {
                res.status(200);
            }

            if (req.query.enableCache) {
                res.setHeader("Cache-Control", "public, max-age=3600");
            }

            if (responseType === XHRContentType) {
                res.json(getResponseBody(req));
            } else if (req.query.responseBody) {
                res.send(req.query.responseBody);
            } else {
                res.send(getExampleResponse(responseType, req.query.path));
            }
        })
        .catch(next);
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
