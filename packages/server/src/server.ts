import * as cors from "cors";
import * as express from "express";
import * as expressWs from "express-ws";
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { WebSocket } from "ws";

import { bigDataGenerator } from "./bigDataGenerator";
import { getExampleResponse } from "./exampleResponse";
import { WSMessage } from "./types";

const app = expressWs(express()).app;
const port = 3000;

const wait = async (timeout: number) => new Promise((executor) => setTimeout(executor, timeout));

app.use(cors());
app.use(express.json());

app.use("/public", express.static(path.join(__dirname, "../public"), { redirect: false }));

interface TestingEndpointRequest {
    enableCache?: boolean;
    bigData?: boolean;
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

interface WsEndpointRequest {
    autoResponse?: string;
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

const executeAutoResponse = async (ws: WebSocket, autoResponse: WSMessage[]) => {
    if (!autoResponse.length) {
        return;
    }

    if (autoResponse[0].delay) {
        await wait(autoResponse[0].delay);
    }

    ws.send(autoResponse[0].data);

    autoResponse.shift();

    void executeAutoResponse(ws, autoResponse);
};

app.ws("/*", (ws, req) => {
    ws.on("message", (msg: string) => {
        try {
            const data = JSON.parse(msg);

            if (data && data.response) {
                wait(getNumberFomString(data.delay))
                    .then(() => {
                        ws.send(data.response);
                    })
                    .catch((er) => {
                        console.error(er);
                    });
            }
        } catch {
            //
        }
    });

    const query: WsEndpointRequest = req.query;

    const autoResponse: WSMessage[] = query.autoResponse ? JSON.parse(query.autoResponse) : [];

    if (autoResponse.length) {
        void executeAutoResponse(ws, autoResponse);
    }
});

const cypressInterceptorString = "cypress-interceptor";
const resourcesPath = "/public/resources/";

app.get(`${resourcesPath}*`, (req, res) => {
    const scriptPath = `${req.url.replace(resourcesPath, "").replace(".js", "")}.ts`;
    const tsFilePath = scriptPath.includes(cypressInterceptorString)
        ? path.join(
              __dirname,
              "../../interceptor",
              ...scriptPath.replace(`${cypressInterceptorString}/`, "").split("/")
          )
        : path.join(__dirname, "resources", ...scriptPath.split("/"));
    const tsContent = fs.readFileSync(tsFilePath, "utf8");

    const compiled = ts.transpileModule(tsContent, {
        compilerOptions: {
            module: ts.ModuleKind.ES2020,
            target: ts.ScriptTarget.ES2020
        }
    });

    res.type("application/javascript");
    res.send(compiled.outputText);
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
                    : (match?.[1] ?? accepts?.[0]?.toLowerCase() ?? XHRContentType);

            res.type(responseType);

            if (req.query.status) {
                res.status(getNumberFomString(req.query.status, 200));
            } else {
                res.status(200);
            }

            if (req.query.enableCache) {
                res.setHeader("Cache-Control", "public, max-age=3600");
            }

            if (req.query.bigData) {
                res.json(bigDataGenerator());
            } else if (responseType === XHRContentType) {
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
