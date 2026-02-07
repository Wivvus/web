import { AuthConfig } from 'angular-oauth2-oidc';  

export const authConfig: AuthConfig = {
	issuer: 'https://accounts.google.com',
	clientId: '962590546273-q2bndrmlnjum0811hftn8vekfln13q9d.apps.googleusercontent.com ', // The "Auth Code + PKCE" client
	responseType: 'code',
	redirectUri: window.location.origin,
	silentRefreshRedirectUri: window.location.origin + '/silent-refresh.html',
	scope: 'openid profile email', // Ask offline_access to support refresh token refreshes
	useSilentRefresh: true, // Needed for Code Flow to suggest using iframe-based refreshes
	silentRefreshTimeout: 20000, // For faster testing
	timeoutFactor: 0.25, // For faster testing
	sessionChecksEnabled: true,
	showDebugInformation: true, // Also requires enabling "Verbose" level in devtools
	clearHashAfterLogin: false, // https://github.com/manfredsteyer/angular-oauth2-oidc/issues/457#issuecomment-431807040,
	nonceStateSeparator : 'semicolon', // Real semicolon gets mangled by Duende ID Server's URI encoding,
	strictDiscoveryDocumentValidation: false, // https://manfredsteyer.github.io/angular-oauth2-oidc/docs/additional-documentation/using-an-id-provider-that-fails-discovery-document-validation.html
};