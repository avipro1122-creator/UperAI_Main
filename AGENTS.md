# Project Guidelines & Agent Instructions

This project follows the **Karpathy Guidelines for AI Coding** to ensure high-quality, minimal, and robust code.

## Core Behavioral Principles

### 1. Think Before Coding
- **Never guess silently:** State assumptions explicitly.
- **Surface alternatives & trade-offs:** Don't pick arbitrary architectures when choices exist.
- **Push back on overcomplexity:** Recommend simpler alternatives when appropriate.
- **Halt on confusion:** Clarify ambiguous requirements before writing code.

### 2. Simplicity First
- **No unrequested features or speculative future-proofing.**
- **No single-use abstractions or wrapper factories.**
- **Keep code concise:** If 200 lines can be written clearly in 50, use 50.

### 3. Surgical Changes
- **Targeted diffs only:** Never reformat or refactor unrelated adjacent code.
- **Clean up your own orphans:** Remove imports/variables orphaned by your edits.
- **Preserve existing codebase style and conventions.**

### 4. Goal-Driven Execution
- **Step-by-step verification:** Establish measurable checkpoints for multi-step tasks.
- **Always verify changes:** Run builds/typechecks/tests to confirm functionality.
