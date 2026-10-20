import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase ID tokens ki public keys (Google ki taraf se)
const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

export const verifyGoogleToken = async (idToken) => {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is missing in .env");
  }

  // Signature, expiry, issuer aur audience (tumhara project) sab check hota hai
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  return payload;
};