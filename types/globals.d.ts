export {}

// Create a type for the Roles
export type Roles = "admin" | "project_owner"

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles
    }
  }
}
