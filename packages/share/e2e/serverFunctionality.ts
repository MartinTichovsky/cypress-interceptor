import {
    DEFAULT_WAITTIME,
    generateUrl,
    getDelayWait,
    getDynamicUrl
} from "cypress-interceptor-server/src/utils";

import { getLoadedSector, getResponseBody } from "../src/selectors";
import { fireRequest } from "../src/utils";

describe("Testing that the Interceptor logs requests correctly", () => {
    it("With default options", () => {
        // visit a site with none scripts, styles, etc.
        cy.interceptor().then((interceptor) => expect(interceptor.callStack).to.deep.equal([]));

        cy.visit(generateUrl("/"));

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(1));

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(1));

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.delay).to.be.undefined;
            expect(stats!.resourceType).to.eq("document");
            expect(stats!.url).to.eq("http://localhost:3000/");
        });

        // visit a site with scripts, styles, etc.
        cy.visit(generateUrl("public/"));

        cy.waitUntilRequestIsDone();

        // cross domain requests, images and css are by default ignored
        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(5));

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(5));

        cy.interceptorStats({ resourceType: "document" }).then((stats) => {
            expect(stats[1]).not.to.be.undefined;
            expect(stats[1].delay).to.be.undefined;
            expect(stats[1].resourceType).to.eq("document");
            expect(stats[1].url).to.eq("http://localhost:3000/public/");
        });

        cy.interceptorLastRequest({ resourceType: "document" }).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.delay).to.be.undefined;
            expect(stats!.resourceType).to.eq("document");
            expect(stats!.url).to.eq("http://localhost:3000/public/");
        });

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("http://localhost:3000/script.js");
        });

        cy.interceptorLastRequest({ resourceType: "script" }).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.delay).to.be.undefined;
            expect(stats!.resourceType).to.eq("script");
            expect(stats!.url).to.eq("http://localhost:3000/script.js");
        });
    });

    it("With custom options", () => {
        cy.interceptorOptions({ resourceTypes: "all" });

        cy.visit(generateUrl("public/"));

        cy.waitUntilRequestIsDone();

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(6));

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(6));

        cy.interceptorStats({ resourceType: "document" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("document");
            expect(stats[0].url).to.eq("http://localhost:3000/public/");
        });

        // can not test by the order, it can be different because of the browser
        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("stylesheet");
            expect(stats[0].url).to.eq("http://localhost:3000/style.css");
        });

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("http://localhost:3000/script.js");
        });

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("image");
            expect(stats[0].url).to.eq("http://localhost:3000/image.png");
        });

        cy.interceptorStats({ method: "GET", resourceType: "fetch" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("fetch");
            expect(stats[0].url).to.eq("http://localhost:3000/fetch");
        });

        cy.interceptorStats({ method: "POST", resourceType: "fetch" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("fetch");
            expect(stats[0].url).to.eq("http://localhost:3000/fetch");
        });
    });

    it("Cross Domain Requests", () => {
        cy.interceptorOptions({ ingoreCrossDomain: false, resourceTypes: "all" });

        cy.visit(generateUrl("public/"));

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ crossDomain: false, resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("http://localhost:3000/script.js");
        });

        cy.interceptorStats({ crossDomain: true, resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("https://www.gstatic.com/charts/loader.js");
        });
    });

    it("HTML page with async load", () => {
        cy.interceptorOptions({ ingoreCrossDomain: false, resourceTypes: "all" });

        cy.visit(generateUrl("public/async.html"));

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(5));

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(5));

        cy.interceptorStats({ resourceType: "document" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("document");
            expect(stats[0].url).to.eq("http://localhost:3000/public/async.html");
        });

        // can not test by the order, it can be different because of the browser
        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("stylesheet");
            expect(stats[0].url).to.eq("http://localhost:3000/style.css");
        });

        cy.interceptorStats({ crossDomain: false, resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("http://localhost:3000/script.js");
        });

        cy.interceptorStats({ crossDomain: true, resourceType: "script" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("script");
            expect(stats[0].url).to.eq("https://www.gstatic.com/charts/loader.js");
        });

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats[0]).not.to.be.undefined;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].resourceType).to.eq("image");
            expect(stats[0].url).to.eq("http://localhost:3000/image.png");
        });
    });
});

describe("Testing that the server works correctly", () => {
    it("Delay - Fetch", () => {
        const testPath = "fetch";
        const delay = 1500;

        cy.interceptorOptions({ resourceTypes: "fetch" });

        cy.visit(
            getDynamicUrl([
                { delay, path: testPath, type: "fetch", method: "GET" },
                { delay, path: testPath, type: "fetch", method: "POST" }
            ])
        );

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(0));

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(delay / 2);

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(getDelayWait(delay / 2));
        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
        });
    });

    it("Delay - Image", () => {
        const testPath = "image.png";
        const delay = 1500;

        cy.interceptorOptions({ resourceTypes: "image" });

        cy.visit(getDynamicUrl([{ delay, path: testPath, type: "image" }]));

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(0));

        cy.interceptorStats({ resourceType: "image" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(delay / 2);

        cy.interceptorStats({ resourceType: "image" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(getDelayWait(delay / 2));
        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
        });
    });

    it("Delay - JavaScript", () => {
        const testPath = "script.js";
        const delay = 1500;

        cy.interceptorOptions({ resourceTypes: "script" });

        cy.visit(getDynamicUrl([{ delay, path: testPath, type: "script" }]));

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(0));

        cy.interceptorStats({ resourceType: "script" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(delay / 2);

        cy.interceptorStats({ resourceType: "script" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(getDelayWait(delay / 2));
        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
        });
    });

    it("Delay - StyleSheet", () => {
        const testPath = "style.css";
        const delay = 1500;

        cy.interceptorOptions({ resourceTypes: "stylesheet" });

        cy.visit(getDynamicUrl([{ delay, path: testPath, type: "stylesheet" }]));

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(0));

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(delay / 2);

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) =>
            expect(stats.length).to.eq(0)
        );

        cy.wait(getDelayWait(delay / 2));
        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].isPending).to.be.false;
        });
    });

    it("Duration - Fetch", () => {
        const testPath = "fetch";
        const duration = 5000;

        cy.interceptorOptions({ resourceTypes: "fetch" });

        cy.visit(
            getDynamicUrl([
                { duration, path: testPath, type: "fetch", method: "GET" },
                { duration, path: testPath, type: "fetch", method: "POST" }
            ])
        );

        cy.startTiming();

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(2));

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].isPending).to.be.true;
            expect(stats[1].isPending).to.be.true;
        });

        cy.wait(duration / 2);

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].isPending).to.be.true;
            expect(stats[1].isPending).to.be.true;
        });

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats.length).to.eq(2);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
            expect(stats[1].duration).to.be.gte(duration);
            expect(stats[1].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration - Image", () => {
        const testPath = "image.png";
        const duration = 3000;

        cy.interceptorOptions({ resourceTypes: "image" });

        cy.visit(getDynamicUrl([{ delay: 100, duration, path: testPath, type: "image" }]));

        cy.startTiming();

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(1));

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.wait(duration / 2);

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration - JavaScript", () => {
        const testPath = "script.js";
        const duration = 4000;

        cy.interceptorOptions({ resourceTypes: "script" });

        cy.visit(getDynamicUrl([{ delay: 100, duration, path: testPath, type: "script" }]));

        cy.startTiming();

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(1));

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.wait(duration / 2);

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration - StyleSheet", () => {
        const testPath = "style.css";
        const duration = 2000;

        cy.interceptorOptions({ resourceTypes: "stylesheet" });

        cy.visit(getDynamicUrl([{ delay: 100, duration, path: testPath, type: "stylesheet" }]));

        cy.startTiming();

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptor().then((interceptor) => expect(interceptor.callStack.length).to.eq(1));

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.wait(duration / 2);

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].isPending).to.be.true;
        });

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration Without Delay - Image", () => {
        const testPath = "image.png";
        const duration = 3000;

        cy.interceptorOptions({ resourceTypes: "image" });

        cy.startTiming();

        // when delay is not set, it behaves like synchronous request and it will wait
        // until the request is done
        cy.visit(getDynamicUrl([{ duration, path: testPath, type: "image" }]));

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration Without Delay - JavaScript", () => {
        const testPath = "script.js";
        const duration = 5000;

        cy.interceptorOptions({ resourceTypes: "script" });

        cy.startTiming();

        // when delay is not set, it behaves like synchronous request and it will wait
        // until the request is done
        cy.visit(getDynamicUrl([{ duration, path: testPath, type: "script" }]));

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Duration Without Delay - StyleSheet", () => {
        const testPath = "style.css";
        const duration = 3000;

        cy.interceptorOptions({ resourceTypes: "stylesheet" });

        cy.startTiming();

        cy.visit(getDynamicUrl([{ duration, path: testPath, type: "stylesheet" }]));

        cy.wait(DEFAULT_WAITTIME);

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats.length).to.eq(1);
            expect(stats[0].duration).to.be.gte(duration);
            expect(stats[0].isPending).to.be.false;
        });

        cy.stopTiming().should("be.gt", duration);
    });

    it("Fetch Body and Response - POST", () => {
        const testPath = "fetch";
        const query = {
            val1: "value1",
            val2: "123"
        };
        const requestBody = {
            bool: true,
            num: 123,
            object: { arr: [1, 2], bool: false, str: "value" },
            property: "something"
        };
        const responseBody = {
            ...requestBody,
            arr: ["string", 0, 9]
        };

        cy.interceptorOptions({ resourceTypes: "fetch" });

        cy.visit(
            getDynamicUrl([
                {
                    body: requestBody,
                    path: testPath,
                    query,
                    responseBody,
                    type: "fetch",
                    method: "POST"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.query).to.has.property("val1", query.val1);
            expect(stats!.request.query).to.has.property("val2", query.val2);
            expect(stats!.request.body).to.deep.eq(requestBody);
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(responseBody);
        });
    });

    it("Fetch Body and Response - GET", () => {
        const testPath = "fetch";
        const query = {
            val1: "value2",
            val2: "432"
        };
        const responseBody = {
            property: "something",
            num: 321,
            arr: [false, 999, "abc"]
        };

        cy.interceptorOptions({ resourceTypes: "fetch" });

        cy.visit(
            getDynamicUrl([
                {
                    path: testPath,
                    query,
                    responseBody,
                    type: "fetch",
                    method: "GET"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest().then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.request.query).to.has.property("val1", query.val1);
            expect(stats!.request.query).to.has.property("val2", query.val2);
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.body).to.deep.eq(responseBody);
        });
    });

    it("Response status", () => {
        const fetchGetPath = "fetch-get";
        const fetchGetResponseStatus = 405;
        const fethPostPath = "fetch-post";
        const fetchPostResponseStatus = 301;
        const styleSheetPath = "style.css";
        const styleSheetResponseStatus = 202;
        const imagePath = "image.png";
        const imageResponseStatus = 501;
        const javaScriptPath = "script.js";
        const javaScriptStatus = 204;

        cy.interceptorOptions({ resourceTypes: "all" });

        cy.visit(
            getDynamicUrl([
                {
                    path: fetchGetPath,
                    status: fetchGetResponseStatus,
                    type: "fetch",
                    method: "GET"
                },
                {
                    path: fethPostPath,
                    status: fetchPostResponseStatus,
                    type: "fetch",
                    method: "GET"
                },
                {
                    path: styleSheetPath,
                    status: styleSheetResponseStatus,
                    type: "stylesheet"
                },
                {
                    path: imagePath,
                    status: imageResponseStatus,
                    type: "image"
                },
                {
                    path: javaScriptPath,
                    status: javaScriptStatus,
                    type: "script"
                }
            ])
        );

        cy.waitUntilRequestIsDone();

        cy.interceptorLastRequest(`**/${fetchGetPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(fetchGetResponseStatus);
        });

        cy.interceptorLastRequest(`**/${fethPostPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(fetchPostResponseStatus);
        });

        cy.interceptorLastRequest(`**/${styleSheetPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(styleSheetResponseStatus);
        });

        cy.interceptorLastRequest(`**/${imagePath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(imageResponseStatus);
        });

        cy.interceptorLastRequest(`**/${javaScriptPath}`).then((stats) => {
            expect(stats).not.to.be.undefined;
            expect(stats!.response).not.to.be.undefined;
            expect(stats!.response!.statusCode).to.eq(javaScriptStatus);
        });
    });

    it("Following Requests - JavaScript", () => {
        const testPath1 = "script-1.js";
        const testPath2 = "script-2.js";
        const testPath3 = "script-3.js";

        const duration1 = 1500;
        const duration2 = 2000;
        const duration3 = 2500;

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    duration: duration1,
                    path: testPath1,
                    requests: [
                        {
                            duration: duration2,
                            path: testPath2,
                            requests: [
                                {
                                    duration: duration3,
                                    path: testPath3,
                                    type: "script"
                                }
                            ],
                            type: "script"
                        }
                    ],
                    type: "script"
                }
            ])
        );

        cy.startTiming();

        cy.waitUntilRequestIsDone();

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats.length).to.eq(3);

            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration1);
            expect(stats[0].isPending).to.be.false;

            expect(stats[1].delay).to.be.undefined;
            expect(stats[1].duration).to.be.gte(duration2);
            expect(stats[1].isPending).to.be.false;

            expect(stats[2].delay).to.be.undefined;
            expect(stats[2].duration).to.be.gte(duration3);
            expect(stats[2].isPending).to.be.false;
        });

        cy.stopTiming().should("be.greaterThan", duration1 + duration2 + duration3);
    });

    it("Following Requests - Multiple (script, style, xhr, image)", () => {
        const testPath1 = "script-1.js";
        const testPath2 = "style.css";
        const testPath3 = "fetch";
        const testPath4 = "image.png";
        const testPath5 = "script-2.js";

        const duration1 = 1000;
        const duration2 = 1500;
        const duration3 = 2500;
        const duration4 = 1400;
        const duration5 = 1200;

        cy.interceptorOptions({ resourceTypes: ["fetch", "image", "script", "stylesheet"] });

        cy.visit(
            getDynamicUrl([
                {
                    delay: 100,
                    duration: duration1,
                    path: testPath1,
                    requests: [
                        {
                            duration: duration2,
                            path: testPath2,
                            requests: [
                                {
                                    duration: duration4,
                                    path: testPath4,
                                    type: "image"
                                }
                            ],
                            type: "stylesheet"
                        },
                        {
                            duration: duration3,
                            path: testPath3,
                            method: "GET",
                            requests: [
                                {
                                    duration: duration5,
                                    path: testPath5,
                                    type: "script"
                                }
                            ],
                            type: "fetch"
                        }
                    ],
                    type: "script"
                }
            ])
        );

        cy.startTiming();

        cy.waitUntilRequestIsDone();

        cy.interceptorStats().then((stats) => expect(stats.length).to.eq(5));

        cy.interceptorStats({ resourceType: "script" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration1);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.endsWith(testPath1)).to.be.true;

            expect(stats[1].delay).to.be.undefined;
            expect(stats[1].duration).to.be.gte(duration5);
            expect(stats[1].isPending).to.be.false;
            expect(stats[1].url.endsWith(testPath5)).to.be.true;
        });

        cy.interceptorStats({ resourceType: "stylesheet" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration2);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.endsWith(testPath2)).to.be.true;
        });

        cy.interceptorStats({ resourceType: "image" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration4);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.endsWith(testPath4)).to.be.true;
        });

        cy.interceptorStats({ resourceType: "fetch" }).then((stats) => {
            expect(stats[0].delay).to.be.undefined;
            expect(stats[0].duration).to.be.gte(duration3);
            expect(stats[0].isPending).to.be.false;
            expect(stats[0].url.endsWith(testPath3)).to.be.true;
        });

        cy.stopTiming().should(
            "be.greaterThan",
            Math.max(duration1 + duration2 + duration4, duration1 + duration3 + duration5)
        );
    });

    it("Request on Click - no delay", () => {
        const testPath1 = "script-1.js";
        const testPath2 = "script-2.js";
        const testPath3 = "fetch-1";

        const responseBody = { respoonse: "RESPONSE TEXT" };

        cy.visit(
            getDynamicUrl([
                {
                    fireOnClick: true,
                    path: testPath1,
                    type: "script"
                },
                {
                    fireOnClick: true,
                    path: testPath2,
                    type: "script"
                },
                {
                    fireOnClick: true,
                    method: "POST",
                    path: testPath3,
                    responseBody,
                    type: "fetch"
                }
            ])
        );

        getLoadedSector(testPath1).should("not.exist");

        fireRequest();

        getLoadedSector(testPath1).should("exist");
        getLoadedSector(testPath2).should("not.exist");

        fireRequest();

        getLoadedSector(testPath2).should("exist");
        getLoadedSector(testPath3).should("not.exist");

        fireRequest();

        getLoadedSector(testPath3).should("exist");
        getResponseBody(testPath3).should("deep.equal", responseBody);
    });

    it("Request on Click - with delay", () => {
        const testPath1 = "script-1.js";
        const testPath2 = "script-2.js";
        const testPath3 = "fetch-1";

        const delayDuration1 = 500;
        const delayDuration2 = 1500;
        const delayDuration3 = 2500;

        const responseBody = { respoonse: "RESPONSE TEXT" };

        cy.visit(
            getDynamicUrl([
                {
                    delay: delayDuration1,
                    duration: delayDuration1,
                    fireOnClick: true,
                    path: testPath1,
                    type: "script"
                },
                {
                    delay: delayDuration2,
                    duration: delayDuration2,
                    fireOnClick: true,
                    path: testPath2,
                    type: "script"
                },
                {
                    delay: delayDuration3,
                    duration: delayDuration3,
                    fireOnClick: true,
                    method: "POST",
                    path: testPath3,
                    responseBody,
                    type: "fetch"
                }
            ])
        );

        getLoadedSector(testPath1).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath1}`).should("be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.wait(delayDuration1 / 2);

        cy.interceptorLastRequest(`**/${testPath1}`).should("be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.wait(delayDuration1 / 2);

        cy.interceptorLastRequest(`**/${testPath1}`).should("not.be.undefined");
        getLoadedSector(testPath1).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath1).should("exist");

        // next request

        getLoadedSector(testPath2).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath2}`).should("be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.wait(delayDuration2 / 2);

        cy.interceptorLastRequest(`**/${testPath2}`).should("be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.wait(delayDuration2 / 2);

        cy.interceptorLastRequest(`**/${testPath2}`).should("not.be.undefined");
        getLoadedSector(testPath2).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath2).should("exist");

        // next request

        getLoadedSector(testPath3).should("not.exist");

        fireRequest();

        cy.interceptorLastRequest(`**/${testPath3}`).should("be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.wait(delayDuration3 / 2);

        cy.interceptorLastRequest(`**/${testPath3}`).should("be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.wait(delayDuration3 / 2);

        cy.interceptorLastRequest(`**/${testPath3}`).should("not.be.undefined");
        getLoadedSector(testPath3).should("not.exist");

        cy.waitUntilRequestIsDone();

        getLoadedSector(testPath3).should("exist");
        getResponseBody(testPath3).should("deep.equal", responseBody);
    });
});
