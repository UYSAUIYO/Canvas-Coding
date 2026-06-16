import { Mastra } from "@mastra/core";
import {
  projectAgent,
  moduleAgent,
  generateAgent,
  dataModelAgent,
  apiAgent,
  envAgent,
  testAgent,
  exampleAgent,
  validateAgent,
  conditionAgent,
  outputAgent,
} from "./agents";

export const mastra = new Mastra({
  agents: {
    projectAgent,
    moduleAgent,
    generateAgent,
    dataModelAgent,
    apiAgent,
    envAgent,
    testAgent,
    exampleAgent,
    validateAgent,
    conditionAgent,
    outputAgent,
  },
});
