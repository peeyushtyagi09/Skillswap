=== Authentication System Development Checklist ===

1. Password Handling
  [ ] Use Argon2id or bcrypt for password hashing
  [ ] Use unique salt per password
  [ ] Store only hashed passwords (no plaintext)
  [ ] (Optional) Implement server-side pepper for hashing

2. User Input Validation
  [ ] Validate input type, length, and format (frontend & backend)
  [ ] Sanitize inputs to prevent injection (SQL/NoSQL/XSS)

3. Registration / Account Creation
  [ ] Check for existing email/username to avoid duplicates
  [ ] Enforce strong password policies (min length, char variety)
  [ ] Integrate breached-password check API
  [ ] Send email verification with single-use, expiring token (hashed in DB)
  [ ] Allow resending verification email with rate limiting

4. Login
  [ ] Verify email exists and password matches (hashed)
  [ ] Implement rate limiting (per IP and per user)
  [ ] Issue short-lived access token and long-lived refresh token
  [ ] Store refresh token in HTTP-only, Secure, SameSite cookie
  [ ] Support optional MFA / 2FA

5. Token Management
  [ ] Use JWT or opaque tokens with proper claims (exp, iat, sub, jti)
  [ ] Set short expiry for access tokens; longer for refresh tokens
  [ ] Rotate refresh tokens on use; revoke old tokens
  [ ] Maintain server-side blacklist/store for revoked tokens

6. Session Management & Cookies
  [ ] Regenerate session ID after login to prevent fixation
  [ ] Set cookies with HttpOnly, Secure, SameSite flags
  [ ] Enforce HTTPS everywhere (redirect HTTP to HTTPS)
  [ ] Add security headers (HSTS, CSP, X-Frame-Options, etc.)

7. Password Reset Flow
  [ ] Allow password reset requests via email
  [ ] Generate cryptographically secure reset tokens (hashed in DB)
  [ ] Expire reset tokens (e.g., after 1 hour)
  [ ] Throttle reset requests by IP/email
  [ ] Invalidate all sessions/tokens on password reset

8. CSRF Protection
  [ ] Use SameSite attribute on auth cookies
  [ ] Require CSRF tokens on state-changing requests (POST/PUT/DELETE)
  [ ] Validate Origin or Referer headers

9. Logging & Monitoring
  [ ] Log login attempts, password resets, token refreshes (no sensitive data)
  [ ] Alert on suspicious activity (e.g., multiple failures, token reuse)
  [ ] Setup monitoring/alert system

10. User Experience & Security Balance
  [ ] Use generic error messages to prevent user enumeration
  [ ] Support account lockout with unlock/reset process
  [ ] Provide clear feedback on verification/reset flows
  [ ] Use CAPTCHA on suspicious or repeated requests

11. Compliance & Privacy
  [ ] Minimize data collection and storage
  [ ] Encrypt sensitive data at rest
  [ ] Provide users ability to delete their data completely
  [ ] Comply with GDPR/CCPA or other relevant laws

12. Optional Enhancements
  [ ] Support social login (Google, GitHub, etc.)
  [ ] Implement Multi-Factor Authentication (MFA)
  [ ] Send email notifications on suspicious login or password changes
  [ ] Provide account activity dashboard (login history, devices)

=== END OF CHECKLIST ===
