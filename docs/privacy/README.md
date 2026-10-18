# Optional GA4 public reach

Release: 2026-10-18b. Uses the existing MusEDLab Website property 488086218,
web stream 11184051177, measurement ID G-HY8ELV8WGM. Enhanced measurement was
observed OFF on 2026-10-18. Keep it off: automatic form, outbound-link, download,
video and history events have not been approved for these creative tools.

No Google script, queue, or measurement request is created until the visitor
accepts optional analytics (musedlab.privacy.v1 = accepted). Reject/dismiss stays
off. Existing PWYM preferences and click-to-load embed controls are retained.
Preferences are local to each origin. Withdrawal disables GA and clears GA
cookies without reloading the tool or losing unsaved work.

Only a reviewed static public URL and static title in page metadata are sent.
There are no query strings, fragments, referrers, campaign values, user IDs,
participant/session codes, form contents, artwork, filenames, or recordings.
The page does not expose a public gtag helper; a separate queue isolates this
baseline from old app-event helpers. A single explicit page_view is sent per
document. Standard GA4 engagement and device/coarse geographic reporting then
apply to consenting, reachable clients. No precise-location API is used.

This is aggregate reach measurement, not research session capture or replay.
It cannot reconstruct the October 17 workshop retroactively, identify attendees,
or measure visitors who decline/block GA or cannot reach Google services.

Local browser fixture: 24 checks passed, with all Google loads intercepted (no
test events sent to GA). Checks cover off-before-consent, accept/reject/dismiss,
withdrawal, cross-tab changes, blocked storage, existing PWYM UI, duplicate
inclusion, sanitized payload, cookie scope, and Chinese controls. Static checks
confirm one script/metadata set per included page and existing local assets.
