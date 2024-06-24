type WindowState = "window:before:load" | "window:load" | "window:before:unload" | "window:unload";

export type FetchArgs = [input: RequestInfo | URL, init?: RequestInit | undefined];
export type FetchReject<TResult = never> =
    | ((reason: unknown) => TResult | PromiseLike<TResult>)
    | undefined
    | null;
export type FetchXHRArgs = FetchArgs | XHRArgs;
export type FetchXHRReject = FetchReject | XHRReject;
export type XHRArgs = [url: string | URL | undefined, method: string | undefined];
export type XHRReject = ProgressEvent<EventTarget>;

type Listener = (args: FetchXHRArgs, onrejected: FetchXHRReject, id: string | undefined) => void;

type OnRequestDone = (args: FetchXHRArgs, requestId: string | undefined) => void;

export const __SKIP_ID = "-1";

export class RequestListener {
    private _currentState: WindowState | undefined;
    private _id = 0;
    private _listeners: Listener[] = [];
    private _onCreate: (() => void) | undefined;
    private _onRequestDone: OnRequestDone | undefined;

    fireError(args: FetchArgs, ev: FetchReject, id: string | undefined): void;
    fireError(args: XHRArgs, ev: XHRReject, id: string | undefined): void;
    fireError(args: FetchXHRArgs, ev: FetchXHRReject, id: string | undefined) {
        this._listeners.forEach((listener) => listener(args, ev, id));
    }

    onCreate() {
        this._onCreate?.();
    }

    onRequestDone(args: FetchXHRArgs, requestId: string | undefined) {
        this._onRequestDone?.(args, requestId);
    }

    /**
     * Need to sync fetch/xhr calls with cy.intercept to be able cancel pending requests in the Interceptor stack
     * to prevent stuck waiting for the cancelled requests
     */
    registerId() {
        // skip requests called during unload
        return this._currentState === "window:unload" ? __SKIP_ID : (++this._id).toString();
    }

    setCurrentState(state: WindowState) {
        this._currentState = state;
    }

    subscribe(listener: Listener, onCreate?: () => void, onRequestDone?: OnRequestDone) {
        this._listeners.push(listener);
        this._onCreate = onCreate;
        this._onRequestDone = onRequestDone;
    }
}
