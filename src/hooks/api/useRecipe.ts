import {axiosGet, axiosPost, axiosPut, axiosDelete, axiosPutMultipartFile, axiosPatch} from '../../utils';
import type {
  ApiResult,
  RecipeDetailsResponse,
  PostRecipeRequest,
  PutRecipeRequest,
  DeleteRecipeRequest,
  MediaResponse,
  BeneficiaryResponse,
  PostBeneficiaryRequest,
  DeleteBeneficiaryRequest,
  PatchRecipeAccessLevelRequest,
} from '../../types';

export async function getRecipes(): Promise<ApiResult<RecipeDetailsResponse[]>> {
  return await axiosGet<RecipeDetailsResponse[]>('/recipes');
}

export async function getRecipe(id: number): Promise<ApiResult<RecipeDetailsResponse>> {
  return await axiosGet<RecipeDetailsResponse>(`/recipes/${id}`);
}

export async function createRecipe(request: PostRecipeRequest): Promise<ApiResult<RecipeDetailsResponse>> {
  return await axiosPost<PostRecipeRequest, RecipeDetailsResponse>('/recipes', request);
}

export async function updateRecipe(id: number, request: PutRecipeRequest): Promise<ApiResult<RecipeDetailsResponse>> {
  return await axiosPut<PutRecipeRequest, RecipeDetailsResponse>(`/recipes/${id}`, request);
}

export async function deleteRecipes(request: DeleteRecipeRequest): Promise<ApiResult<void>> {
  return await axiosDelete<DeleteRecipeRequest, void>('/recipes', request);
}

export async function uploadRecipeMedia(recipeId: number, file: File): Promise<ApiResult<MediaResponse>> {
  return await axiosPutMultipartFile<MediaResponse>(`/recipes/${recipeId}/media`, file);
}

export async function deleteRecipeMedia(recipeId: number): Promise<ApiResult<void>> {
  return await axiosDelete<Record<string, never>, void>(`/recipes/${recipeId}/media`, {});
}

export async function uploadSectionMedia(sectionId: number, file: File): Promise<ApiResult<MediaResponse>> {
  return await axiosPutMultipartFile<MediaResponse>(`/sections/${sectionId}/media`, file);
}

export async function deleteSectionMedia(sectionId: number): Promise<ApiResult<void>> {
  return await axiosDelete<Record<string, never>, void>(`/sections/${sectionId}/media`, {});
}

export async function uploadStepMedia(stepId: number, file: File): Promise<ApiResult<MediaResponse>> {
  return await axiosPutMultipartFile<MediaResponse>(`/steps/${stepId}/media`, file);
}

export async function deleteStepMedia(stepId: number): Promise<ApiResult<void>> {
  return await axiosDelete<Record<string, never>, void>(`/steps/${stepId}/media`, {});
}

export async function getBeneficiaries(recipeId: number): Promise<ApiResult<BeneficiaryResponse[]>> {
  return await axiosGet<BeneficiaryResponse[]>(`/recipes/${recipeId}/beneficiaries`);
}

export async function addBeneficiaries(recipeId: number, request: PostBeneficiaryRequest): Promise<ApiResult<BeneficiaryResponse[]>> {
  return await axiosPost<PostBeneficiaryRequest, BeneficiaryResponse[]>(`/recipes/${recipeId}/beneficiaries`, request);
}

export async function removeBeneficiaries(recipeId: number, request: DeleteBeneficiaryRequest): Promise<ApiResult<void>> {
  return await axiosDelete<DeleteBeneficiaryRequest, void>(`/recipes/${recipeId}/beneficiaries`, request);
}

export async function updateRecipeAccessLevel(recipeId: number, request: PatchRecipeAccessLevelRequest): Promise<ApiResult<RecipeDetailsResponse>> {
  return await axiosPatch<PatchRecipeAccessLevelRequest, RecipeDetailsResponse>(`/recipes/${recipeId}/access-level`, request);
}