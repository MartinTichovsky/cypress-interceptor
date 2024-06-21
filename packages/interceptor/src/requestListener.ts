type WindowState = "window:before:load" | "window:load" | "window:before:unload" | "window:unload";

type Listener = <TResult = never>(
    args:
        | [input: RequestInfo | URL, init?: RequestInit | undefined]
        | [url: string | URL | undefined, method: string | undefined],
    onrejected:
        | ((reason: unknown) => TResult | PromiseLike<TResult>)
        | undefined
        | null
        | ProgressEvent<EventTarget>,
    id: string | undefined
) => void;

export const __SKIP_ID = "-1";

export class RequestListener {
    private _currentState: WindowState | undefined;
    private _id = 0;
    private _listeners: Listener[] = [];
    private _onCreate: (() => void) | undefined;

    fireError<TResult = never>(
        args: [input: RequestInfo | URL, init?: RequestInit | undefined],
        ev: ((reason: unknown) => TResult | PromiseLike<TResult>) | undefined | null,
        id: string | undefined
    ): void;
    fireError(
        args: [url: string | URL | undefined, method: string | undefined],
        ev: ProgressEvent<EventTarget>,
        id: string | undefined
    ): void;
    fireError<TResult = never>(
        args:
            | [input: RequestInfo | URL, init?: RequestInit | undefined]
            | [url: string | URL | undefined, method: string | undefined],
        ev:
            | ((reason: unknown) => TResult | PromiseLike<TResult>)
            | undefined
            | null
            | ProgressEvent<EventTarget>,
        id: string | undefined
    ) {
        this._listeners.forEach((listener) => listener(args, ev, id));
    }

    getCurrentState() {
        return this._currentState;
    }

    onCreate() {
        this._onCreate?.();
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

    subscribe(listener: Listener, onCreate?: () => void) {
        this._listeners.push(listener);
        this._onCreate = onCreate;
    }
}
