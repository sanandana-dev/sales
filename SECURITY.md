# Security Policy

## Supported Versions

| Version | Supported |
| :------ | :-------- |
| 1.0.x   | Yes       |
| < 1.0.0 | No        |

---

## Reporting a Vulnerability

The project team takes security issues seriously. If you discover a security vulnerability, please do NOT create a public issue.

Instead, please send a responsible disclosure email to the maintainers at `security@sanandana.dev` with:

- A description of the vulnerability.
- Steps to reproduce or a proof of concept.
- The potential impact.

Maintainers will acknowledge receipt within 48 hours and provide a remediation timeline.

---

## Security Safeguards in Place

- **Helmet Security Middleware**: Enforces Content-Security-Policy (CSP), frame options, and referrer policy.
- **Strict Input Validation**: All endpoints enforce Zod schemas to reject unexpected or malicious inputs.
- **Rate Limiting**: Defends endpoints against brute force and denial of service.
- **Zero Secrets Scanning**: Automated pre-commit and CI scans ensure no private credentials or secrets enter the repository.
- **Container Isolation**: Multi-stage Alpine container runs as an unprivileged, non-root user (`appuser`).
