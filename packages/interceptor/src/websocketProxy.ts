import { WebsocketListener } from "./websocketListener";

export const createWebsocketProxy = (websocketListener: WebsocketListener) => {
    const listener = (win: Cypress.AUTWindow) => {
        class WebSocketProxy extends WebSocket {
            constructor(
                url: string | URL,
                private protocols?: string | string[]
            ) {
                super(url, protocols);

                websocketListener.fireAction({
                    protocols: this.protocols,
                    type: "create",
                    url: this.url
                });

                // create to catch actions if not set
                this.onclose = () => {
                    //
                };

                this.onerror = () => {
                    //
                };

                this.onopen = () => {
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
                    url: this.url
                });

                return super.close(code, reason);
            }

            set onclose(value: (ev: CloseEvent) => void) {
                super.onclose = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onclose",
                        url: this.url
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
                        url: this.url
                    });

                    return value(ev);
                };
            }

            set onopen(value: (ev: Event) => void) {
                super.onopen = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onopen",
                        url: this.url
                    });

                    return value(ev);
                };
            }

            send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
                websocketListener.fireAction({
                    data,
                    protocols: this.protocols,
                    type: "send",
                    url: this.url
                });

                return super.send(data);
            }

            set onmessage(value: (ev: MessageEvent<unknown>) => void) {
                super.onmessage = (ev) => {
                    websocketListener.fireAction({
                        data: ev,
                        protocols: this.protocols,
                        type: "onmessage",
                        url: this.url
                    });

                    return value(ev);
                };
            }
        }

        win.WebSocket = WebSocketProxy;

        Cypress.removeListener("window:before:load", listener);
    };

    return listener;
};
