/**
 * Haptic Feedback Utilities
 * 
 * Uses the Vibration API to provide tactile feedback on mobile devices.
 * Falls back gracefully on devices that don't support vibration.
 */

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

// Vibration patterns in milliseconds
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,        // Very subtle tap
  medium: 20,       // Standard button press
  heavy: 40,        // Stronger feedback for important actions
  success: [10, 50, 20],  // Quick double pulse for success
  warning: [30, 30, 30],  // Alert pattern
  error: [50, 30, 50, 30, 50],  // Error shake pattern
  selection: 5,     // Ultra-light for selection changes
};

/**
 * Check if the Vibration API is supported
 */
export function isHapticSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic feedback with a specific pattern
 * @param pattern - The type of haptic feedback to trigger
 * @returns true if vibration was triggered, false otherwise
 */
export function triggerHaptic(pattern: HapticPattern = 'light'): boolean {
  if (!isHapticSupported()) {
    return false;
  }

  try {
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    return navigator.vibrate(vibrationPattern);
  } catch {
    // Silently fail if vibration is not allowed (e.g., user hasn't interacted yet)
    return false;
  }
}

/**
 * Cancel any ongoing vibration
 */
export function cancelHaptic(): void {
  if (isHapticSupported()) {
    navigator.vibrate(0);
  }
}

/**
 * Create a haptic-enabled click handler
 * @param handler - The original click handler
 * @param pattern - The haptic pattern to use
 * @returns A wrapped handler that triggers haptic feedback
 */
export function withHaptic<E extends React.SyntheticEvent>(
  handler: ((event: E) => void) | undefined,
  pattern: HapticPattern = 'light'
): (event: E) => void {
  return (event: E) => {
    triggerHaptic(pattern);
    handler?.(event);
  };
}

