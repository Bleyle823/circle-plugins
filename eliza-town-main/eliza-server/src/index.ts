import type { IAgentRuntime, Project, ProjectAgent } from '@elizaos/core';
import { createTownCharacterTemplate } from './character.js';

const townAgent: ProjectAgent = {
  character: createTownCharacterTemplate(),
  init: async (runtime: IAgentRuntime) => {
    console.log(`[eliza-town] ${runtime.character.name} ready with Circle wallet plugin`);
  },
};

const project: Project = {
  agents: [townAgent],
};

export default project;
