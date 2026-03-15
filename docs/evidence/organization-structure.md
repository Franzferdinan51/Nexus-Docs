# Evidence Organization Structure

**Professional Framework for Organizing Forensic Evidence**

---

## 🎯 Overview

This guide provides a **standardized folder structure and naming convention** for organizing extracted mobile device evidence. Proper organization ensures:

- ✅ Easy retrieval of specific evidence
- ✅ Clear chain of custody documentation
- ✅ Professional presentation for legal proceedings
- ✅ Efficient analysis and reporting
- ✅ Secure storage and access control

This structure was developed during the **Serenity-Phone** forensic session.

---

## 📁 Recommended Folder Structure

### Top-Level Structure:

```
CASE-[CASE-ID]_[DEVICE-NAME]_[DATE]/
│
├── 00-ADMIN/                    # Administrative documents
│   ├── case-information.md
│   ├── chain-of-custody.md
│   ├── extraction-manifest.md
│   ├── legal-authority.md
│   └── access-log.md
│
├── 01-RAW-EXTRACTION/           # Original extracted data (READ-ONLY)
│   ├── sms/
│   ├── call-logs/
│   ├── contacts/
│   ├── media/
│   ├── browser/
│   ├── apps/
│   ├── logs/
│   └── metadata/
│
├── 02-PROCESSED/                # Processed and analyzed data
│   ├── sms-analyzed/
│   ├── call-logs-analyzed/
│   ├── timeline/
│   ├── contact-network/
│   └── geolocation/
│
├── 03-ANALYSIS/                 # Analysis work products
│   ├── red-flag-summary.md
│   ├── pattern-analysis.md
│   ├── risk-assessment.md
│   ├── keyword-searches/
│   └── flagged-content/
│
├── 04-EVIDENCE/                 # Curated evidence items
│   ├── communications/
│   ├── photos/
│   ├── location-data/
│   ├── browser-history/
│   └── app-data/
│
├── 05-REPORTS/                  # Final reports and deliverables
│   ├── executive-summary.md
│   ├── full-analysis-report.md
│   ├── technical-appendix.md
│   └── presentations/
│
└── 06-WORKING/                  # Temporary working files
    ├── drafts/
    ├── notes/
    └── scratch/
```

---

## 📋 Detailed Folder Descriptions

### 00-ADMIN/ - Administrative Documents

**Purpose:** Case management and legal documentation

**Contents:**

| File | Description | Template |
|------|-------------|----------|
| `case-information.md` | Case overview, device info, key dates | See below |
| `chain-of-custody.md` | Custody log with signatures | See below |
| `extraction-manifest.md` | Complete list of extracted data | Auto-generated |
| `legal-authority.md` | Consent forms, court orders, ownership proof | Scanned copies |
| `access-log.md` | Who accessed data and when | See below |

**case-information.md Template:**
```markdown
# CASE INFORMATION

**Case ID:** [Unique Identifier]
**Case Name:** [Descriptive Name]
**Date Opened:** [YYYY-MM-DD]
**Status:** [Open/Closed/On Hold]

## Device Information

| Field | Value |
|-------|-------|
| Make | [e.g., Motorola] |
| Model | [e.g., Moto G Play 2026] |
| Serial Number | [Device Serial] |
| IMEI | [IMEI Number] |
| Android Version | [Version Number] |
| Owner | [Legal Owner Name] |
| User | [Primary User if different] |

## Extraction Details

| Field | Value |
|-------|-------|
| Extraction Date | [YYYY-MM-DD HH:MM] |
| Extraction Method | [e.g., ADB non-rooted] |
| Extractor | [Name/Title] |
| Location | [Where extraction performed] |
| Tools Used | [Software/tools] |
| Duration | [Time taken] |
| Total Size | [GB/MB] |

## Legal Authority

**Basis for Extraction:**
- [ ] Owner consent (self)
- [ ] Parental authority (minor child)
- [ ] Written consent (third party)
- [ ] Court order
- [ ] Corporate policy
- [ ] Other: [Specify]

**Documentation:** See legal-authority.md

## Key Dates

| Date | Event |
|------|-------|
| [Date] | Case opened |
| [Date] | Device received |
| [Date] | Extraction performed |
| [Date] | Analysis completed |
| [Date] | Report delivered |
| [Date] | Case closed |

## Notes

[Additional relevant information]
```

**chain-of-custody.md Template:**
```markdown
# CHAIN OF CUSTODY

**Case ID:** [Identifier]
**Device:** [Make/Model/Serial]
**Evidence ID:** [Unique Evidence Identifier]

## Custody Log

| Date/Time | Action | From | To | Purpose | Signature |
|-----------|--------|------|-----|---------|-----------|
| YYYY-MM-DD HH:MM | Device received | [Source] | [Custodian] | Initial custody | |
| YYYY-MM-DD HH:MM | Extraction performed | [Custodian] | [Custodian] | Data extraction | |
| YYYY-MM-DD HH:MM | Evidence secured | [Custodian] | [Storage] | Secure storage | |
| YYYY-MM-DD HH:MM | Access for analysis | [Storage] | [Analyst] | Analysis | |
| YYYY-MM-DD HH:MM | Evidence returned | [Analyst] | [Storage] | Secure storage | |

## Storage Location

**Primary Storage:** [Secure location details]
**Backup Storage:** [Backup location details]
**Encryption:** [Encryption method and key location]

## Integrity Verification

| Date | Method | Hash | Verified By |
|------|--------|------|-------------|
| YYYY-MM-DD | SHA256 | [Hash Value] | [Name] |
| YYYY-MM-DD | SHA256 | [Hash Value] | [Name] |
```

**access-log.md Template:**
```markdown
# ACCESS LOG

**Case ID:** [Identifier]
**Period:** [Start Date] to [End Date]

## Access Records

| Date/Time | Name | Role | Purpose | Duration | Data Accessed | Signature |
|-----------|------|------|---------|----------|---------------|-----------|
| YYYY-MM-DD HH:MM | [Name] | [Role] | [Purpose] | [Time] | [What data] | |
| YYYY-MM-DD HH:MM | [Name] | [Role] | [Purpose] | [Time] | [What data] | |

## Access Control

**Authorized Personnel:**
- [Name] - [Role] - [Access Level]
- [Name] - [Role] - [Access Level]

**Access Restrictions:**
- [Any specific restrictions or conditions]
```

---

### 01-RAW-EXTRACTION/ - Original Extracted Data

**Purpose:** Preserve original extraction in unmodified state

**⚠️ CRITICAL RULES:**
- **READ-ONLY** - Never modify files in this directory
- **Complete Copy** - Contains everything extracted from device
- **Hash Verified** - SHA256 checksums for all files
- **Backup First** - Create backup before any work

**Subfolder Structure:**
```
01-RAW-EXTRACTION/
├── sms/
│   ├── sms-all.txt
│   ├── sms-inbox.txt
│   ├── sms-sent.txt
│   └── mmssms.db (if pulled)
│
├── call-logs/
│   ├── all-calls.txt
│   ├── incoming.txt
│   ├── outgoing.txt
│   └── missed.txt
│
├── contacts/
│   ├── all-contacts.txt
│   └── contact-data.txt
│
├── media/
│   ├── photos/
│   │   ├── DCIM/
│   │   └── Pictures/
│   ├── videos/
│   └── screenshots/
│
├── browser/
│   ├── chrome-history.db
│   ├── chrome-bookmarks.txt
│   └── firefox-history.db (if exists)
│
├── apps/
│   ├── installed-packages.txt
│   ├── third-party-packages.txt
│   └── [app-specific folders]/
│
├── logs/
│   ├── logcat.txt
│   └── bugreport.zip
│
├── metadata/
│   ├── device-properties.txt
│   └── extraction-info.md
│
└── SHA256SUMS.txt
```

**Serenity-Phone Example:**
```
01-RAW-EXTRACTION/
├── sms/
│   ├── sms-all.txt (2,847 messages, 12 MB)
│   ├── sms-inbox.txt (1,523 messages)
│   └── sms-sent.txt (1,324 messages)
│
├── call-logs/
│   ├── all-calls.txt (1,523 calls, 2 MB)
│   ├── incoming.txt (723 calls)
│   ├── outgoing.txt (566 calls)
│   └── missed.txt (234 calls)
│
├── media/
│   ├── photos/
│   │   ├── DCIM/ (1,247 photos, 1.9 GB)
│   │   └── Pictures/ (89 photos, 134 MB)
│   └── videos/ (83 videos, 687 MB)
│
├── browser/
│   └── chrome-history.txt (3,421 entries, 8 MB)
│
└── SHA256SUMS.txt (verification hashes)
```

---

### 02-PROCESSED/ - Processed and Analyzed Data

**Purpose:** Cleaned, formatted, and structured data for analysis

**Key Difference from RAW:**
- RAW = Original extraction (unchanged)
- PROCESSED = Reformatted for easier analysis

**Common Processing:**

| Data Type | Processing Applied |
|-----------|-------------------|
| **SMS** | Parsed to CSV, timestamps converted, contacts matched |
| **Call Logs** | Formatted spreadsheet, duration calculated, contact matched |
| **Photos** | EXIF data extracted, geocoded, sorted by date |
| **Browser** | Parsed to readable format, categorized by domain |
| **Timeline** | Merged chronological view across all data types |

**Subfolder Structure:**
```
02-PROCESSED/
├── sms-analyzed/
│   ├── sms-master.csv (all messages in spreadsheet)
│   ├── contacts-matched.csv (with contact names)
│   └── by-contact/ (messages grouped by contact)
│
├── call-logs-analyzed/
│   ├── calls-master.csv
│   ├── call-statistics.md (totals, averages, patterns)
│   └── by-contact/
│
├── timeline/
│   ├── master-timeline.csv (all events chronologically)
│   ├── daily-summaries/
│   └── weekly-summaries/
│
├── contact-network/
│   ├── contact-list.csv (all contacts with interaction counts)
│   ├── network-map.png (visual representation)
│   └── unknown-contacts.md (list of unidentified numbers)
│
└── geolocation/
    ├── location-history.csv
    ├── map-exports/
    └── frequent-locations.md
```

**Processing Script Example:**
```bash
#!/bin/bash
# process-sms.sh - Convert raw SMS to analyzed format

INPUT=~/case-001/01-RAW-EXTRACTION/sms/sms-all.txt
OUTPUT=~/case-001/02-PROCESSED/sms-analyzed/sms-master.csv

# Create CSV header
echo "timestamp,date,time,address,contact,type,body" > $OUTPUT

# Parse SMS (example - adjust based on actual format)
grep "date=" $INPUT | while read line; do
    # Extract fields and convert timestamp
    timestamp=$(echo $line | grep -o "date=[0-9]*" | cut -d= -f2)
    # Convert Unix timestamp to readable date
    date=$(date -d @$(($timestamp/1000)) "+%Y-%m-%d")
    time=$(date -d @$(($timestamp/1000)) "+%H:%M:%S")
    # Extract other fields
    address=$(echo $line | grep -o "address=[^ ]*" | cut -d= -f2)
    type=$(echo $line | grep -o "type=[0-9]*" | cut -d= -f2)
    body=$(echo $line | grep -o "body=[^ ]*" | cut -d= -f2)
    # Write to CSV
    echo "$timestamp,$date,$time,$address,,$type,\"$body\"" >> $OUTPUT
done

echo "Processing complete: $OUTPUT"
```

---

### 03-ANALYSIS/ - Analysis Work Products

**Purpose:** Analytical findings, pattern identification, risk assessment

**Contents:**

| File | Description |
|------|-------------|
| `red-flag-summary.md` | Summary of all identified red flags |
| `pattern-analysis.md` | Detailed pattern analysis across data types |
| `risk-assessment.md` | Overall risk level and justification |
| `keyword-searches/` | Results of keyword searches |
| `flagged-content/` | Specific items flagged for review |

**red-flag-summary.md Template:**
```markdown
# RED FLAG SUMMARY

**Case ID:** [Identifier]
**Analysis Date:** [Date]
**Analyst:** [Name]

## Executive Summary

[Brief overview of key findings and overall risk level]

**Overall Risk Level:** [LOW/MEDIUM/HIGH/CRITICAL]

## Findings by Category

### Communication Patterns
**Risk Level:** [ ]
**Indicator Count:** [Number]

| # | Finding | Evidence | Risk Level |
|---|---------|----------|------------|
| 1 | [Description] | [File reference] | [ ] |
| 2 | [Description] | [File reference] | [ ] |

### Content Analysis
**Risk Level:** [ ]
**Indicator Count:** [Number]

[Same format as above]

### [Additional Categories]

## Pattern Summary

[Describe patterns identified across categories]

## Recommendations

1. [Specific recommendation]
2. [Specific recommendation]
3. [Specific recommendation]
```

**Subfolder: keyword-searches/**
```
keyword-searches/
├── substance-related.txt (results of substance keyword search)
├── mental-health.txt (mental health keyword results)
├── sexual-content.txt (sexual content keyword results)
├── violence.txt (violence-related keyword results)
├── deception.txt (deception indicator results)
└── custom-searches/ (case-specific searches)
```

**Subfolder: flagged-content/**
```
flagged-content/
├── high-priority/ (requires immediate attention)
│   ├── item-001.md
│   ├── item-002.md
│   └── ...
│
├── medium-priority/ (should be reviewed)
│   ├── item-001.md
│   └── ...
│
└── low-priority/ (noted for completeness)
    └── ...
```

**Flagged Item Template:**
```markdown
# FLAGGED ITEM [ID]

**Priority:** [HIGH/MEDIUM/LOW]
**Category:** [Category]
**Date Identified:** [Date]
**Analyst:** [Name]

## Source Information

| Field | Value |
|-------|-------|
| Data Type | [SMS/Photo/Call/etc.] |
| Source File | [File path] |
| Date/Time | [When content was created] |
| Participants | [Who was involved] |

## Content

[Exact content or description]

## Context

[Surrounding circumstances, related items]

## Why Flagged

[Explanation of concern]

## Risk Assessment

**Risk Level:** [ ]
**Reasoning:** [Explanation]

## Follow-Up

**Action Required:** [Yes/No]
**Action:** [What should be done]
**Status:** [Pending/Complete/Not Required]
```

---

### 04-EVIDENCE/ - Curated Evidence Items

**Purpose:** Selected evidence items for reporting or proceedings

**Key Difference from ANALYSIS:**
- ANALYSIS = All findings including dead ends
- EVIDENCE = Only items supporting conclusions

**Organization by Evidence Type:**
```
04-EVIDENCE/
├── communications/
│   ├── concerning-messages/
│   │   ├── msg-001.md (message + context + significance)
│   │   ├── msg-002.md
│   │   └── ...
│   ├── unknown-contacts/
│   │   ├── contact-001.md (all messages with unknown #1)
│   │   └── ...
│   └── pattern-examples/
│       └── [representative samples]
│
├── photos/
│   ├── concerning-images/
│   │   ├── photo-001.md (image + metadata + significance)
│   │   └── ...
│   ├── location-evidence/
│   │   └── [geotagged photos with maps]
│   └── timeline-photos/
│       └── [key photos for timeline]
│
├── location-data/
│   ├── frequent-locations.md
│   ├── unexplained-locations.md
│   └── movement-patterns.md
│
├── browser-history/
│   ├── concerning-searches.md
│   ├── search-patterns.md
│   └── timeline-of-activity.md
│
└── app-data/
    ├── concerning-apps.md
    └── usage-patterns.md
```

**Evidence Item Template:**
```markdown
# EVIDENCE ITEM [ID]

**Case ID:** [Identifier]
**Evidence ID:** [Unique ID]
**Date Collected:** [Date]
**Collected By:** [Name]

## Description

[Brief description of evidence]

## Source

| Field | Value |
|-------|-------|
| Data Type | [Type] |
| Original Location | [Path in 01-RAW-EXTRACTION] |
| Extraction Date | [Date] |
| Hash (SHA256) | [Hash Value] |

## Content

[Full content or description]

## Metadata

| Field | Value |
|-------|-------|
| Date/Time | [When created] |
| Participants | [Who involved] |
| Location | [If applicable] |
| Device | [If multiple devices] |

## Significance

[Why this evidence matters]

## Related Evidence

- [Evidence ID] - [Description]
- [Evidence ID] - [Description]

## Authentication

**Chain of Custody:** Complete (see 00-ADMIN/chain-of-custody.md)
**Integrity Verified:** Yes (SHA256 match)
**Admissibility Review:** [Pending/Reviewed/Approved]

## Exhibits

[If used in proceedings]
- Exhibit [Number]: [Description]
```

---

### 05-REPORTS/ - Final Reports and Deliverables

**Purpose:** Professional reports for stakeholders

**Report Types:**

| Report | Audience | Detail Level |
|--------|----------|--------------|
| `executive-summary.md` | Decision makers | High-level only |
| `full-analysis-report.md` | Technical stakeholders | Complete findings |
| `technical-appendix.md` | Technical reviewers | Raw data references |

**Executive Summary Template:**
```markdown
# EXECUTIVE SUMMARY

**Case:** [Case Name/ID]
**Date:** [Report Date]
**Prepared By:** [Name/Title]

## Overview

[Brief case background - 2-3 paragraphs]

## Key Findings

### [Finding Category 1]
**Risk Level:** [ ]
**Summary:** [2-3 sentences]

### [Finding Category 2]
**Risk Level:** [ ]
**Summary:** [2-3 sentences]

## Overall Risk Assessment

**Risk Level:** [LOW/MEDIUM/HIGH/CRITICAL]

**Justification:** [Brief explanation]

## Recommendations

1. **[Recommendation 1]** - [Brief explanation]
2. **[Recommendation 2]** - [Brief explanation]
3. **[Recommendation 3]** - [Brief explanation]

## Next Steps

[Immediate actions required]

## Contact

[Analyst contact information]
```

**Full Analysis Report Structure:**
```markdown
# FORENSIC ANALYSIS REPORT

**Case ID:** [Identifier]
**Date:** [Report Date]
**Classification:** [Confidentiality Level]

## Table of Contents

1. Executive Summary
2. Case Background
3. Methodology
4. Device Information
5. Extraction Summary
6. Findings
   6.1 Communication Analysis
   6.2 Content Analysis
   6.3 Location Analysis
   6.4 [Additional sections]
7. Pattern Analysis
8. Risk Assessment
9. Conclusions
10. Recommendations
11. Limitations
12. Appendices

## 1. Executive Summary

[As above]

## 2. Case Background

[Detailed background and context]

## 3. Methodology

[Extraction and analysis methods used]

## 4. Device Information

[Complete device details]

## 5. Extraction Summary

[What was extracted, when, how]

## 6. Findings

[Detailed findings by category]

## 7. Pattern Analysis

[Cross-category pattern analysis]

## 8. Risk Assessment

[Risk level determination with justification]

## 9. Conclusions

[Summary conclusions]

## 10. Recommendations

[Detailed recommendations]

## 11. Limitations

[What wasn't analyzed, constraints, caveats]

## 12. Appendices

A. Chain of Custody
B. Extraction Manifest
C. Evidence Index
D. Technical Details
E. [Additional appendices]
```

---

### 06-WORKING/ - Temporary Working Files

**Purpose:** Scratch space for analysis work

**⚠️ Important:**
- Files here are NOT part of official record
- May be deleted after case closure
- Don't store critical evidence here

**Subfolder Structure:**
```
06-WORKING/
├── drafts/ (report drafts, work in progress)
├── notes/ (analyst notes, temporary observations)
├── scratch/ (temporary files, test outputs)
└── exports/ (temporary exports for external tools)
```

---

## 🏷️ Naming Conventions

### File Naming Standards:

| Element | Format | Example |
|---------|--------|---------|
| **Date** | YYYY-MM-DD | 2026-03-14 |
| **Time** | HHMMSS (24hr) | 143052 |
| **Case ID** | CASE-### | CASE-001 |
| **Evidence ID** | EV-### | EV-012 |
| **Version** | v#.# | v1.2 |

### Complete File Name Examples:

```
✅ Good:
- 2026-03-14_extraction-manifest_CASE-001.md
- sms-analysis_CASE-001_v1.0.md
- EV-012_concerning-message_2026-02-28.md
- call-log-processed_2026-03-14.csv

❌ Bad:
- sms stuff.txt
- analysis final FINAL reallyfinal.md
- evidence123.doc
- new file.md
```

### Folder Naming:

```
✅ Good:
- 00-ADMIN
- 01-RAW-EXTRACTION
- concerning-messages
- unknown-contacts

❌ Bad:
- admin stuff
- raw data (but then modified)
- Messages!!
- idk what to call this
```

---

## 🔐 Security and Access Control

### Encryption Standards:

| Data Classification | Encryption Required | Storage |
|--------------------|--------------------:|---------|
| **High Sensitivity** | AES-256 | Encrypted volume + access control |
| **Medium Sensitivity** | AES-256 | Encrypted archive |
| **Low Sensitivity** | Recommended | Password-protected |

### Encryption Commands:

```bash
# Create encrypted archive (Linux/macOS)
tar -czf case-001-evidence.tar.gz 01-RAW-EXTRACTION/
gpg -c --cipher-algo AES256 case-001-evidence.tar.gz
rm case-001-evidence.tar.gz

# Create encrypted volume (macOS)
hdiutil create -encryption AES-256 -size 10g -fs APFS case-001-encrypted.dmg

# Verify encryption
gpg case-001-evidence.tar.gz.gpg
```

### Access Control:

**Minimum Requirements:**
- [ ] Password protection on all case files
- [ ] Access log maintained
- [ ] Only authorized personnel can access
- [ ] Physical security for storage location
- [ ] Backup encryption

---

## 📊 Serenity-Phone Organization Example

**Actual Structure Used:**
```
CASE-001_SERENITY-PHONE_2026-03-14/
│
├── 00-ADMIN/
│   ├── case-information.md
│   ├── chain-of-custody.md
│   ├── extraction-manifest.md
│   └── access-log.md
│
├── 01-RAW-EXTRACTION/
│   ├── sms/sms-all.txt (2,847 messages)
│   ├── call-logs/all-calls.txt (1,523 calls)
│   ├── media/photos/DCIM/ (1,247 photos)
│   ├── media/videos/ (83 videos)
│   ├── browser/chrome-history.txt (3,421 entries)
│   └── SHA256SUMS.txt
│
├── 02-PROCESSED/
│   ├── sms-analyzed/sms-master.csv
│   ├── call-logs-analyzed/calls-master.csv
│   └── timeline/master-timeline.csv
│
├── 03-ANALYSIS/
│   ├── red-flag-summary.md
│   ├── pattern-analysis.md
│   ├── risk-assessment.md
│   └── keyword-searches/
│       ├── substance-related.txt (20 hits)
│       ├── deception.txt (15 hits)
│       └── unknown-contacts.txt (7 numbers)
│
├── 04-EVIDENCE/
│   ├── communications/
│   │   └── unknown-contact-001/ (1,770 messages)
│   ├── photos/
│   │   └── location-evidence/ (67 photos at Unknown Location A)
│   └── browser/
│       └── concerning-searches.md (23 high-risk searches)
│
├── 05-REPORTS/
│   ├── executive-summary.md
│   └── full-analysis-report.md
│
└── 06-WORKING/
    ├── drafts/
    └── notes/
```

**Storage:**
- Primary: Encrypted DMG volume on secure workstation
- Backup: Encrypted archive on external drive
- Access: Password-protected, access logged
- Retention: 7 years from case closure

---

## 📝 Best Practices

### Do:

- ✅ Organize BEFORE starting analysis
- ✅ Maintain RAW-EXTRACTION as read-only
- ✅ Document everything in 00-ADMIN
- ✅ Use consistent naming conventions
- ✅ Create checksums for all evidence
- ✅ Limit access to authorized personnel
- ✅ Regular backups of all case files
- ✅ Plan for secure deletion when case closes

### Don't:

- ❌ Modify original extracted data
- ❌ Store case files on unencrypted drives
- ❌ Share case files via unsecured channels
- ❌ Skip chain of custody documentation
- ❌ Use inconsistent naming
- ❌ Leave working files disorganized
- ❌ Forget to log access
- ❌ Keep data longer than necessary

---

## 🗑️ Case Closure and Data Disposition

### Closure Checklist:

- [ ] All reports completed and delivered
- [ ] All evidence properly documented
- [ ] Access log finalized
- [ ] Backup verified
- [ ] Retention period determined
- [ ] Disposition method planned
- [ ] Closure documentation created

### Secure Deletion:

```bash
# Secure delete on macOS
# Single-pass overwrite
srm -s filename

# Multi-pass overwrite (more secure)
srm -m filename

# Delete entire directory
srm -r case-001/

# Verify deletion
ls case-001/  # Should return "No such file or directory"
```

### Closure Documentation:

```markdown
# CASE CLOSURE DOCUMENTATION

**Case ID:** [Identifier]
**Close Date:** [Date]
**Closed By:** [Name]

## Case Summary

[Brief summary of case and outcomes]

## Data Disposition

| Data Type | Retention Period | Disposition Method | Date |
|-----------|-----------------|-------------------|------|
| Raw Extraction | [Period] | [Method] | [Date] |
| Analysis Files | [Period] | [Method] | [Date] |
| Reports | [Period] | [Method] | [Date] |
| Admin Files | [Period] | [Method] | [Date] |

## Final Storage

**Archived Location:** [If applicable]
**Archive Reference:** [Reference number]
**Access Restrictions:** [Any post-closure restrictions]

## Sign-Off

**Case Closed By:** [Name/Signature/Date]
**Reviewed By:** [Name/Signature/Date]
```

---

## 🎯 Next Steps

After organizing evidence:
1. **Complete Analysis** → Use organized structure for systematic review
2. **Generate Reports** → Pull from 04-EVIDENCE for report creation
3. **Secure Storage** → Encrypt and backup all case files
4. **Plan Retention** → Determine how long to keep data

---

**Version:** 1.0.0  
**Last Updated:** March 14, 2026  
**Based On:** Serenity-Phone evidence organization methodology
