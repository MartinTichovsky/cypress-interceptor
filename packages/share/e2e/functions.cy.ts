import {
    formDataToJsonString,
    formDataToObject,
    objectToFormData,
    objectToURLSearchParams,
    urlSearchParamsToJsonString,
    urlSearchParamsToObject
} from "cypress-interceptor/convert/formData";
import { createReplacer } from "cypress-interceptor/convert/replacer";
import {
    objectToXMLDocument,
    xmlDocumentToJSONString,
    xmlDocumentToObject
} from "cypress-interceptor/convert/xmlDocument";

describe("Convert", () => {
    class CustomClass {
        //
    }

    function abc() {
        //
    }

    const data1 = {
        a: 1,
        a1: -1,
        a2: 0,
        a3: 1,
        a4: -1.5,
        a5: 1.5,
        b: "two",
        c: true,
        d: null,
        e: undefined,
        f: 3.14,
        g: [
            1,
            "two",
            false,
            null,
            undefined,
            new File(["content"], "file-1.txt", { type: "text/plain" }),
            [1, 2, 3, "something", false, { obj: 5 }]
        ],
        h: { nested: "object" },
        i: 1000,
        j: -1000,
        k: 1000.5,
        l: -1000.5,
        m: NaN,
        n: Infinity,
        o: -Infinity,
        p: BigInt(12345678901234567890n),
        q: new Date("2024-01-01"),
        r: Symbol("symbol"),
        s: abc,
        t: new File(["content"], "file-2.txt", { type: "text/plain" }),
        u: new Map([
            ["key1", "value1"],
            ["key2", "value2"]
        ]),
        v: new Set([1, 2, 3]),
        w: /regex/,
        x: new CustomClass(),
        y: {},
        z: [],
        _: new Blob(["Hello, world!"], { type: "text/plain" })
    };

    const data2 = {
        user: {
            name: "Alice",
            age: 42,
            active: true,
            nested: {
                list: [10, 20, "str", false]
            }
        }
    };

    describe("FormData", () => {
        it("should match with JSON.stringify", () => {
            expect(formDataToJsonString(objectToFormData(data1, window), window)).to.equal(
                JSON.stringify(data1, createReplacer(window))
            );

            const data2 = { object: data1, array: [...Object.values(data1)] };

            expect(formDataToJsonString(objectToFormData(data2, window), window)).to.equal(
                JSON.stringify(data2, createReplacer(window))
            );

            const data3 = { nestedObject: { nestedObject: {} }, nestedArray: [0, 1, 2.3] };

            expect(formDataToJsonString(objectToFormData(data3, window), window)).to.equal(
                JSON.stringify(data3)
            );
        });

        it("should handle nested objects and arrays with numbers/booleans", () => {
            const formData = objectToFormData(data2, window);
            const convertedData = formDataToObject<typeof data2>(formData, window);

            expect(convertedData.user.name).to.equal(data2.user.name);
            expect(convertedData.user.age).to.equal(data2.user.age);
            expect(convertedData.user.active).to.equal(data2.user.active);
            expect(convertedData.user.nested).to.deep.equal(data2.user.nested);
        });

        it("should handle Files by storing minimal metadata", () => {
            const file = new window.File(["abc"], "test.txt", { type: "text/plain" });
            const data = { docs: [file], single: file };
            const formData = objectToFormData(data, window);
            const convertedData = formDataToObject<typeof data>(formData, window);

            expect(convertedData.docs).to.have.length(1);
            expect(convertedData.docs[0]).to.have.property("name", "test.txt");
            expect(convertedData.docs[0]).to.have.property("type", "text/plain");
            expect(convertedData.docs[0]).to.have.property("size", 3);

            expect(convertedData.single).to.have.property("name", "test.txt");
            expect(convertedData.single).to.have.property("type", "text/plain");
            expect(convertedData.single).to.have.property("size", 3);
        });

        it("should handle Dates by storing them as ISO strings", () => {
            const date = new Date("2025-01-01T00:00:00Z");
            const data = { created: date };
            const formData = objectToFormData(data, window);
            const convertedData = formDataToObject(formData, window);

            expect(convertedData.created).to.deep.equal(date.toISOString());
        });
    });

    describe("URLSearchParams", () => {
        it("should match with JSON.stringify", () => {
            expect(
                urlSearchParamsToJsonString(objectToURLSearchParams(data1, window), window)
            ).to.equal(JSON.stringify(data1, createReplacer(window)));

            const data2 = { object: data1, array: [...Object.values(data1)] };

            expect(
                urlSearchParamsToJsonString(objectToURLSearchParams(data2, window), window)
            ).to.equal(JSON.stringify(data2, createReplacer(window)));

            const data3 = { nestedObject: { nestedObject: {} }, nestedArray: [0, 1, 2.3] };

            expect(
                urlSearchParamsToJsonString(objectToURLSearchParams(data3, window), window)
            ).to.equal(JSON.stringify(data3));
        });

        it("should handle nested objects and arrays with numbers/booleans", () => {
            const urlSearchParams = objectToURLSearchParams(data2, window);
            const convertedData = urlSearchParamsToObject<typeof data2>(urlSearchParams, window);

            expect(convertedData.user.name).to.equal(data2.user.name);
            expect(convertedData.user.age).to.equal(data2.user.age);
            expect(convertedData.user.active).to.equal(data2.user.active);
            expect(convertedData.user.nested).to.deep.equal(data2.user.nested);
        });

        it("should handle Files by storing minimal metadata", () => {
            const file = new window.File(["abc"], "test.txt", { type: "text/plain" });
            const data = { docs: [file], single: file };
            const urlSearchParams = objectToURLSearchParams(data, window);
            const convertedData = urlSearchParamsToObject<typeof data>(urlSearchParams, window);

            expect(convertedData.docs).to.have.length(1);
            expect(convertedData.docs[0]).to.have.property("name", "test.txt");
            expect(convertedData.docs[0]).to.have.property("type", "text/plain");
            expect(convertedData.docs[0]).to.have.property("size", 3);

            expect(convertedData.single).to.have.property("name", "test.txt");
            expect(convertedData.single).to.have.property("type", "text/plain");
            expect(convertedData.single).to.have.property("size", 3);
        });

        it("should handle Dates by storing them as ISO strings", () => {
            const date = new Date("2025-01-01T00:00:00Z");
            const data = { created: date };
            const urlSearchParams = objectToURLSearchParams(data, window);
            const convertedData = urlSearchParamsToObject(urlSearchParams, window);

            expect(convertedData.created).to.deep.equal(date.toISOString());
        });
    });

    describe("XMLDocument", () => {
        it("should match with the object", () => {
            expect(xmlDocumentToObject(objectToXMLDocument(data1, window), window)).to.deep.eq({
                a: 1,
                a1: -1,
                a2: 0,
                a3: 1,
                a4: -1.5,
                a5: 1.5,
                b: "two",
                c: true,
                d: null,
                e: undefined,
                f: 3.14,
                g: [
                    1,
                    "two",
                    false,
                    null,
                    undefined,
                    { name: "file-1.txt", type: "text/plain", size: 7 },
                    [1, 2, 3, "something", false, { obj: 5 }]
                ],
                h: { nested: "object" },
                i: 1000,
                j: -1000,
                k: 1000.5,
                l: -1000.5,
                m: NaN,
                n: Infinity,
                o: -Infinity,
                p: BigInt(12345678901234567890n),
                q: new Date("2024-01-01"),
                r: "Symbol(symbol)",
                s: abc.toString(),
                t: { name: "file-2.txt", type: "text/plain", size: 7 },
                u: { key1: "value1", key2: "value2" },
                v: [1, 2, 3],
                w: /regex/,
                x: {},
                y: {},
                z: [],
                _: { name: "blob", type: "text/plain", size: 13 }
            });
        });

        it("should match with JSON.stringify", () => {
            expect(xmlDocumentToJSONString(objectToXMLDocument(data1, window), window)).to.equal(
                JSON.stringify(data1, createReplacer(window))
            );

            const data2 = { object: data1, array: [...Object.values(data1)] };

            expect(xmlDocumentToJSONString(objectToXMLDocument(data2, window), window)).to.equal(
                JSON.stringify(data2, createReplacer(window))
            );

            const data3 = { nestedObject: { nestedObject: {} }, nestedArray: [0, 1, 2.3] };

            expect(xmlDocumentToJSONString(objectToXMLDocument(data3, window), window)).to.equal(
                JSON.stringify(data3)
            );
        });

        it("should handle nested objects and arrays with numbers/booleans", () => {
            const formData = objectToFormData(data2, window);
            const convertedData = formDataToObject<typeof data2>(formData, window);

            expect(convertedData.user.name).to.equal(data2.user.name);
            expect(convertedData.user.age).to.equal(data2.user.age);
            expect(convertedData.user.active).to.equal(data2.user.active);
            expect(convertedData.user.nested).to.deep.equal(data2.user.nested);
        });

        it("should handle Files by storing minimal metadata", () => {
            const file = new window.File(["abc"], "test.txt", { type: "text/plain" });
            const data = { docs: [file], single: file };
            const xmlDocument = objectToXMLDocument(data, window);
            const convertedData = xmlDocumentToObject<typeof data>(xmlDocument, window);

            expect(convertedData.docs).to.have.length(1);
            expect(convertedData.docs[0]).to.have.property("name", "test.txt");
            expect(convertedData.docs[0]).to.have.property("type", "text/plain");
            expect(convertedData.docs[0]).to.have.property("size", 3);

            expect(convertedData.single).to.have.property("name", "test.txt");
            expect(convertedData.single).to.have.property("type", "text/plain");
            expect(convertedData.single).to.have.property("size", 3);
        });

        it("should handle Dates", () => {
            const date = new Date("2025-01-01T00:00:00Z");
            const data = { created: date };
            const xmlDocument = objectToXMLDocument(data, window);
            const convertedData = xmlDocumentToObject(xmlDocument, window);

            expect(convertedData.created).to.deep.equal(date);
        });
    });
});
