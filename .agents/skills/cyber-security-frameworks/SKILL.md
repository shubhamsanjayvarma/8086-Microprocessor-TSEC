---
name: cyber-security-frameworks
description: Provides guidelines for testing code against cyber attacks, specifically utilizing the Microsoft STRIDE framework and the OWASP Top 10. Use this skill when generating test scripts for security vulnerabilities.
---

# Cyber Security Frameworks

When generating security test scripts or evaluating code for vulnerabilities, always refer to the following established frameworks:

## 1. Microsoft STRIDE Framework
Use STRIDE to identify threats during the design and testing phases:
- **Spoofing**: Can an attacker impersonate something or someone else? (Test authentication mechanisms and session management).
- **Tampering**: Can an attacker modify data in transit or at rest? (Test data validation, integrity checks, and parameter pollution).
- **Repudiation**: Can an attacker perform an action without it being logged or traced back to them? (Test audit logging).
- **Information Disclosure**: Can an attacker access confidential data? (Test access controls, encryption, and error message verbosity).
- **Denial of Service (DoS)**: Can an attacker interrupt the system's normal operation? (Test rate limiting, payload size limits).
- **Elevation of Privilege**: Can an unprivileged user gain higher access? (Test authorization and role-based access controls).

## 2. OWASP Top 10
Ensure your test scripts actively attempt to exploit the following critical web application security risks:
1. **Broken Access Control**: Test bypassing access control checks, IDOR (Insecure Direct Object Reference), and forced browsing.
2. **Cryptographic Failures**: Test for sensitive data exposure (e.g., transmitting passwords in plain text).
3. **Injection**: Test for SQL injection, Cross-Site Scripting (XSS), and Command Injection by passing malicious payloads (e.g., `' OR 1=1 --`).
4. **Insecure Design**: Test architectural flaws (e.g., lack of anti-bot protections or weak password policies).
5. **Security Misconfiguration**: Test for exposed default accounts, open cloud storage, and verbose error messages.
6. **Vulnerable and Outdated Components**: Ensure dependencies are tested or verified against known CVEs.
7. **Identification and Authentication Failures**: Test for brute force vulnerability, weak session IDs, and session fixation.
8. **Software and Data Integrity Failures**: Test for insecure deserialization or trusting unverified inputs.
9. **Security Logging and Monitoring Failures**: Ensure the application logs failed login attempts and high-value transactions.
10. **Server-Side Request Forgery (SSRF)**: Test if the application fetches remote resources without validating the user-supplied URL.

## Implementation Guidelines for TDD
When following Test-Driven Development (TDD) as mandated by your project rules, your security test scripts must proactively mimic the attacks described above. Ensure you write tests that intentionally pass bad, malicious, or elevated data to prove the guardrails work correctly.
