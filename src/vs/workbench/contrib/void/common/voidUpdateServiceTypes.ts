/*--------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

export type VoidCheckUpdateRespose = {
	message: string,
	action?: 'reinstall' | 'restart' | 'download' | 'apply'
	version?: string // The latest version available (if known)
} | {
	message: null,
	actions?: undefined,
} | null


