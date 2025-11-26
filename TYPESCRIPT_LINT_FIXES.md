# TypeScript Lint Fixes - Implementation Planning Tools

## Issue
After implementing the ReAct pattern, several TypeScript lint errors appeared related to missing implementation planning tools in the UI type definitions.

## Root Cause
New implementation planning tools were added to the system but not properly defined in the SidebarChat.tsx type mappings:
- `create_implementation_plan`
- `preview_implementation_plan`
- `execute_implementation_plan`
- `update_implementation_step`
- `get_implementation_status`

## Fixes Applied

### 1. Added Missing Tool Titles
**File:** `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines:** 1896-1901

Added the missing implementation planning tools to `titleOfBuiltinToolName`:
```typescript
// Implementation Planning tools
'create_implementation_plan': { done: 'Created implementation plan', proposed: 'Create implementation plan', running: loadingTitleWrapper('Creating implementation plan') },
'preview_implementation_plan': { done: 'Previewed implementation plan', proposed: 'Preview implementation plan', running: loadingTitleWrapper('Previewing implementation plan') },
'execute_implementation_plan': { done: 'Executed implementation plan', proposed: 'Execute implementation plan', running: loadingTitleWrapper('Executing implementation plan') },
'update_implementation_step': { done: 'Updated implementation step', proposed: 'Update implementation step', running: loadingTitleWrapper('Updating implementation step') },
'get_implementation_status': { done: 'Got implementation status', proposed: 'Get implementation status', running: loadingTitleWrapper('Getting implementation status') },
```

### 2. Added Missing Tool Descriptions
**File:** `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/SidebarChat.tsx`
**Lines:** 2094-2122

Added the missing implementation planning tools to `toolNameToDesc` function:
```typescript
// Implementation Planning tools
'create_implementation_plan': () => {
    const toolParams = _toolParams as BuiltinToolCallParams['create_implementation_plan']
    return {
        desc1: `"${toolParams.goal}"`,
    }
},
'preview_implementation_plan': () => {
    return {
        desc1: 'Preview implementation plan',
    }
},
'execute_implementation_plan': () => {
    const toolParams = _toolParams as BuiltinToolCallParams['execute_implementation_plan']
    return {
        desc1: toolParams.step_id ? `Step: ${toolParams.step_id}` : 'Execute all steps',
    }
},
'update_implementation_step': () => {
    const toolParams = _toolParams as BuiltinToolCallParams['update_implementation_step']
    return {
        desc1: `Step: ${toolParams.step_id} → ${toolParams.status}`,
    }
},
'get_implementation_status': () => {
    return {
        desc1: 'Get implementation status',
    }
},
```

### 3. Fixed WalkthroughResultWrapper Type
**File:** `src/vs/workbench/contrib/void/browser/react/src/sidebar-tsx/WalkthroughResultWrapper.tsx`
**Lines:** 17-22

Updated the interface to allow `null` results for `tool_request` messages:
```typescript
result?: {
    success: boolean
    filePath: string
    action: 'created' | 'updated' | 'appended'
    preview: string
} | null
```

## Result
All TypeScript lint errors have been resolved:
- ✅ `titleOfBuiltinToolName` now includes all implementation planning tools
- ✅ `toolNameToDesc` function handles all implementation planning tools
- ✅ `WalkthroughResultWrapper` accepts nullable result types
- ✅ Type safety maintained throughout the UI

The implementation planning tools now have proper UI titles and descriptions, and the TypeScript compiler is satisfied.
