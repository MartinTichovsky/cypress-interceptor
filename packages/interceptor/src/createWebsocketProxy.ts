import { WindowTypeOfWebsocketProxy } from "../WebsocketInterceptor.types";
import { WebsocketListener } from "./websocketListener";

const getQueryObjectFromString = (url: string) => {
    const urlObject = new URL(url.toString());
    const queryArray = [...urlObject.searchParams.entries()];

    const result: Record<string, string | number> = {};

    for (const entry of queryArray) {
        result[entry[0]] = entry[1];
    }

    return result;
};

export const createWebsocketProxy = (websocketListener: WebsocketListener) => {
    const listener = (win: WindowTypeOfWebsocketProxy) => {
        if (win.originWebSocket === undefined) {
            win.originWebSocket = win.WebSocket;
        }

        class WebSocketProxy extends win.originWebSocket {
            private _URL: {
                query: Record<string, string | number>;
                url: string;
                urlQuery: string;
            };

            constructor(
                url: string | URL,
                private protocols?: string | string[]
            ) {
                super(url, protocols);

                this._URL = {
                    query: getQueryObjectFromString(url.toString()),
                    url: url.toString().replace(/\?(.*)/, ""),
                    urlQuery: url.toString()
                };

                websocketListener.fireAction({
                    protocols: this.protocols,
                    type: "create",
                    ...this._URL
                });

                // create to catch actions if not set
                this.onclose = () => {
                    //
                };

                this.onerror = () => {
                    //
                };

                this.onmessage = () => {
                    //
                };
            }

            close(code?: number | undefined, reason?: string | undefined): void {
                websocketListener.fireAction({
                    data: {
                        code,
                        reason
                    },
                    protocols: this.protocols,
                    type: "close",
                    ...this._URL
                });

                return super.close(code, reason);
            }

            set onclose(value: (ev: CloseEvent) => void) {
                super.onclose = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onclose",
                        ...this._URL
                    });

                    return value(ev);
                };
            }

            set onerror(value: (ev: Event) => void) {
                super.onerror = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onerror",
                        ...this._URL
                    });

                    return value(ev);
                };
            }

            error(ev: Event) {
                super.onerror?.(ev);
            }

            set onopen(value: (ev: Event) => void) {
                super.onopen = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onopen",
                        ...this._URL
                    });

                    return value(ev);
                };
            }

            send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
                websocketListener.fireAction({
                    data,
                    protocols: this.protocols,
                    type: "send",
                    ...this._URL
                });

                return super.send(data);
            }

            set onmessage(value: (ev: MessageEvent<unknown>) => void) {
                super.onmessage = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onmessage",
                        ...this._URL
                    });

                    return value(ev);
                };
            }
        }

        win.WebSocket = WebSocketProxy;
    };

    return listener;
};
