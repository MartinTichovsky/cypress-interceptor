type Listener = (action: WebSocketAction) => void;

export type WebSocketAction = {
    protocols?: string | string[];
    url: string | URL;
} & (
    | {
          data?: undefined;
          type: "create";
      }
    | {
          data: {
              code?: number;
              reason?: string;
          };
          type: "close";
      }
    | {
          data: CloseEvent;
          type: "onclose";
      }
    | {
          data: MessageEvent<unknown>;
          type: "onmessage";
      }
    | {
          data: Event;
          type: "onerror" | "onopen";
      }
    | {
          data: string | ArrayBufferLike | Blob | ArrayBufferView;
          type: "send";
      }
);

export class WebsocketListener {
    private listeners: Listener[] = [];

    fireAction(action: WebSocketAction) {
        this.listeners.forEach((listener) => listener(action));
    }

    subscribe(listener: Listener) {
        this.listeners.push(listener);
    }

    unsubscribe(listener: Listener) {
        this.listeners = this.listeners.filter((entry) => entry !== listener);
    }
}
