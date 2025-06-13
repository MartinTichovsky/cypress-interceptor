/// <reference types="cypress" preserve="true" />

import { ConsoleLogType } from "../types/WatchTheConsole.types";

export type OnLogFunction = (type: ConsoleLogType, ...args: unknown[]) => void;

export class ConsoleProxy {
    private _onLog?: OnLogFunction;
    private _win?: Cypress.AUTWindow;

    set win(win: Cypress.AUTWindow) {
        this._win = win;
    }

    get win() {
        return this._win ?? window;
    }

    set onLog(onLog: OnLogFunction | undefined) {
        this._onLog = onLog;
    }

    get onLog(): OnLogFunction {
        return (
            this._onLog ??
            (() => {
                //
            })
        );
    }
}
