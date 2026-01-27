{/* Mobile API section */ }
<div className={shouldShowTab('mobileApi') ? `` : 'hidden'}>
	<ErrorBoundary>
		<h2 className='text-3xl mb-2'>Mobile API</h2>
		<h4 className='text-void-fg-3 mb-4'>
			Enable the Mobile API to access A-Coder from a companion mobile app. Provides secure access to chat threads, workspace files, and planning features. API binds to localhost only.
		</h4>

		{/* Enable API */}
		<div className='my-4'>
			<ErrorBoundary>
				<div className='flex items-center gap-x-2'>
					<VoidSwitch
						size='xs'
						value={!!settingsState.globalSettings.apiEnabled}
						onChange={(newValue) => voidSettingsService.setGlobalSetting('apiEnabled', newValue)}
					/>
					<span className='text-void-fg-3 text-xs'>Enable Mobile API</span>
				</div>
			</ErrorBoundary>
		</div>

		{/* API Port */}
		<div className='my-4'>
			<label className='text-void-fg-3 text-xs block mb-1'>API Port</label>
			<input
				type='number'
				className='bg-void-bg-2 text-void-fg-1 px-3 py-1.5 rounded text-sm w-32'
				value={settingsState.globalSettings.apiPort}
				onChange={(e) => {
					const port = parseInt(e.target.value);
					if (port >= 1024 && port <= 65535) voidSettingsService.setGlobalSetting('apiPort', port);
				}}
				min={1024}
				max={65535}
			/>
		</div>

		{/* Cloudflare Tunnel URL */}
		<div className='my-4'>
			<label className='text-void-fg-3 text-xs block mb-1'>Cloudflare Tunnel URL (Optional)</label>
			<input
				type='text'
				className='bg-void-bg-2 text-void-fg-1 px-3 py-1.5 rounded text-sm w-full max-w-md'
				value={settingsState.globalSettings.apiTunnelUrl || ''}
				onChange={(e) => voidSettingsService.setGlobalSetting('apiTunnelUrl', e.target.value || undefined)}
				placeholder='https://acoder-api.example.com'
			/>
		</div>

		{/* API Tokens */}
		<div className='my-4'>
			<label className='text-void-fg-3 text-xs block mb-2'>API Tokens</label>
			<div className='space-y-2'>
				{settingsState.globalSettings.apiTokens.length === 0 ? (
					<div className='text-void-fg-3 text-xs italic'>No tokens yet</div>
				) : (
					settingsState.globalSettings.apiTokens.map((token, idx) => (
						<div key={idx} className='flex items-center gap-2 bg-void-bg-2 px-3 py-2 rounded'>
							<code className='text-xs text-void-fg-2 flex-1 font-mono select-text cursor-text' style={{ userSelect: 'text' }}>{token}</code>
							<VoidButtonBgDarken className='px-2 py-1 text-xs' onClick={() => {
								try {
									// Try fallback method first (more reliable from click events)
									const textArea = document.createElement('textarea');
									textArea.value = token;
									textArea.style.position = 'fixed';
									textArea.style.left = '-9999px';
									document.body.appendChild(textArea);
									textArea.select();
									const success = document.execCommand('copy');
									document.body.removeChild(textArea);

									if (success) {
										notificationService.info('Copied');
										return;
									}
								} catch (e) {
									// Fallback to navigator.clipboard
								}

								// Fallback to navigator.clipboard
								if (navigator.clipboard) {
									navigator.clipboard.writeText(token).then(() => notificationService.info('Copied')).catch(() => {
										notificationService.error('Failed to copy. Please select and copy manually.');
									});
								} else {
									notificationService.error('Failed to copy. Please select and copy manually.');
								}
							}}>Copy</VoidButtonBgDarken>
							<VoidButtonBgDarken className='px-2 py-1 text-xs bg-red-900/20' onClick={() => voidSettingsService.setGlobalSetting('apiTokens', settingsState.globalSettings.apiTokens.filter((_, i) => i !== idx))}>Revoke</VoidButtonBgDarken>
						</div>
					))
				)}
			</div>
			<VoidButtonBgDarken className='px-4 py-1 mt-2' onClick={() => {
				const token = `acoder_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
				voidSettingsService.setGlobalSetting('apiTokens', [...settingsState.globalSettings.apiTokens, token]);

				try {
					// Try fallback method first (more reliable from click events)
					const textArea = document.createElement('textarea');
					textArea.value = token;
					textArea.style.position = 'fixed';
					textArea.style.left = '-9999px';
					document.body.appendChild(textArea);
					textArea.select();
					const success = document.execCommand('copy');
					document.body.removeChild(textArea);

					if (success) {
						notificationService.info('Token generated and copied');
						return;
					}
				} catch (e) {
					// Fallback to navigator.clipboard
				}

				// Fallback to navigator.clipboard
				if (navigator.clipboard) {
					navigator.clipboard.writeText(token).then(() => notificationService.info('Token generated and copied')).catch(() => {
						notificationService.info('Token generated (copy manually)');
					});
				} else {
					notificationService.info('Token generated (copy manually)');
				}
			}}>Generate New Token</VoidButtonBgDarken>
		</div>

		{/* Connection Info */}
		<div className='my-4 p-4 bg-void-bg-2 rounded'>
			<h3 className='text-sm font-semibold mb-2'>Connection Info</h3>
			<div className='text-xs text-void-fg-3 space-y-1'>
				<div><strong>URL:</strong> {settingsState.globalSettings.apiTunnelUrl || `http://localhost:${settingsState.globalSettings.apiPort}`}</div>
				<div><strong>Status:</strong> {settingsState.globalSettings.apiEnabled ? '🟢 Enabled' : '🔴 Disabled'}</div>
			</div>
		</div>

	</ErrorBoundary>
</div>
