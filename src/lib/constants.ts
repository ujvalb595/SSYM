/**
 * Organization level constants and database query filters
 */

export const ORGANIZATION_EMAIL = "shivsaiyuvakmandal@gmail.com";
export const ORGANIZATION_NAME = "Shiv Sai Yuvak Mandal";

export const EXCLUDE_ORG_USER_FILTER = {
  NOT: [
    { email: ORGANIZATION_EMAIL },
    { name: { equals: ORGANIZATION_NAME, mode: "insensitive" as const } },
  ],
};
