import {axiosGet} from '../../utils';
import type {ApiResult, UserSummaryResponse} from '../../types';

export async function getUsers(summary: boolean = false): Promise<ApiResult<UserSummaryResponse[]>> {
  const params = summary ? '?summary=true' : '';
  return await axiosGet<UserSummaryResponse[]>(`/users${params}`);
}
