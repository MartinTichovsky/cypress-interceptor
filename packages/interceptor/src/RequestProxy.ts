/// <reference types="cypress" preserve="true" />

import { IMockResponse, IRequestInit, IResourceType } from "../Interceptor.types";

export type RequestProxyFunction = (
    request: IRequestInit,
    win: Cypress.AUTWindow,
    resourceType: IResourceType
) => Promise<RequestProxyFunctionResult>;

export interface RequestProxyFunctionResult {
    /**
     * The delay (in milliseconds) that should be applied before the real request is sent.
     * It is `undefined` when the request should not be delayed.
     */
    delay?: number;
    done: (response: XMLHttpRequest | Response, resolve: VoidFunction, isMock?: boolean) => void;
    error: (error: Error) => void;
    mock: IMockResponse | undefined;
}

const emptyFunction = (..._args: unknown[]) => {
    //
};

export const emptyProxy: RequestProxyFunctionResult = {
    done: (_response, resolve) => resolve(),
    error: emptyFunction,
    mock: undefined
};

export class RequestProxy {
    private _onCreate?: VoidFunction;
    private _requestProxyFunction?: RequestProxyFunction;

    set onCreate(onCreate: VoidFunction) {
        this._onCreate = onCreate;
    }

    get onCreate() {
        return this._onCreate ?? emptyFunction;
    }

    set requestProxyFunction(requestProxyFunction: RequestProxyFunction) {
        this._requestProxyFunction = requestProxyFunction;
    }

    async requestStart(request: IRequestInit, win: Cypress.AUTWindow, resourceType: IResourceType) {
        return this._requestProxyFunction
            ? await this._requestProxyFunction(request, win, resourceType)
            : emptyProxy;
    }
}
