/// Riverpod 3 retries failing providers up to 10 times by default, including
/// 4xx/401/429. The app never retries automatically: screens expose an
/// explicit retry button (doc 01 §10). Pass as `ProviderScope(retry: ...)`.
Duration? noAutomaticRetry(int retryCount, Object error) => null;
