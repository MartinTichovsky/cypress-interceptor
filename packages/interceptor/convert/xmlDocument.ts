import { isObject, valueToString } from "./common";
import { createReplacer } from "./replacer";

const __ARRAY_ITEM__ = "item";
const __TYPE_ATTRIBUTE_ARRAY__ = "array";
const __TYPE_ATTRIBUTE_DATE__ = "date";
const __TYPE_ATTRIBUTE_REGEXP__ = "regexp";

interface ObjectToXMLDocument {
    data: Record<string, unknown> | Array<unknown>;
    document: XMLDocument;
    node: Node;
    window: Cypress.AUTWindow;
}

const castValueFromElement = (element: Element) => {
    const type = element.getAttribute("type") ?? "string";
    const value = element.textContent ?? "";

    if (type === __TYPE_ATTRIBUTE_DATE__) {
        return new Date(value);
    }

    if (type === __TYPE_ATTRIBUTE_REGEXP__) {
        try {
            return new RegExp(value.slice(1, -1));
        } catch {
            //
        }
    }

    if (type === "bigint") {
        return BigInt(value.slice(0, -1));
    }

    if (type === "boolean") {
        return value === "true";
    }

    if (type === "number") {
        return Number(value);
    }

    if (type === "object" && value === "null") {
        return null;
    }

    if (type === "object" && !value) {
        return {};
    }

    if (type === "undefined") {
        return undefined;
    }

    return value;
};

export const objectToXMLDocument = <T extends Record<string, unknown>>(
    data: T,
    window: Cypress.AUTWindow
) => {
    const rootElementName = "root";
    const result = window.document.implementation.createDocument("", rootElementName, null);

    result.getRootNode();

    if (isObject(data)) {
        objectToXMLDocument_recurisive({
            data,
            document: result,
            node: result.documentElement,
            window
        });
    }

    return result;
};

const objectToXMLDocument_recurisive = ({ data, document, node, window }: ObjectToXMLDocument) => {
    if (data instanceof window.Map) {
        data = Object.fromEntries(data);
    } else if (data instanceof window.Set) {
        data = Array.from(data);
    }

    const entries = Object.entries(data);
    const isArray = Array.isArray(data);

    for (const [key, value] of entries) {
        try {
            const appendValue = (value: string, type: string) => {
                const element = document.createElement(isArray ? __ARRAY_ITEM__ : key);
                element.setAttribute("type", type);
                element.textContent = value;
                isArray && element.setAttribute("index", key);
                node.appendChild(element);
            };

            if (value instanceof window.Date) {
                appendValue(value.toISOString(), __TYPE_ATTRIBUTE_DATE__);
                continue;
            }

            if (!isObject(value)) {
                appendValue(valueToString(value), typeof value);
                continue;
            }

            if (value instanceof window.RegExp) {
                appendValue(valueToString(value), __TYPE_ATTRIBUTE_REGEXP__);
                continue;
            }

            const element = document.createElement(isArray ? __ARRAY_ITEM__ : key);
            isArray && element.setAttribute("index", key);
            node.appendChild(element);

            const nextIsArray = Array.isArray(value) || value instanceof window.Set;

            element.setAttribute("type", nextIsArray ? __TYPE_ATTRIBUTE_ARRAY__ : typeof value);

            if (value instanceof window.File) {
                objectToXMLDocument_recurisive({
                    data: {
                        name: value.name,
                        type: value.type,
                        size: value.size
                    },
                    document,
                    node: element,
                    window
                });
                continue;
            } else if (value instanceof window.Blob) {
                objectToXMLDocument_recurisive({
                    data: {
                        name: "blob",
                        type: value.type,
                        size: value.size
                    },
                    document,
                    node: element,
                    window
                });
                continue;
            }

            objectToXMLDocument_recurisive({
                data: value,
                document,
                node: element,
                window
            });
        } catch {
            // skip invalid key names
        }
    }
};

export const xmlDocumentToJSONString = (xmlDocument: XMLDocument, window: Cypress.AUTWindow) =>
    JSON.stringify(xmlDocumentToObject(xmlDocument, window), createReplacer(window));

export const xmlDocumentToObject = <T extends Record<string | number, unknown>>(
    xmlDocument: XMLDocument,
    window: Cypress.AUTWindow
): T => {
    return xmlDocumentToObject_recursive(xmlDocument.documentElement, window) as T;
};

const xmlDocumentToObject_recursive = (element: Element, window: Cypress.AUTWindow) => {
    const result: Record<string | number, unknown> = {};

    const children = Array.from(element.children);

    for (const entry of children) {
        const isArray = entry.getAttribute("type") === __TYPE_ATTRIBUTE_ARRAY__;

        if (entry.children.length) {
            result[entry.tagName] = isArray
                ? xmlDocumentToArray_recursive(entry, window)
                : xmlDocumentToObject_recursive(entry, window);
        } else {
            result[entry.tagName] = isArray ? [] : castValueFromElement(entry);
        }
    }

    return result;
};

const xmlDocumentToArray_recursive = (element: Element, window: Cypress.AUTWindow) => {
    const result: Array<unknown> = [];
    const children = Array.from(element.children);

    for (const entry of children) {
        const isArray = entry.getAttribute("type") === __TYPE_ATTRIBUTE_ARRAY__;
        let index = parseInt(entry.getAttribute("index") ?? "");

        if (isNaN(index)) {
            index = result.length;
        }

        if (entry.children.length) {
            result[index] = isArray
                ? xmlDocumentToArray_recursive(entry, window)
                : xmlDocumentToObject_recursive(entry, window);
        } else {
            result[index] = isArray ? [] : castValueFromElement(entry);
        }
    }

    return result;
};
