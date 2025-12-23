/*--------------------------------------------------------------------------------------
 *  Copyright 2025 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { mountFnGenerator } from '../util/mountFnGenerator.js'
import { AgentManager } from './AgentManager.js'

export const mountAgentManager: (rootElement: HTMLElement, accessor: any, props?: any, ownerDocument?: Document) => { rerender: (props?: any) => void, dispose: () => void } = mountFnGenerator(AgentManager) as any
