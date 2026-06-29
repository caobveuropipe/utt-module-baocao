# Epic: Same-project Write-path Migration

**Background**: Currently, the application uses a split architecture: 
- `doget` (run as User) for read/reports.
- `dopost` (run as App Owner, "Anyone can access") for data mutations (upload, edit, delete).
This was done because `doget` running as User does not have permission to write to spreadsheets unless individual users are granted explicit edit permissions, which is against data security policies. 

**Current Workaround**:
We have hardened the write-path using HMAC signing, Anti-Replay nonces, Timestamps, and application-level Role Verification. 

**Long-term Goal**:
Refactor the architecture to support same-project write-path using `google.script.run` in a unified Apps Script project.
This requires configuring standard deploy to "Execute as: App Owner", but inside the `google.script.run` gateway, we MUST verify the user's Google Identity. Since `Session.getActiveUser().getEmail()` often returns empty for non-workspace accounts or third-party scopes without proper setup, we will need to explore robust OAuth2 or Workspace Add-on flows, or keep utilizing the current HTTP-based separation if `google.script.run` identity spoofing remains a structural risk. 

**Requirements for Exploration**:
1. Research if we can reliably get user email in `google.script.run` when deployed as App Owner (e.g. by requesting OAuth scopes).
2. Write PoC to test bypass/spoofing risks of `google.script.run` when the app is executing as owner.
3. Migrate `dopost` logic to `client` proxy and expose via `google.script.run` if (1) and (2) are secure.
