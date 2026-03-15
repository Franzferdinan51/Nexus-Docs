# Red Flag Pattern Identification

**Systematic Guide to Analyzing Extracted Data for Concerning Content**

---

## 🎯 Overview

This guide provides a **structured methodology** for analyzing extracted mobile device data to identify patterns of concern. The approach was developed during the **Serenity-Phone** forensic analysis session.

### Analysis Philosophy:

1. **Systematic, Not Reactive** - Follow structured approach, not just gut feelings
2. **Pattern-Based, Not Isolated** - Look for patterns, not single incidents
3. **Context-Aware** - Consider context before drawing conclusions
4. **Documented** - Record all findings with supporting evidence
5. **Objective** - Maintain neutrality; avoid confirmation bias

---

## 📊 Analysis Framework

### The PATTERN Method:

| Letter | Meaning | Application |
|--------|---------|-------------|
| **P** | Patterns | Look for repeated behaviors, not one-offs |
| **A** | Anomalies | Identify deviations from normal behavior |
| **T** | Timeline | Construct chronological sequence of events |
| **T** | Types | Categorize by data type (messages, calls, photos, etc.) |
| **E** | Entities | Identify key people, places, organizations |
| **R** | Relationships | Map connections between entities |
| **N** | Narrative | Build coherent story from data points |

---

## 🔍 Red Flag Categories

### Category 1: Communication Patterns

#### 🚩 High-Frequency Contact with Unknown Numbers

**What to Look For:**
- Multiple daily messages/calls to same unknown number
- Contact not saved in contacts list
- Communication at unusual hours (late night, early morning)
- Deleted message threads (gaps in conversation history)

**Serenity-Phone Example:**
```
Contact: +1-XXX-XXX-XXXX (not saved)
Period: 2026-02-15 to 2026-03-01
Messages: 847 sent, 923 received
Peak Hours: 11 PM - 3 AM (78% of messages)
Pattern: Intensive communication with unknown party during late hours
```

**Analysis Questions:**
- Who is this contact?
- Why the secrecy (unsaved number)?
- What explains the timing?
- Is this consistent with known activities?

#### 🚩 Sudden Changes in Communication Patterns

**What to Look For:**
- Abrupt increase/decrease in overall messaging
- New contacts appearing suddenly
- Changes in typical communication hours
- Shift in language/tone with existing contacts

**Baseline Comparison:**
```
Normal Pattern (Jan 2026):
- Average messages/day: 45
- Unique contacts/week: 12
- Peak hours: 3 PM - 9 PM
- Primary contacts: Family, 3 close friends

Changed Pattern (Feb 2026):
- Average messages/day: 187 (+315%)
- Unique contacts/week: 34 (+183%)
- Peak hours: 10 PM - 4 AM (shifted)
- New primary contacts: 5 unknown numbers

Red Flag: Significant deviation from established baseline
```

#### 🚩 Code Words and Euphemisms

**What to Look For:**
- Unusual phrases that seem out of context
- References that require special knowledge
- Consistent use of nicknames for people/places
- Messages that seem intentionally vague

**Common Examples:**
```
Potential Code Words:
- "Meeting up" (could mean various things)
- "The usual place" (specific location known to parties)
- "Getting something" (vague, could mean anything)
- "Don't tell [name]" (explicit secrecy request)
- Time references: "After dark," "When everyone's asleep"

Context Matters:
- "Can we meet?" (neutral)
- "Can we meet? Don't tell Mom." (red flag)
- "Bring the thing we talked about." (vague, potentially concerning)
```

**Serenity-Phone Example:**
```
Message Thread Analysis:
Date: 2026-02-28 23:47
From: +1-XXX-XXX-XXXX
Message: "Got the stuff. Same place tonight? Don't bring anyone."

Context Indicators:
- Late night (11:47 PM)
- Vague reference ("the stuff")
- Secrecy instruction ("Don't bring anyone")
- Implied regular location ("Same place")

Risk Level: MEDIUM - Requires further investigation
```

#### 🚩 Deletion Patterns

**What to Look For:**
- Gaps in message history (missing dates)
- Entire conversations missing
- Specific contacts with no history
- Recent deletions (if recoverable)

**Detection Methods:**
```bash
# Check for gaps in SMS timeline
grep -o "date=[0-9]*" sms-all.txt | sort | uniq -c

# Look for missing dates
# Expected: Daily messages throughout period
# Red Flag: Entire weeks missing for specific contacts

# Check deletion timestamps (if available in logs)
grep -i "delete" ~/phone-extraction/logs/logcat.txt
```

**Interpretation:**
- Occasional deletion = Normal privacy behavior
- Systematic deletion of specific contacts = Potential concealment
- Deletion after certain events = Possible evidence destruction

---

### Category 2: Location and Movement Patterns

#### 🚩 Unexplained Locations

**What to Look For:**
- Photos geotagged to unknown locations
- Check-ins at unusual places
- Travel without prior mention
- Locations inconsistent with stated activities

**Analysis from Photos:**
```bash
# Extract EXIF data from photos
exiftool ~/phone-extraction/media/photos/DCIM/ | grep -E "(Date/Time|GPS)" > location-timeline.txt

# Map locations (using extracted GPS coordinates)
# Look for:
# - Repeated unknown locations
# - Locations far from home/work/school
# - Late-night location visits
```

**Serenity-Phone Example:**
```
Photo Analysis:
Total Photos: 1,247
Photos with GPS: 892 (71.5%)

Identified Locations:
- Home: 423 photos (47.4%)
- School: 287 photos (32.2%)
- Friend's House: 98 photos (11.0%)
- Unknown Location A: 67 photos (7.5%) ← RED FLAG
- Unknown Location B: 17 photos (1.9%) ← RED FLAG

Unknown Location A Details:
- First visit: 2026-02-10
- Total visits: 8
- Time pattern: Always between 10 PM - 2 AM
- No mention in messages or call logs

Risk Assessment: Requires investigation
```

#### 🚩 Pattern of Secretive Movement

**What to Look For:**
- Leaving home without notification
- Unexplained absences during expected times
- Location sharing turned off during specific periods
- Inconsistent explanations for whereabouts

**Timeline Analysis:**
```
Expected Pattern (School Night):
- 3:00 PM: Arrive home from school
- 3:00-6:00 PM: At home
- 6:00-7:00 PM: Dinner
- 7:00-10:00 PM: Homework/relaxation
- 10:00 PM: Bedtime

Actual Pattern (Feb 15-28):
- 3:00 PM: Leave school
- 3:00-7:00 PM: [UNACCOUNTED] ← RED FLAG
- 7:30 PM: Arrive home
- Multiple occasions: 4-hour unaccounted periods

Correlation: Unaccounted time matches communication with unknown contacts
```

---

### Category 3: Content Analysis

#### 🚩 Substance-Related Content

**What to Look For:**
- References to drugs, alcohol, vaping
- Photos showing substances or paraphernalia
- Messages about obtaining or using substances
- Plans involving substance use

**Keyword Search:**
```bash
# Search SMS for substance-related terms
grep -iE "(weed|mary jane|thc|cbd|vape|juul|pill|xanax|adderall|lean|molly|ecstasy|coke|meth|heroin|acid|shroom|ketamine)" ~/phone-extraction/sms/sms-all.txt > substance-flags.txt

# Search in photo filenames (sometimes descriptive)
ls ~/phone-extraction/media/photos/ | grep -iE "(weed|smoke|pill|party|drunk)" >> substance-flags.txt

# Review browser history for related searches
grep -iE "(how to|buy|effects|high|get)" ~/phone-extraction/browser/chrome-history.db >> substance-flags.txt
```

**Serenity-Phone Example:**
```
Substance-Related Findings:

SMS Messages (5 instances):
- 2026-02-20: "You got any more of those gummies?"
- 2026-02-22: "These edibles hit different lol"
- 2026-03-01: "Don't tell anyone but I tried vaping"
- 2026-03-05: "Where'd you get those? I want some"
- 2026-03-08: "Mom would kill me if she knew"

Photos (3 instances):
- 2026-02-21: Photo of vape pen (deleted from main album, found in .trash)
- 2026-03-02: Group photo with smoke visible
- 2026-03-06: Screenshot of dispensary website (browser history)

Browser History (12 searches):
- "how long do edibles stay in your system"
- "can you fail a drug test from secondhand smoke"
- "dispensary near me"
- "vape pen how to use"

Risk Level: HIGH - Multiple indicators across data types
```

#### 🚩 Sexual Content

**What to Look For:**
- Sexually explicit messages
- Sharing of intimate images
- Conversations with significantly older individuals
- Requests for photos or meetings

**Analysis Approach:**
```
Message Content Review:
- Look for sexually explicit language
- Identify requests for photos/meetings
- Note age discrepancies in conversations
- Check for coercion or pressure tactics

Photo Analysis:
- Review for inappropriate content
- Check metadata for sharing patterns
- Look for screenshots of intimate conversations
- Note any images received from others

Contact Analysis:
- Identify contacts with age gaps
- Check for online-only relationships
- Review frequency and timing of contact
```

**Important Considerations:**
- Age of subject is critical
- Consent and coercion must be evaluated
- Legal implications vary by jurisdiction
- May require mandatory reporting

#### 🚩 Self-Harm or Mental Health Indicators

**What to Look For:**
- References to self-harm, suicide, depression
- Expressions of hopelessness or worthlessness
- Searches related to self-harm methods
- Withdrawal from normal activities

**Keyword Search:**
```bash
# Search for mental health indicators
grep -iE "(suicide|kill myself|end it|no point|worthless|hate myself|cutting|self harm|depressed|anxious|panic|can't go on|everyone would be better)" ~/phone-extraction/sms/sms-all.txt > mental-health-flags.txt

# Search browser history
grep -iE "(depression|anxiety|suicide|self-harm|how to die|pain relief)" ~/phone-extraction/browser/ >> mental-health-flags.txt
```

**Response Protocol:**
```
IF self-harm indicators found:
1. Document findings carefully
2. Assess immediacy of risk
3. Consult mental health professional
4. Consider emergency intervention if imminent risk
5. Maintain supportive, non-judgmental approach
```

#### 🚩 Bullying or Harassment

**What to Look For:**
- Messages showing subject being bullied
- Messages showing subject bullying others
- Threats received or sent
- Social exclusion patterns

**Analysis:**
```
As Victim:
- Repeated negative messages from peers
- Threats or intimidation
- Exclusion from group activities
- Name-calling or humiliation

As Perpetrator:
- Aggressive messages toward others
- Coordination of exclusion with peers
- Sharing embarrassing content about others
- Threats or intimidation tactics
```

---

### Category 4: Financial Patterns

#### 🚩 Unexplained Transactions or Money Requests

**What to Look For:**
- Messages about money transfers
- Requests for money from contacts
- Discussions of selling items
- Unexplained cash sources

**Search Terms:**
```bash
grep -iE "(venmo|cashapp|paypal|zelle|cash app|send me money|wire transfer|bitcoin|crypto|sell my|pawn|quick cash|easy money)" ~/phone-extraction/sms/sms-all.txt > financial-flags.txt
```

**Serenity-Phone Example:**
```
Financial Indicators:

Money Requests (8 instances):
- 2026-02-18: "Can you Venmo me $50? I'll pay you back"
- 2026-02-25: "Need $100 quick, you got me?"
- 2026-03-03: "Anyone want to buy my AirPods? $80"
- 2026-03-07: "My mom would freak if she knew I spent that"

Pattern: Increasing frequency and amounts
Total Requested: $470 over 3 weeks
Recipients: 5 different contacts

Risk Level: MEDIUM - Could indicate financial pressure or undisclosed spending
```

---

### Category 5: App and Browser Usage

#### 🚩 Installation of Concerning Apps

**What to Look For:**
- Dating apps (age-inappropriate)
- Anonymous messaging apps
- Apps known for illicit activity
- Vault/hiding apps

**App Analysis:**
```bash
# Review installed apps
cat ~/phone-extraction/apps/installed-packages.txt | grep -iE "(tinder|bumble|hinge|okcupid|pof|kik|whisper|yikyak|calculator vault|hide photos|secret)" > concerning-apps.txt

# Check installation dates (if available)
# Look for recent installs of concerning apps
```

**Concerning App Categories:**

| Category | Examples | Concern Level |
|----------|----------|---------------|
| **Dating Apps** | Tinder, Bumble, Hinge | HIGH (if underage) |
| **Anonymous Chat** | Kik, Whisper, YikYak | MEDIUM-HIGH |
| **Vault Apps** | Calculator Vault, Hide Photos | MEDIUM (depends on content) |
| **Encrypted Messaging** | Signal, Telegram, Wickr | LOW-MEDIUM (context dependent) |
| **Gambling** | DraftKings, FanDuel, Poker | MEDIUM (if underage) |

#### 🚩 Browser History Patterns

**What to Look For:**
- Searches for prohibited activities
- Research on hiding behaviors
- Adult content (age-dependent)
- How-to guides for risky behaviors

**Browser Analysis:**
```
High-Risk Search Categories:
- Substance use/how-to
- Self-harm methods
- Illegal activities
- Hiding things from parents
- Adult content (if underage)
- Weapons/violence
- Running away

Moderate-Risk Categories:
- Dating/relationships
- Mental health queries
- Identity exploration
- Peer conflict research

Context Matters:
- Educational queries = Generally low concern
- How-to for prohibited activities = Higher concern
- Repeated searches on same topic = Pattern
```

**Serenity-Phone Browser Analysis:**
```
Browser: Chrome
Total History Entries: 3,421
Date Range: 2025-03-01 to 2026-03-14

High-Risk Searches (23 instances):
- "how to get weed without parents knowing"
- "can parents see deleted search history"
- "best vape pen for beginners"
- "how long does thc stay in system"
- "dispensary that doesn't card"

Moderate-Risk Searches (67 instances):
- "signs your friend is depressed"
- "how to tell if someone is lying"
- "what to do if you get caught"
- "running away at 16"

Risk Assessment: Pattern of research on prohibited activities and concealment
```

---

## 📈 Pattern Analysis Techniques

### Technique 1: Timeline Construction

**Purpose:** Create chronological view of events to identify patterns

**Method:**
```bash
# Extract timestamps from all data sources
# SMS
grep -o "date=[0-9]*" sms-all.txt | sed 's/date=//' | sort -n > sms-timeline.txt

# Call logs
grep -o "date=[0-9]*" all-calls.txt | sed 's/date=//' | sort -n > calls-timeline.txt

# Photos (from EXIF)
exiftool -T -DateTimeOriginal ~/phone-extraction/media/photos/ | sort > photos-timeline.txt

# Merge timelines
cat sms-timeline.txt calls-timeline.txt photos-timeline.txt | sort -n > master-timeline.txt
```

**Analysis:**
- Look for clusters of activity
- Identify gaps (missing time periods)
- Correlate events across data types
- Note anomalies in patterns

### Technique 2: Contact Network Mapping

**Purpose:** Understand relationships and communication patterns

**Method:**
```
1. Extract all unique contacts from messages/calls
2. Count interactions per contact
3. Map timing of interactions
4. Identify primary/secondary/tertiary contacts
5. Note unknown vs. known contacts
```

**Network Analysis:**
```
Primary Contacts (>100 interactions):
- Mom: 847 calls/messages
- Dad: 623 calls/messages
- Best Friend: 1,234 calls/messages
- Unknown #1: 1,770 calls/messages ← RED FLAG

Secondary Contacts (20-100 interactions):
- School friends (5): 45-89 interactions each
- Family members (3): 34-67 interactions each
- Unknown #2: 94 interactions ← NOTE

Tertiary Contacts (<20 interactions):
- Various classmates, acquaintances
- Unknown numbers (12): 1-15 interactions each
```

### Technique 3: Sentiment and Tone Analysis

**Purpose:** Identify emotional states and changes

**Manual Analysis Approach:**
```
Positive Indicators:
- Enthusiastic language
- Plans with friends
- Achievement mentions
- Future-oriented statements

Negative Indicators:
- Hopeless language
- Social withdrawal mentions
- Conflict references
- Past-oriented/regretful statements

Neutral Indicators:
- Factual exchanges
- Logistics coordination
- Routine check-ins
```

**Changes Over Time:**
```
Baseline (January):
- Positive: 67%
- Neutral: 28%
- Negative: 5%

Current (March):
- Positive: 34%
- Neutral: 31%
- Negative: 35% ← SIGNIFICANT SHIFT

Red Flag: Substantial increase in negative sentiment
```

### Technique 4: Cross-Reference Validation

**Purpose:** Verify consistency across data sources

**Method:**
```
When message says: "I'm at Sarah's house"
Check:
✓ Location data (GPS from photos/messages)
✓ Call logs (calls from that time/location)
✓ Photos (any taken during that period)
✓ Browser history (activity during that time)

Consistent = All sources align
Inconsistent = Red flag for deception
```

**Serenity-Phone Example:**
```
Message (2026-03-05 8:47 PM):
"Studying at library, will be late"

Cross-Reference Check:
✗ Location: GPS shows Unknown Location A (not library)
✗ Photos: 3 photos taken at party venue during same time
✗ Calls: 2 calls to Unknown #1 during "study" period
✓ Browser: No research/study-related activity

Conclusion: Deception indicated
Risk Level: MEDIUM - Pattern of dishonesty about whereabouts
```

---

## 🎯 Risk Assessment Framework

### Risk Level Classification:

| Level | Criteria | Response |
|-------|----------|----------|
| **LOW** | Isolated incidents, age-appropriate behavior, no safety concerns | Monitor, maintain open communication |
| **MEDIUM** | Patterns of concern, some risky behavior, potential safety issues | Intervention recommended, increased monitoring |
| **HIGH** | Multiple indicators, serious risky behavior, immediate safety concerns | Immediate intervention required, professional support |
| **CRITICAL** | Imminent danger, self-harm, illegal activity, exploitation | Emergency response, professional/legal intervention |

### Risk Assessment Matrix:

**Serenity-Phone Overall Assessment:**
```
Category                    | Risk Level | Evidence Count | Notes
----------------------------|------------|----------------|-------
Communication Patterns      | MEDIUM     | 12 indicators  | Unknown contacts, late-night messaging
Location/Movement           | MEDIUM     | 8 indicators   | Unexplained locations, time gaps
Substance-Related Content   | HIGH       | 20 indicators  | Multiple references across data types
Sexual Content              | LOW        | 2 indicators   | Age-appropriate curiosity
Mental Health               | MEDIUM     | 7 indicators   | Some concerning searches, no direct threats
Financial                   | LOW        | 8 indicators   | Money requests, no major red flags
App/Browser Usage           | MEDIUM     | 15 indicators  | Concerning searches, some risky apps

OVERALL RISK: MEDIUM-HIGH
Primary Concerns: Substance use, deception about whereabouts, unknown contacts
Recommended Action: Intervention with professional support
```

---

## 📝 Documentation Template

### Red Flag Analysis Report:

```
RED FLAG ANALYSIS REPORT
========================

Case ID: [Identifier]
Analysis Date: [Date]
Analyst: [Name]
Data Period: [Start] to [End]

EXECUTIVE SUMMARY:
[Brief overview of findings and overall risk level]

RISK ASSESSMENT:
Overall Risk Level: [LOW/MEDIUM/HIGH/CRITICAL]

FINDINGS BY CATEGORY:

1. Communication Patterns
   Risk Level: [ ]
   Key Findings:
   - [Finding 1 with evidence]
   - [Finding 2 with evidence]
   Supporting Evidence: [File references]

2. Location and Movement
   Risk Level: [ ]
   Key Findings:
   - [Finding 1 with evidence]
   Supporting Evidence: [File references]

3. Content Analysis
   Risk Level: [ ]
   Key Findings:
   - [Finding 1 with evidence]
   - [Finding 2 with evidence]
   Supporting Evidence: [File references]

4. [Additional categories as needed]

PATTERN ANALYSIS:
[Describe identified patterns across categories]

TIMELINE OF CONCERNS:
[Chronological list of significant events]

RECOMMENDATIONS:
1. [Specific, actionable recommendation]
2. [Specific, actionable recommendation]
3. [Specific, actionable recommendation]

FOLLOW-UP REQUIRED:
[ ] Yes - [Description]
[ ] No

NEXT REVIEW DATE: [Date]

ATTACHMENTS:
- [List of supporting documents]
```

---

## ⚠️ Important Considerations

### Avoid Confirmation Bias:

**Common Pitfalls:**
- ❌ Only looking for evidence that confirms pre-existing concerns
- ❌ Ignoring evidence that contradicts assumptions
- ❌ Over-interpreting ambiguous data
- ❌ Assuming guilt without full context

**Best Practices:**
- ✅ Systematically review ALL data, not just concerning parts
- ✅ Actively look for evidence that contradicts concerns
- ✅ Consider alternative explanations for findings
- ✅ Document both confirming and disconfirming evidence
- ✅ Have findings reviewed by another person when possible

### Context is Critical:

**Same Behavior, Different Context:**

| Behavior | Context A (Low Concern) | Context B (High Concern) |
|----------|------------------------|-------------------------|
| Late-night messaging | Talking to friend in different timezone | Secretive contact with unknown adult |
| Deleting messages | Cleaning up storage | Hiding specific conversations |
| Unknown contacts | New friend from legitimate activity | Multiple secretive contacts |
| Substance searches | School research project | Personal use planning |

**Always Ask:**
- What is the subject's age?
- What is normal for this individual?
- What is the broader context?
- Are there alternative explanations?
- What additional information is needed?

### Privacy and Ethics:

**Remember:**
- Analysis should be proportional to concerns
- Respect privacy where possible
- Focus on safety, not control
- Document objectively, without judgment
- Use findings to help, not punish

---

## 🎯 Next Steps

After completing analysis:
1. **Document Findings** → Use template above
2. **Organize Evidence** → See [`docs/evidence/organization-structure.md`](../evidence/organization-structure.md)
3. **Plan Intervention** → Based on risk level and findings
4. **Follow Up** → Monitor and reassess as needed

---

**Version:** 1.0.0  
**Last Updated:** March 14, 2026  
**Based On:** Serenity-Phone analysis methodology
