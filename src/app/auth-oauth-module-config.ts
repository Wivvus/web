import {OAuthModuleConfig} from 'angular-oauth2-oidc';

export const authOAuthModuleConfig: OAuthModuleConfig = {
	resourceServer: {
		allowedUrls: ['http://localhost:8080'], // list of URLs  to which the library interceptor will automatically add the access token in the request authorization header
		sendAccessToken: true
	}
};