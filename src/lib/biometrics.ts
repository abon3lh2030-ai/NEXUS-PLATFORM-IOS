import * as LocalAuthentication from 'expo-local-authentication';

export async function biometricsAvailable(): Promise<boolean> {
  const [hardware, enrolled] = await Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()]);
  return hardware && enrolled;
}

/**
 * Face ID, falling back to the phone passcode if Face ID fails (iOS shows "Enter Passcode").
 * Resolves false if the user cancels.
 */
export async function authenticate(promptMessage: string): Promise<boolean> {
  try {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage, cancelLabel: 'إلغاء', fallbackLabel: 'استخدم رمز الجوال', disableDeviceFallback: false });
    return r.success;
  } catch {
    return false;
  }
}
