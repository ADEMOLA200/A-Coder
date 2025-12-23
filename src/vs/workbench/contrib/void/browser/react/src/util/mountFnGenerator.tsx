/*--------------------------------------------------------------------------------------
 *  Copyright 2025 Glass Devtools, Inc. All rights reserved.
 *  Licensed under the Apache License, Version 2.0. See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------*/

import React, { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom/client'
import { _registerServices } from './services.js';


import { ServicesAccessor } from '../../../../../../../editor/browser/editorExtensions.js';

export const mountFnGenerator = (Component: (params: any) => React.ReactNode) => (rootElement: HTMLElement, accessor: ServicesAccessor, props?: any, ownerDocument: Document = document) => {
	if (typeof ownerDocument === 'undefined') {
		console.error('mountFnGenerator error: document was undefined')
		return
	}

	const disposables = _registerServices(accessor)

	// ensure the rootElement is NOT yet in the auxiliary window document if we want to use ownerDocument
	const root = ReactDOM.createRoot(rootElement)

	const rerender = (props?: any) => {
		root.render(<Component accessor={accessor} {...props} />); // tailwind dark theme indicator
	}
	const dispose = () => {
		root.unmount();
		disposables.forEach(d => d.dispose());
	}

	rerender(props)

	const returnVal = {
		rerender,
		dispose,
	}
	return returnVal
}
