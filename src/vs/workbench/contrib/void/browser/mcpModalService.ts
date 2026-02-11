/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import { Emitter, Event } from '../../../../base/common/event.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { createDecorator } from '../../../../platform/instantiation/common/instantiation.js';
import { registerSingleton, InstantiationType } from '../../../../platform/instantiation/common/extensions.js';

export const IMCPModalService = createDecorator<IMCPModalService>('mcpModalService');

export interface IMCPModalService {
	readonly _serviceBrand: undefined;
	readonly onDidRequestOpen: Event<void>;
	openModal(): void;
}

export class MCPModalService extends Disposable implements IMCPModalService {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidRequestOpen = this._register(new Emitter<void>());
	readonly onDidRequestOpen: Event<void> = this._onDidRequestOpen.event;

	openModal(): void {
		this._onDidRequestOpen.fire();
	}
}

registerSingleton(IMCPModalService, MCPModalService, InstantiationType.Delayed);
