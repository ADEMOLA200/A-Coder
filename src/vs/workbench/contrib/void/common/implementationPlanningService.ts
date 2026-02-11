/*---------------------------------------------------------------------------------------------
 *  Copyright 2026 The A-Tech Corporation PTY LTD. All rights reserved.
 *  Licensed under the Apache License, Version 2.0 See LICENSE.txt for more information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Implementation Planning Service - Manages AI agent implementation plans with preview functionality
 * Allows the AI to create detailed implementation plans, track step progress, and integrate with walkthrough preview
 */

export type StepId = string;

export type StepStatus = 'pending' | 'in_progress' | 'complete' | 'failed' | 'skipped';

export type Complexity = 'simple' | 'medium' | 'complex';

export interface ImplementationStep {
	id: StepId;
	title: string;
	description: string;
	complexity: Complexity;
	files: string[]; // Files that will be modified/created in this step
	dependencies: StepId[]; // Step IDs that must complete before this step can start
	estimated_time?: number; // Time estimate in minutes
	status: StepStatus;
	notes?: string; // Optional notes about the step (e.g., completion notes, error messages)
	createdAt: Date;
	updatedAt: Date;
}

export interface ImplementationPlan {
	id: string;
	goal: string; // Overall goal of the implementation plan
	steps: ImplementationStep[];
	createdAt: Date;
	updatedAt: Date;
	approved?: boolean; // Whether the user has approved this plan
}

/**
 * Ephemeral in-memory implementation planning service
 * Stores the current implementation plan for the active conversation
 * State is cleared when the IDE is restarted
 */
export class ImplementationPlanningService {
	private currentPlan: ImplementationPlan | null = null;

	/**
	 * Creates a new implementation plan, replacing any existing plan
	 */
	createImplementationPlan(
		goal: string,
		steps: Array<{
			id: string;
			title: string;
			description: string;
			complexity: Complexity;
			files: string[];
			dependencies?: string[];
			estimated_time?: number
		}>
	): ImplementationPlan {
		const now = new Date();

		this.currentPlan = {
			id: this.generatePlanId(),
			goal,
			steps: steps.map(s => ({
				...s,
				dependencies: s.dependencies || [],
				status: 'pending' as StepStatus,
				createdAt: now,
				updatedAt: now
			})),
			createdAt: now,
			updatedAt: now,
			approved: false
		};

		return this.currentPlan;
	}

	/**
	 * Gets the current implementation plan
	 */
	getCurrentPlan(): ImplementationPlan | null {
		return this.currentPlan;
	}

	/**
	 * Updates the status of a step in the current plan
	 */
	updateStepStatus(stepId: StepId, status: StepStatus, notes?: string): ImplementationStep | null {
		if (!this.currentPlan) {
			throw new Error('No active implementation plan. Create a plan first using create_implementation_plan.');
		}

		const step = this.currentPlan.steps.find(s => s.id === stepId);
		if (!step) {
			throw new Error(`Step with ID '${stepId}' not found in current plan.`);
		}

		step.status = status;
		step.notes = notes;
		step.updatedAt = new Date();
		this.currentPlan.updatedAt = new Date();

		return step;
	}

	/**
	 * Gets the next step that can be executed (all dependencies are complete and status is pending)
	 */
	getNextExecutableStep(): ImplementationStep | null {
		if (!this.currentPlan) {
			return null;
		}

		// Find steps that are pending and have all dependencies complete
		const pendingSteps = this.currentPlan.steps.filter(step => {
			if (step.status !== 'pending') {
				return false;
			}

			// Check if all dependencies are complete
			return step.dependencies.every(depId => {
				const depStep = this.currentPlan!.steps.find(s => s.id === depId);
				return depStep && depStep.status === 'complete';
			});
		});

		// Return the first pending step (maintaining order)
		return pendingSteps[0] || null;
	}

	/**
	 * Gets steps grouped by status
	 */
	getStepsByStatus(): Record<StepStatus, ImplementationStep[]> {
		if (!this.currentPlan) {
			return {
				pending: [],
				in_progress: [],
				complete: [],
				failed: [],
				skipped: []
			};
		}

		const grouped: Record<StepStatus, ImplementationStep[]> = {
			pending: [],
			in_progress: [],
			complete: [],
			failed: [],
			skipped: []
		};

		for (const step of this.currentPlan.steps) {
			grouped[step.status].push(step);
		}

		return grouped;
	}

	/**
	 * Gets a summary of the current plan status
	 */
	getPlanSummary(): string | null {
		if (!this.currentPlan) {
			return null;
		}

		const { steps } = this.currentPlan;
		const completed = steps.filter(s => s.status === 'complete').length;
		const total = steps.length;
		const progress = Math.round((completed / total) * 100);

		const nextStep = this.getNextExecutableStep();
		const nextStepInfo = nextStep ? `\nNext: ${nextStep.title}` : '';

		return `Implementation Plan: "${this.currentPlan.goal}"\nProgress: ${completed}/${total} steps (${progress}%)${nextStepInfo}`;
	}

	/**
	 * Approves the current implementation plan for execution
	 */
	approvePlan(): void {
		if (!this.currentPlan) {
			throw new Error('No active implementation plan to approve.');
		}

		this.currentPlan.approved = true;
		this.currentPlan.updatedAt = new Date();
	}

	/**
	 * Checks if the current plan is approved
	 */
	isPlanApproved(): boolean {
		return this.currentPlan?.approved || false;
	}

	/**
	 * Clears the current plan
	 */
	clearPlan(): void {
		this.currentPlan = null;
	}

	/**
	 * Generates a unique plan ID
	 */
	private generatePlanId(): string {
		return `impl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}
}

// Singleton instance for the application
export const implementationPlanningService = new ImplementationPlanningService();
