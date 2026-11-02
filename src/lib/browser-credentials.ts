type PasswordCredentialConstructor = new (data: { id: string; password: string; name?: string }) => Credential;

/**
 * Offers to save the login in the browser's password manager, which then fills the form on the
 * next visit. Logins here are a fetch, so Chrome does not always notice that one worked; the
 * PasswordCredential API (Chromium only) tells it. If its prompt closes before the user answers,
 * Chrome keeps it under the key icon of the address bar. Other browsers detect the login when the
 * form goes away.
 */
export function offerToSavePassword(id: string, password: string, name?: string) {
  const PasswordCredential = Reflect.get(window, 'PasswordCredential') as PasswordCredentialConstructor | undefined;
  if (PasswordCredential && navigator.credentials) navigator.credentials.store(new PasswordCredential({ id, password, name })).catch(() => {});
}
