import * as testUnit from "cypress-interceptor/test.unit";

(window as unknown as { testUnit: typeof testUnit })["testUnit"] = testUnit;
