/// Shared user-visible copy (English now; ready for Hindi/Punjabi).
/// Feature-specific strings are added next to the feature that uses them.
class Strings {
  const Strings._();

  static const appName = 'CYD';

  // Network
  static const offline = 'You appear to be offline. Check your connection.';
  static const timeout = 'The server took too long to respond. Please retry.';
  static const unknownError = 'Something went wrong. Please try again.';
  static const notFound = 'Not found.';
  static const sessionExpired = 'Session expired. Please login again.';
  static const wakingServer = 'Waking up the server…';
  static const tapToRetry = 'Tap to retry';

  // Debug screens (dev only)
  static const debugHealthTitle = 'Backend health';
  static const debugHealthLink = 'Backend health (debug)';
  static const debugBaseUrl = 'Base URL';

  // Placeholders (M0)
  static const splashTitle = 'CYD';
  static const loginTitle = 'Login';
}
