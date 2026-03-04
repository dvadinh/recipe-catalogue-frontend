export const OAuth2QueryParameter = {
  TARGET_URL: "target_url",
  STATUS: "status",
  ERROR: "error",
  STATUS_SUCCESS_VALUE: "oauth2_success",
  STATUS_FAILURE_VALUE: "oauth2_failure",
  RETURN_TO: "return_to",
  RETURN_TO_PROFILE_VALUE: "profile",
  RETURN_TO_SIGN_IN_VALUE: "sign-in",
  RETURN_TO_SIGN_UP_VALUE: "sign-up",
  MESSAGE_TYPE: "type",
  MESSAGE_TYPE_SUCCESS_VALUE: "success",
  MESSAGE_TYPE_ERROR_VALUE: "error",
  MESSAGE: "message",
} as const;

export type OAuth2QueryParameter = typeof OAuth2QueryParameter[keyof typeof OAuth2QueryParameter];
