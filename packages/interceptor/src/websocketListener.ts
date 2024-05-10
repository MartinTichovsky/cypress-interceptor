type Listener = (action: WebSocketAction) => void;

export interface WSCreate extends WebSocketActionCommon {
    data?: undefined;
    type: "create";
}

export interface WSClose extends WebSocketActionCommon {
    data: {
        code?: number;
        reason?: string;
    };
    type: "close";
}

export interface WSOnClose extends WebSocketActionCommon {
    data: CloseEvent;
    type: "onclose";
}

export interface WSOnMessage extends WebSocketActionCommon {
    data: MessageEvent;
    type: "onmessage";
}

export interface WSOnErrorOrOnOpen extends WebSocketActionCommon {
    data: Event;
    type: "onerror" | "onopen";
}

export interface WSSend extends WebSocketActionCommon {
    data: string | ArrayBufferLike | Blob | ArrayBufferView;
    type: "send";
}

export type WebSocketAction =
    | WSCreate
    | WSClose
    | WSOnClose
    | WSOnMessage
    | WSOnErrorOrOnOpen
    | WSSend;

export type WebSocketActionCommon = {
    query: Record<string, string | number>;
    protocols?: string | string[];
    url: string;
    urlQuery: string;
};

export class WebsocketListener {
    private listeners: Listener[] = [];

    fireAction(action: WebSocketAction) {
        this.listeners.forEach((listener) => listener(action));
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
    }
}
