import { IMockResponse, IRequestInit, IResourceType } from "./Interceptor.types";

export type RequestProxyFunction = (
    request: IRequestInit,
    win: Cypress.AUTWindow,
    resourceType: IResourceType
) => Promise<RequestProxyFunctionResult>;

export interface RequestProxyFunctionResult {
    done: (response: XMLHttpRequest | Response, resolve: VoidFunction, isMock?: boolean) => void;
    error: (error: Error) => void;
    mock: IMockResponse | undefined;
}

const emptyFunction = (..._args: unknown[]) => {
    //
};

export class RequestProxy {
    private _onCreate?: VoidFunction;
    private _requestProxyFunction?: RequestProxyFunction;

    set onCreate(onCreate: VoidFunction | undefined) {
        this._onCreate = onCreate;
    }

    get onCreate() {
        return this._onCreate;
    }

    set requestProxyFunction(requestProxyFunction: RequestProxyFunction) {
        this._requestProxyFunction = requestProxyFunction;
    }

    async requestStart(request: IRequestInit, win: Cypress.AUTWindow, resourceType: IResourceType) {
        return this._requestProxyFunction
            ? await this._requestProxyFunction(request, win, resourceType)
            : {
                  done: emptyFunction,
                  error: emptyFunction,
                  mock: undefined
              };
    }
}
