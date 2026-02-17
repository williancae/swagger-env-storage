# Security Policy

## ⚠️ Important Security Notice

Variables are currently stored **unencrypted** in `chrome.storage.local`.

### Current Security Status

- **Storage**: Unencrypted local storage
- **Transmission**: No external network requests
- **Access**: Local-only, browser-sandboxed

### Recommendations

✅ **Safe for**:

- Development environments
- Testing and staging credentials
- Non-sensitive API keys
- Public endpoints

❌ **Avoid storing**:

- Production database passwords
- Highly sensitive API keys
- Personal access tokens with write permissions
- Payment gateway credentials
- OAuth client secrets

### Planned Security Features (v2.0)

- 🚧 Master password encryption
- 🚧 Encrypted variable storage
- 🚧 Auto-lock after inactivity
- 🚧 Optional two-factor authentication for sensitive variables

## Security Best Practices

### For Users

1. **Use separate variables for dev/staging/production**
2. **Rotate credentials regularly**
3. **Never commit exported JSON files with sensitive data**
4. **Use browser profiles for different security levels**
5. **Review variable values before exporting**

### For Developers

1. **Input sanitization** on all user-provided data
2. **Validate host patterns** against injection attacks
3. **Escape variable values** before DOM insertion
4. **Content Security Policy** compliance
5. **No `eval()` or `innerHTML` with user data**

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please **DO NOT** open a public issue.

Instead, please email: williancaecam@gmail.com

Include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 48 hours and will work with you to address the issue promptly.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | ✅ Yes             |
| < 1.0   | ❌ No              |

## Security Update Policy

- **Critical vulnerabilities**: Patched within 24-48 hours
- **High severity**: Patched within 1 week
- **Medium/Low**: Included in next scheduled release

## Acknowledgments

We appreciate the security researchers and community members who help keep this extension safe for everyone.
