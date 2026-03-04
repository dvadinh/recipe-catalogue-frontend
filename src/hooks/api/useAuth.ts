import {axiosGet, axiosPost, axiosDelete, axiosPatch, constructBasicAuthorizationHeader} from '../../utils';
import type {ApiResult, UserDetailsResponse, LinkedOAuth2AccountResponse, PatchUsernamePasswordRequest, PatchUserRequest} from '../../types';

// WHO_AM_I - plain async function
export async function whoAmI(): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosGet<UserDetailsResponse>('/auth/who-am-i');
}

// Sign out
export async function signOut(): Promise<ApiResult<void>> {
  return await axiosPost<null, void>('/auth/sign-out', null);
}

export async function refreshToken(): Promise<ApiResult<void>> {
  return await axiosPost<null, void>('/auth/refresh', null);
}

export async function basicSignUp(username: string, password: string): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosPost<null, UserDetailsResponse>(
      '/auth/basic/sign-up',
      null,
      {
        headers: {
          Authorization: constructBasicAuthorizationHeader(username, password),
        },
      }
  );
}

export async function basicSignIn(username: string, password: string): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosPost<null, UserDetailsResponse>(
      '/auth/basic/sign-in',
      null,
      {
        headers: {
          Authorization: constructBasicAuthorizationHeader(username, password),
        },
      }
  );
}

// Get linked OAuth2 accounts for a user
export async function getLinkedOAuth2Accounts(userId: number): Promise<ApiResult<LinkedOAuth2AccountResponse[]>> {
  return await axiosGet<LinkedOAuth2AccountResponse[]>(`/users/${userId}/oauth2-accounts`);
}

// Unlink OAuth2 account
export async function unlinkOAuth2Account(provider: string): Promise<ApiResult<void>> {
  return await axiosDelete<null, void>(`/auth/oauth2/unlink/${provider}`, null);
}

// Patch username and password
export async function patchCredentials(request: PatchUsernamePasswordRequest): Promise<ApiResult<void>> {
  return await axiosPatch<PatchUsernamePasswordRequest, void>('/auth/basic/credentials', request);
}

// Patch user details
export async function patchUser(userId: number, request: PatchUserRequest): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosPatch<PatchUserRequest, UserDetailsResponse>(`/users/${userId}`, request);
}
