import { defineConfig } from "cypress";
import { createConfig } from "cypress-interceptor-share/cypress.config";

export default defineConfig(createConfig(true));
