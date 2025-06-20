import cors from "cors";
import express from "express";
import expressWs from "express-ws";
import * as fs from "fs";
import multer from "multer";
import * as path from "path";
import * as ts from "typescript";
import { WebSocket } from "ws";

import { bigDataGenerator } from "./bigDataGenerator";
import { getExampleResponse } from "./exampleResponse";
import { SERVER_URL } from "./resources/constants";
import { WSMessage } from "./types";

const app = expressWs(express()).app;
const secondApp = expressWs(express()).app;
const upload = multer();
const port = 3000;
const secondPort = 3001;

const wait = async (timeout: number) => new Promise((executor) => setTimeout(executor, timeout));

app.use(cors());
secondApp.use(cors());
app.use(express.json());
app.use("/public", express.static(path.join(__dirname, "../public"), { redirect: false }));
app.use("/fixtures", express.static(path.join(__dirname, "../fixtures"), { redirect: false }));

interface TestingEndpointRequest {
    enableCache?: boolean;
    bigData?: boolean;
    duration?: string;
    /**
     * Should be unique for every request
     */
    path: string;
    /**
     * The response object, will be parsed as JSON
     */
    responseBody?: string;
    /**
     * The response string, can be anything
     */
    responseString?: string;
    /**
     * The additional response headers
     */
    responseHeaders?: string;
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
    return !isNaN(result) ? result : defaultNumber;
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

app.ws(`/${SERVER_URL.WebSocketClose}`, (ws) => {
    ws.close(1000, "Closing connection");
});

app.ws("/{*splat}", (ws, req) => {
    ws.on("message", (msg: string) => {
        if (req.url.includes(`/${SERVER_URL.WebSocketArrayBuffer}`)) {
            ws.binaryType = "arraybuffer";
            ws.send(msg);
            return;
        }

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

app.get(`${resourcesPath}{*splat}`, (req, res) => {
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

app.post(`/${SERVER_URL.AutoResponseFormData}`, upload.any(), (req, res) => {
    const files = req.files;
    const fields = req.body;

    res.json({
        receivedFields: fields,
        receivedFiles: (files as Express.Multer.File[]).map((file) => ({
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            buffer: file.buffer.toString("base64").slice(0, 100) + "..." // for preview only
        }))
    });
});

app.get(`/${SERVER_URL.BlobResponse}`, (_req, res) => {
    // Create sample data for the blob
    const sampleData = {
        message: "This is a sample blob response",
        timestamp: new Date().toISOString(),
        data: Array.from({ length: 1000 }, (_, i) => i) // Generate some sample data
    };

    // Convert the data to a Buffer
    const buffer = Buffer.from(JSON.stringify(sampleData));

    // Set appropriate headers
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${"sample.blob"}"`);
    res.setHeader("Content-Length", buffer.length);

    // Send the blob response
    res.send(buffer);
});

// reading of the response text should fail after calling this endpoint
app.get(`/${SERVER_URL.BrokenStream}`, (req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });

    res.write("Some partial data...");

    setTimeout(() => {
        req.socket.destroy();
    }, 500);
});

app.get(`/${SERVER_URL.InvalidJson}`, (_req, res) => {
    res.type(XHRContentType);
    res.send("Invalid JSON");
});

app.get(`/${SERVER_URL.ResponseWithProgress}`, async (_req, res) => {
    res.writeHead(200, {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked" // Enables streaming response
    });

    // Simulate sending data in chunks
    res.write(`{"${"data"}":[`);

    const total = 4;

    for (let i = 0; i < total; i++) {
        await wait(1000);

        res.write(`{"id":${i}}`);

        if (i < total - 1) {
            res.write(",");
        }
    }

    res.end();
});

app.post(`/${SERVER_URL.ResponseWithProgress}`, async (_req, res) => {
    res.setHeader("Content-Type", "application/octet-stream");

    const chunk = Buffer.alloc(1024 * 100, "a"); // 100 KB per chunk
    let sent = 0;
    const total = 1024 * 100 * 50; // 5 MB

    function sendChunk() {
        if (sent < total) {
            res.write(chunk);
            sent += chunk.length;
            setTimeout(sendChunk, 50); // Slow down sending
        } else {
            res.end();
        }
    }

    sendChunk();
});

app.use<unknown, unknown, unknown, TestingEndpointRequest>((req, res, next) => {
    wait(getNumberFomString(req.query.duration))
        .then(() => {
            const url = req.url.replace(/\?(.*)$/, "").toLowerCase();
            const accepts = req.accepts();
            const match = url.match(/\/[^.]+(\.[a-zA-Z0-9]+)$/i);
            const contentType = req.headers["content-type"];
            const responseHeaders: Record<string, string> = {};

            if (req.query.responseHeaders) {
                try {
                    for (const [key, value] of Object.entries(
                        JSON.parse(req.query.responseHeaders) as Record<string, string>
                    )) {
                        responseHeaders[key] = value;
                    }
                } catch {
                    //
                }
            }

            const type =
                contentType === XHRContentType
                    ? XHRContentType
                    : (match?.[1] ?? accepts?.[0]?.toLowerCase() ?? XHRContentType);

            const responseType = responseHeaders["Content-Type"] ?? contentType ?? XHRContentType;

            res.type(type);

            if (req.query.status) {
                res.status(getNumberFomString(req.query.status, 200));
            } else {
                res.status(200);
            }

            if (req.query.enableCache) {
                res.setHeader("Cache-Control", "public, max-age=3600");
            }

            for (const [key, value] of Object.entries(responseHeaders)) {
                res.setHeader(key, value);
            }

            if (req.query.responseString) {
                res.send(req.query.responseString);
            } else if (req.query.bigData) {
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

secondApp.use((_req, res) => {
    const filePath = path.join(__dirname, "../public/navigation.html");
    res.sendFile(filePath);
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});

secondApp.listen(secondPort, () => {
    console.log(`Server is listening at http://localhost:${secondPort}`);
});
