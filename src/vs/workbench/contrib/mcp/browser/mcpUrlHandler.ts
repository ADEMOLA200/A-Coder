/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { VSBuffer } from '../../../../base/common/buffer.js';
import { Lazy } from '../../../../base/common/lazy.js';
import { Disposable } from '../../../../base/common/lifecycle.js';
import { Schemas } from '../../../../base/common/network.js';
import { URI } from '../../../../base/common/uri.js';
import { IFileService } from '../../../../platform/files/common/files.js';
import { InMemoryFileSystemProvider } from '../../../../platform/files/common/inMemoryFilesystemProvider.js';
import { IInstantiationService } from '../../../../platform/instantiation/common/instantiation.js';
import { McpConfigurationServer } from '../../../../platform/mcp/common/mcpPlatformTypes.js';
import { IProductService } from '../../../../platform/product/common/productService.js';
import { IOpenURLOptions, IURLHandler, IURLService } from '../../../../platform/url/common/url.js';
import { IWorkbenchContribution } from '../../../common/contributions.js';
import { McpAddConfigurationCommand } from './mcpCommandsAddConfiguration.js';

const providerScheme = 'mcp-install';

/**
 * Handles MCP installation URLs.
 *
 * Supports three URL formats for universal compatibility:
 * 1. `mcp-install://mcp/install?{json-config}` - A-Coder's native MCP-specific scheme
 * 2. `vscode://mcp/install?{json-config}` - Standard VS Code MCP format (universal)
 * 3. `{app-protocol}://mcp/install?{json-config}` - App-specific protocol (e.g., `acoder://mcp/install`)
 *
 * The JSON config should contain:
 * - name: string - The server name
 * - type: 'stdio' | 'sse' - The server type
 * - For stdio: command, args?, env?
 * - For sse: url, headers?
 */
export class McpUrlHandler extends Disposable implements IWorkbenchContribution, IURLHandler {
	public static readonly scheme = providerScheme;

	private readonly _appUrlProtocol: string;

	private readonly _fileSystemProvider = new Lazy(() => {
		return this._instaService.invokeFunction(accessor => {
			const fileService = accessor.get(IFileService);
			const filesystem = new InMemoryFileSystemProvider();
			this._register(fileService.registerProvider(providerScheme, filesystem));
			return providerScheme;
		});
	});

	constructor(
		@IURLService urlService: IURLService,
		@IInstantiationService private readonly _instaService: IInstantiationService,
		@IFileService private readonly _fileService: IFileService,
		@IProductService productService: IProductService,
	) {
		super();
		this._appUrlProtocol = productService.urlProtocol;
		this._register(urlService.registerHandler(this));
	}

	async handleURL(uri: URI, options?: IOpenURLOptions): Promise<boolean> {
		// Check for MCP install URL in any supported format:
		// Format 1 (native mcp-install scheme): mcp-install://mcp/install?{json}
		// Format 2 (vscode standard): vscode://mcp/install?{json}
		// Format 3 (app-specific protocol): {app-protocol}://mcp/install?{json}
		const isNativeMcpInstall = uri.scheme === providerScheme && uri.path === 'mcp/install';
		const isVscodeMcpInstall = uri.scheme === Schemas.vscode && uri.authority === 'mcp' && uri.path === '/install';
		const isAppMcpInstall = uri.scheme === this._appUrlProtocol && uri.authority === 'mcp' && uri.path === '/install';

		if (!isNativeMcpInstall && !isVscodeMcpInstall && !isAppMcpInstall) {
			return false;
		}

		let parsed: McpConfigurationServer & { name: string };
		try {
			parsed = JSON.parse(decodeURIComponent(uri.query));
		} catch (e) {
			return false;
		}

		const { name, ...rest } = parsed;

		const scheme = this._fileSystemProvider.value;
		const fileUri = URI.from({ scheme, path: `/${encodeURIComponent(name)}.json` });

		await this._fileService.writeFile(
			fileUri,
			VSBuffer.fromString(JSON.stringify(rest, null, '\t')),
		);

		const addConfigHelper = this._instaService.createInstance(McpAddConfigurationCommand, undefined);
		addConfigHelper.pickForUrlHandler(fileUri, true);

		return Promise.resolve(true);
	}
}
