import { WindowTypeOfRequestProxy } from "../Interceptor.types";
import { createFetchProxy } from "./createFetchProxy";
import { createXMLHttpRequestProxy } from "./createXMLHttpRequestProxy";
import { RequestProxy } from "./RequestProxy";

export const createRequestProxy = (requestProxy: RequestProxy) => {
    const listener = (win: WindowTypeOfRequestProxy) => {
        requestProxy.onCreate();

        createFetchProxy(win, requestProxy);

        createXMLHttpRequestProxy(win, requestProxy);
    };

    return listener;
};
