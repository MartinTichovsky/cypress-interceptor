import { DynamicRequest } from "./types";

interface URLOptions {
    duration?: number;
    status?: number;
    requests?: Record<string, unknown>[];
}

export const DEFAULT_WAITTIME = 500;

export const generateUrl = (path: string, options: URLOptions = {}) => {
    const searchParams = new URLSearchParams(optionsToURLSearch(options));
    const searchString = searchParams.toString();

    return `${path}${searchString ? "?" : ""}${searchString}`;
};

/**
 * Wait must be more then request delay because the processing time
 *
 * @param delay A delay
 * @returns Updated delay
 */
export const getDelayWait = (delay: number) => delay + DEFAULT_WAITTIME;

export const getDynamicUrl = (requests: DynamicRequest[]) =>
    generateUrl("/public/dynamic.html", { requests });

const optionsToURLSearch = <T>(object: T) => {
    const result: Record<string, string> = {};

    for (const key in object) {
        if (object[key] === undefined) {
            continue;
        }

        result[key] = JSON.stringify(object[key]);
    }

    return result;
};
