import {axiosGet, axiosPost, axiosDelete} from '../../utils';
import type {ApiResult, UserSummaryResponse, UserDetailsResponse, PostUserRequest, DeleteUserRequest} from '../../types';

// Overload signatures
export async function getUsers(summary: true): Promise<ApiResult<UserSummaryResponse[]>>;
export async function getUsers(summary: false): Promise<ApiResult<UserDetailsResponse[]>>;
export async function getUsers(summary?: boolean): Promise<ApiResult<UserSummaryResponse[] | UserDetailsResponse[]>>;

// Implementation
export async function getUsers(summary: boolean = false): Promise<ApiResult<UserSummaryResponse[] | UserDetailsResponse[]>> {
  const params = summary ? '?summary=true' : '?summary=false';
  if (summary) {
    return await axiosGet<UserSummaryResponse[]>(`/users${params}`);
  } else {
    return await axiosGet<UserDetailsResponse[]>(`/users${params}`);
  }
}

// Get user by ID
export async function getUserById(userId: number): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosGet<UserDetailsResponse>(`/users/${userId}`);
}

// Create new user
export async function postUser(request: PostUserRequest): Promise<ApiResult<UserDetailsResponse>> {
  return await axiosPost<PostUserRequest, UserDetailsResponse>('/users', request);
}

// Delete users
export async function deleteUsers(request: DeleteUserRequest): Promise<ApiResult<void>> {
  return await axiosDelete<DeleteUserRequest, void>('/users', request);
}
