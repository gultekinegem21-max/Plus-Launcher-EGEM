# Implementation Plan - Remove Selected Buttons and Feedback Input

Remove the selected UI elements identified in the Settings modal:
1. The **App Feedback** input section (input field, send button, and feedback state).
2. The selected buttons within the **Administrator** unlocked view:
   - "Add App / Icon" button
   - "Delete Apps" button
   - "View User Feedback" button (and feedback inbox viewer)

The Admin PIN unlock verification (`3443`) will be preserved, showing an authorized administrator status badge once authenticated.

---

## Proposed Changes

### `components/SettingsModal.tsx`

1. **Remove App Feedback Section**:
   - Remove the feedback text input, send button, and feedback notification banner.
   - Clean up unused local states (`feedback`, `feedbackSent`, `feedbacks`, `isViewingFeedback`, and `handleSendFeedback`).
   - Remove the adjacent divider line (`<div className="h-px bg-gray-700" />`) to maintain uniform spacing.

2. **Update Administrator Section**:
   - Retain the Admin PIN prompt (`Enter Admin PIN` and `Unlock` button) and validation logic (PIN `3443`).
   - When unlocked, remove the three selected buttons:
     - "Add App / Icon"
     - "Delete Apps"
     - "View User Feedback"
   - Display an authorized administrator status banner (e.g., `Administrator Mode: Active • System Access Granted`) along with a lock/re-lock toggle button.

---

## Verification Plan

### Automated Checks
- Run `compile_applet` to ensure there are no TypeScript syntax errors, unused variable issues, or broken tags.

### Manual Verification
1. Open the **Settings** modal:
   - Confirm that the **App Feedback** input box and send button are no longer present.
   - Confirm spacing between surrounding settings sections (Customization Mode, Lock Screen) remains clean.
2. In the **Administrator** section:
   - Confirm the Admin PIN input and Unlock button are still functional.
   - Enter `3443` and click Unlock.
   - Confirm that the three selected buttons ("Add App", "Delete Apps", "View User Feedback") have been removed.
   - Confirm that the administrator active state is displayed cleanly without broken layouts.
