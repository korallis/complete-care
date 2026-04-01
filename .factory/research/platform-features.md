# Complete Care Platform — Feature & Workflow Research

> Comprehensive research into the features, workflows, data requirements, and user interactions needed for a UK care management platform covering domiciliary care, supported living, and children's residential homes.

---

## Table of Contents

1. [Domiciliary Care Features](#1-domiciliary-care-features)
2. [Supported Living Features](#2-supported-living-features)
3. [Children's Residential Homes Features](#3-childrens-residential-homes-features)
4. [Rostering & Staff Management](#4-rostering--staff-management)
5. [Family Portal](#5-family-portal)
6. [AI Integration Opportunities](#6-ai-integration-opportunities)

---

## 1. Domiciliary Care Features

Domiciliary (home) care is the largest and most competitive segment. Carers visit clients in their own homes to deliver personal care, medication support, companionship, and domestic tasks. The entire operational model revolves around **mobile workers travelling between geographically dispersed clients** — fundamentally different from site-based residential care.

### 1.1 Visit Scheduling & Management

**Workflow:**
1. **Care package setup** — A client is onboarded with an agreed care package (e.g., 4 visits/day, 7 days/week). Each visit has a defined time window, duration, and task list.
2. **Rota creation** — Coordinators assign carers to visits based on skills, availability, client preferences, geography, and continuity-of-carer rules.
3. **Planned visits** — The standard schedule published to carers' mobile apps. Includes client address, access instructions, care tasks, medication prompts, and risk notes.
4. **Unplanned/ad-hoc visits** — Urgent visits triggered by client deterioration, hospital discharge, or family request. Must be slotted into the day's schedule dynamically.
5. **Visit amendments** — Real-time changes (carer sickness, client cancellation, hospital admission). Coordinators need drag-and-drop rescheduling with instant push notifications to carers.
6. **Recurring patterns** — Template-based scheduling (e.g., "Week A / Week B" alternating rotas) to reduce weekly setup effort.

**Data Requirements:**
- Client records: address, access details (key safe code), care package details, risk flags, preferences (gender of carer, language), GP/next-of-kin contacts
- Carer records: availability, skills/qualifications, DBS status, geographic base, vehicle access, client compatibility ratings
- Visit records: planned start/end time, actual start/end time, tasks completed, notes, medication administered, alerts raised
- Schedule state: real-time view of all visits for the day/week with assignment status (assigned, unassigned, in-progress, completed, missed, cancelled)

**User Interactions:**
- **Coordinator (desktop):** Weekly/daily rota view, drag-and-drop assignment, bulk operations (assign all Monday AM visits), unassigned visits queue, conflict warnings (double-booking, travel time violations, skills mismatch)
- **Carer (mobile app):** Daily schedule list, visit details screen, navigation to client address, check-in/check-out actions, task completion
- **Manager (desktop):** Dashboard showing visit completion rates, missed visits, late visits, unassigned visits, capacity utilisation

### 1.2 Electronic Visit Verification (EVV)

EVV proves that a care visit actually happened, at the right place, at the right time, with the right carer, for the right duration. It is a cornerstone of compliance and billing accuracy.

**Workflow:**
1. **Check-in** — Carer arrives at client's home and checks in via one of several methods:
   - **GPS geofencing** — App confirms carer is within a defined radius (e.g., 50m) of the client's registered address
   - **QR code scanning** — Carer scans a QR code placed in the client's home (common in UK)
   - **NFC tag tap** — Carer taps phone against an NFC tag fixed inside the client's property
   - **Manual override** — For locations with poor signal; requires coordinator approval
2. **Visit in progress** — App displays task checklist; carer records activities, notes, and medication as they work
3. **Check-out** — Carer marks visit complete; GPS/QR/NFC verification repeated to confirm departure
4. **Verification** — System records: carer identity, location coordinates at check-in/check-out, timestamps, duration, tasks completed

**Data Requirements:**
- GPS coordinates (latitude/longitude) with accuracy radius
- Timestamps (check-in, check-out, task completions)
- Client geofence definitions (centre point + radius)
- QR code / NFC tag identifiers linked to client addresses
- Verification method used (GPS, QR, NFC, manual)
- Override/exception records with reason codes and approver

**User Interactions:**
- **Carer (mobile):** One-tap check-in (GPS auto-detects location or camera opens for QR scan), confirmation screen showing visit details, one-tap check-out
- **Coordinator (desktop):** Real-time dashboard of carers in the field — who is checked in where, running late alerts, missed check-in alerts, exception review queue for manual overrides
- **Compliance/billing (desktop):** EVV data feeds directly into invoice generation and payroll; discrepancy reports (planned vs actual durations)

### 1.3 Travel Time Management

Travel between visits is a significant cost driver and compliance concern (carers must be paid for travel time under UK employment law).

**Workflow:**
1. **Route optimisation** — When building the rota, system calculates estimated travel time between consecutive visits using mapping APIs, considering mode of transport (car, public transport, walking/cycling)
2. **Travel time insertion** — Automatic buffer inserted between visits to prevent impossible schedules (e.g., 15 mins between a visit ending in postcode A and next visit starting in postcode B)
3. **Mileage recording** — Carers log mileage (auto-calculated from GPS or manually entered). Used for mileage reimbursement
4. **Actual vs estimated comparison** — System tracks actual travel time (gap between check-out at one client and check-in at next) vs estimated. Flags persistent discrepancies for investigation

**Data Requirements:**
- Client addresses with geocoding
- Carer transport mode (car/public transport/bicycle)
- Mapping/routing engine integration (Google Maps, Mapbox, or OSRM)
- HMRC mileage rate (currently 45p/mile for first 10,000 miles)
- Travel time logs per journey (from, to, estimated, actual, distance)

**User Interactions:**
- **Coordinator:** Map view showing client locations and carer routes; "optimise run" button to resequence visits for minimum travel; travel time warnings on schedule conflicts
- **Carer:** Turn-by-turn navigation to next visit; mileage auto-logged
- **Payroll:** Travel time and mileage data exported to payroll calculations

### 1.4 Visit Task Lists & Completion Tracking

Each visit has a defined set of care tasks derived from the client's care plan.

**Workflow:**
1. **Task list generation** — Care plan defines tasks per visit type (e.g., "Morning call": personal care, medication, breakfast, fluid intake recording; "Teatime call": meal prep, companionship, evening medication)
2. **Task presentation** — Carer sees ordered checklist on mobile app upon check-in
3. **Task completion** — Carer ticks off each task, optionally adding notes (e.g., "Client refused breakfast, offered alternatives")
4. **Outcome recording** — For specific tasks: fluid intake volume, food consumed, mood observation, skin condition, pain level
5. **Exception handling** — If a task cannot be completed (client refuses, equipment broken), carer records reason. System flags for coordinator review
6. **Care note entry** — Free-text or voice-to-text narrative describing the visit beyond the checklist

**Data Requirements:**
- Task templates linked to care plan categories
- Task completion records (completed/not completed/refused/N-A, timestamp, notes)
- Outcome measurements (numeric values, scales, selections)
- Care notes (text, voice transcriptions, photos)
- Alert triggers (e.g., fluid intake below threshold, missed medication)

**User Interactions:**
- **Carer (mobile):** Checklist interface with large tap targets (for gloved hands); voice-to-text for notes; photo attachment (e.g., wound photos); quick-entry for common observations
- **Coordinator:** Task completion dashboard — percentage complete per visit, flagged exceptions, overdue tasks
- **Care manager:** Trend analysis — are certain tasks consistently missed? Are certain clients deteriorating (declining food intake over 7 days)?

### 1.5 Client Care in the Community

Domiciliary care is delivered in the client's own home, which creates unique documentation and risk considerations.

**Workflow:**
1. **Client profile** — Comprehensive record including: home environment assessment (stairs, grab rails, hoarding risks), access arrangements (key safe location and code, door entry system), pet information, household members
2. **Environmental risk assessment** — Initial and periodic review of the home for hazards (trip risks, electrical safety, hygiene concerns). Generates actions for client/family
3. **Client preferences** — Person-centred documentation of preferences, routines, likes/dislikes, cultural/religious needs, communication needs
4. **Multi-agency coordination** — Integration points with GP surgeries (via GP Connect), district nurses, occupational therapists, social workers. Shared care plan sections visible to authorised external professionals
5. **Hospital admission/discharge** — Flagging when a client is admitted (suspends visits) and discharge planning (resumes/modified care package)

**Data Requirements:**
- Environmental assessment templates with photo evidence
- Key safe codes (encrypted, role-based access)
- Household member records
- Multi-agency contact directory
- Hospital admission/discharge tracking
- Client consent records for data sharing

### 1.6 Lone Worker Safety

Carers working alone in clients' homes face safety risks (aggression, accidents, medical emergencies, trafficking concerns in some settings).

**Workflow:**
1. **Welfare check-in** — If a carer hasn't checked out of a visit within expected duration + buffer, system triggers escalating alerts:
   - +15 mins: push notification to carer ("Are you OK?")
   - +30 mins: alert to coordinator dashboard
   - +45 mins: coordinator attempts phone contact
   - +60 mins: emergency protocol activated (contact emergency services / next of kin)
2. **Panic/SOS button** — Carer can trigger silent or audible alarm from mobile app at any time. Sends GPS location and alert to coordinator + pre-defined emergency contacts
3. **Check-in/check-out logging** — All carer movements tracked; if a carer goes "dark" (no app activity for extended period), system alerts
4. **Risk-flagged clients** — Clients with known aggression history, substance misuse, or other risks are flagged. System can require two-carer visits or additional safety protocols
5. **Post-incident reporting** — Structured incident form for any safety event, linked to client record and staff record

**Data Requirements:**
- Carer location tracking (opt-in, GDPR compliant)
- Alert escalation rules (configurable per organisation)
- Emergency contact chains
- Client risk flags with categories (aggression, substance misuse, infection control, environmental)
- Incident records with categorisation, severity, follow-up actions

**User Interactions:**
- **Carer (mobile):** SOS button always visible; welfare check-in confirmation; risk flag warnings before entering client home
- **Coordinator (desktop):** Live map of all carers; traffic-light status (green = on track, amber = running late, red = overdue/alarm); escalation action buttons
- **Manager:** Incident analysis dashboard; lone worker safety audit trail for CQC

### 1.7 Invoice Generation from Visit Data

The business model for domiciliary care depends on accurate billing — from EVV data through to invoice.

**Workflow:**
1. **Rate configuration** — Set up billing rates per client, per funder (local authority, NHS CHC, private), per visit type, per time-of-day (weekday, weekend, bank holiday, night rate)
2. **Automated calculation** — System calculates billable amounts from verified visit data: actual duration × applicable rate, plus mileage if applicable
3. **Discrepancy resolution** — Coordinator reviews visits where actual duration differs significantly from planned (under-delivery or over-delivery). Adjustments approved before invoicing
4. **Invoice generation** — Batch invoice generation per funder per billing period (weekly, fortnightly, monthly). Different funders have different formats:
   - **Local authorities:** Often require CM2000/ContrOCC format exports or specific CSV templates
   - **NHS CHC:** Invoice against specific CHC reference numbers
   - **Private clients:** Individual invoices per client, often with direct debit integration
5. **Statement and remittance** — Track payment received, age debtor analysis, chase overdue payments
6. **Payroll export** — Same visit data feeds into payroll: hours worked, travel time, mileage, overtime, weekend/bank holiday enhancements

**Data Requirements:**
- Rate cards per funder/client/visit type/time bracket
- Verified visit records (EVV data)
- Funder contracts and billing terms
- Invoice templates per funder
- Payment records and bank reconciliation
- Payroll rules (hourly rates, enhancements, deductions)
- Integration with accounting systems (Sage, Xero, QuickBooks)
- Local authority billing system formats (CM2000, ContrOCC)

**User Interactions:**
- **Finance (desktop):** Rate card management; invoice preview and approval; batch generation; payment tracking; aged debtor reports
- **Coordinator:** Visit discrepancy review queue
- **Manager:** Revenue dashboards, profit-per-client analysis, funder comparison

---

## 2. Supported Living Features

Supported living serves adults with learning disabilities, autism, mental health conditions, acquired brain injuries, or physical disabilities who live in their own homes (as tenants). Support is about **building independence, not managing dependency** — a fundamentally different philosophy from residential or domiciliary care.

### 2.1 Tenancy-Aware Documentation (Property vs Person)

**Workflow:**
1. **Property records** — Each supported living property is registered separately from the people living there. Properties have their own records: address, landlord (often a housing association), property type (shared house, individual flat, cluster), number of bedrooms, communal areas, property risk assessments, maintenance records
2. **Tenancy records** — Each individual has a tenancy agreement linked to a property. They are a tenant, not a "resident" — language matters for dignity and legal rights
3. **Support records** — Separate from the tenancy. Support plans, daily logs, and outcomes are person-linked, not property-linked. This reflects the legal separation between accommodation and care in supported living
4. **Shared vs individual documentation** — For shared houses: some documentation is property-level (fire safety, cleaning rota, communal risk assessments) while care/support documentation is always individual
5. **Moves and transitions** — When a person moves between properties, their support records move with them; property records stay with the property. Historical tenancy records maintained for audit

**Data Requirements:**
- Property register: address, landlord, type, capacity, communal areas, lease terms
- Tenancy records: person ↔ property link, start/end dates, tenancy type
- Clear data model separation: property entities vs person entities vs support entities
- Property-level documents: fire risk assessment, gas safety, electrical inspection, landlord contact
- Person-level documents: support plans, care notes, health records, financial records
- CQC registration status (personal care registration is separate from accommodation)

**User Interactions:**
- **Manager (desktop):** Property overview dashboard (occupancy, vacancies, maintenance status); person search that shows current property; property search that shows current tenants
- **Support worker (mobile):** Logs always linked to the person, but can reference property events (maintenance issue, communal activity)
- **Compliance:** Evidence of tenant rights being upheld; documentation that clearly separates accommodation from care/support

### 2.2 Positive Behaviour Support (PBS) Plans

PBS is an evidence-based framework for understanding and supporting people whose behaviour may be described as challenging. It is a **mandatory consideration** for services supporting people with learning disabilities and autism under CQC's Right Support, Right Care, Right Culture framework.

**Workflow:**
1. **Functional assessment** — Understanding the function of behaviour through ABC (Antecedent-Behaviour-Consequence) data collection:
   - **Antecedent:** What happened before the behaviour? (environment, people present, activity, time of day, sensory input)
   - **Behaviour:** Objective description of what occurred (topography, duration, intensity, frequency)
   - **Consequence:** What happened afterwards? (staff response, environmental change, outcome for the person)
2. **Pattern identification** — Analysis of ABC data over time to identify triggers, maintaining factors, and communicative function of the behaviour
3. **PBS plan creation** — Multi-disciplinary input to create a proactive, person-centred plan:
   - **Primary prevention strategies:** Environmental changes, routine modifications, sensory accommodations
   - **Secondary (early warning) strategies:** De-escalation techniques for when triggers are identified
   - **Reactive strategies:** Response protocols when behaviour occurs (always using least restrictive approach)
   - **Post-incident support:** Recovery protocols for both the person and staff
4. **Restrictive practices register** — Any restrictive intervention (physical, environmental, chemical, mechanical) must be separately documented, justified, reviewed, and reported. CQC expects a clear register with reduction plans
5. **Review cycle** — PBS plans reviewed regularly (monthly or after every significant incident), with evidence of reduction in restrictive practices over time

**Data Requirements:**
- ABC incident records: structured form with antecedent categories, behaviour descriptions, consequence types
- Behaviour frequency/intensity tracking over time (charts/graphs)
- PBS plan documents with versioning
- Restrictive practices register: type, justification, authorisation, duration, review date
- Multi-disciplinary team (MDT) input records
- Reduction strategy evidence
- Staff debriefing records post-incident

**User Interactions:**
- **Support worker (mobile):** Quick ABC data entry form (structured dropdowns + free text); incident recording; de-escalation log
- **PBS lead/manager (desktop):** Behaviour analysis dashboard with trend charts (frequency over time, by trigger type, by time of day); PBS plan editor; restrictive practices register; audit of reduction progress
- **External professionals (portal):** Read access to PBS plans and behaviour data for input; ability to add MDT notes

### 2.3 Outcomes & Goals Tracking

In supported living, the focus is on helping people achieve personal outcomes — not just "receiving care."

**Workflow:**
1. **Goal setting** — Collaborative process between the person, their support team, and (where appropriate) family/advocates. Goals mapped to areas:
   - Independent living skills (cooking, cleaning, budgeting, using public transport)
   - Health and wellbeing (exercise, diet, medication self-management)
   - Social and community (friendships, clubs, volunteering, employment)
   - Communication and self-advocacy
   - Emotional wellbeing and relationships
2. **SMART goal definition** — Each goal broken into Specific, Measurable, Achievable, Relevant, Time-bound steps
3. **Progress recording** — Support workers record progress against goals during each support session. Evidence can include: narrative notes, photos (with consent), checklists, skill-level assessments
4. **Review cycle** — Formal outcome reviews (monthly/quarterly) comparing current ability against baseline. Visual progress indicators (e.g., traffic light system: red = regression, amber = maintaining, green = progressing)
5. **Reporting to funders** — Outcome data packaged for commissioner/funder reviews, demonstrating value of the support package

**Data Requirements:**
- Goal records: description, category, SMART breakdown, baseline assessment, target, timeline
- Progress entries linked to goals (timestamped, attributed to support worker)
- Skill assessment scales (custom per domain)
- Photo/media evidence (consent-gated)
- Review records with comparison data
- Funder-facing outcome reports

**User Interactions:**
- **Person supported (accessible interface):** View own goals in easy-read format with pictures; mark own achievements; give feedback on support
- **Support worker (mobile):** Quick goal-progress entry during/after support session; photo upload; narrative notes
- **Manager (desktop):** Outcome tracking dashboard across all people supported; identify who is progressing, who needs plan changes; funder reporting generation

### 2.4 Community Access Recording

A core purpose of supported living is enabling people to participate in their communities.

**Workflow:**
1. **Activity planning** — Support workers plan community activities with the person (shopping, leisure, social groups, appointments, employment/volunteering)
2. **Risk assessment** — Dynamic risk assessment for community activities (transport risks, environmental risks, behaviour support considerations, safeguarding)
3. **Activity recording** — During outings, support workers log: activity type, location, duration, the person's engagement/mood, any incidents, skills practiced
4. **Offline capability** — Critical for community work. All recording must function without internet connection and sync when back online
5. **Outcome linkage** — Community activities linked back to the person's goals (e.g., "Visited local shop independently — links to Goal: Independent shopping")

**Data Requirements:**
- Activity templates (categorised: leisure, health, social, educational, employment)
- Community risk assessment forms
- Activity logs with location, duration, engagement rating
- Goal linkage
- Transport/mileage records
- Offline storage with sync queue

### 2.5 Skills Development Tracking

**Workflow:**
1. **Skills assessment** — Baseline assessment of the person's abilities across domains: personal care, domestic skills, financial management, social skills, travel/mobility, digital skills, employment readiness
2. **Skills development plan** — Structured plan for teaching/developing skills, with graded steps (e.g., "Making a cup of tea: Step 1 — supervised; Step 2 — verbal prompts only; Step 3 — visual prompt card; Step 4 — independent")
3. **Session recording** — Each support session records: skill practiced, level of support given (full support → verbal prompt → visual prompt → independent), outcome
4. **Competency tracking** — Over time, the system shows progression through levels for each skill. Identifies where the person has plateaued or regressed
5. **Celebration and reporting** — Achievements celebrated (configurable notifications to family, commissioners); evidence packaged for reviews

**Data Requirements:**
- Skills assessment framework (domains, sub-domains, competency levels)
- Session records: skill, support level, outcome, notes
- Competency history per skill over time
- Achievement records
- Teaching strategy notes linked to skills

### 2.6 Personal Budget Management

Many people in supported living manage personal budgets (via Direct Payments or Individual Service Funds).

**Workflow:**
1. **Budget setup** — Record the person's funding allocation (hours per week, total budget, funding source — local authority, NHS CHC, personal contribution)
2. **Hours logging** — Support hours delivered logged against the budget (1:1 hours, shared/group support hours, sleep-in, waking night)
3. **Budget tracking** — Real-time view of hours/budget used vs allocated. Alerts when approaching limits
4. **Expenditure recording** — For people managing Direct Payments: record purchases made from the budget (support equipment, activities, transport costs)
5. **Reporting to commissioners** — Regular budget utilisation reports demonstrating how funding was used and outcomes achieved
6. **Individual Service Fund (ISF) management** — For ISFs, the provider holds the budget on behalf of the person. System tracks allocation, spend, and balance

**Data Requirements:**
- Funding records: source, amount, period, review date
- Hours allocation by support type (1:1, shared, sleep-in, waking night)
- Hours delivered logs
- Budget balance calculations
- Expenditure records (for Direct Payments/ISFs)
- Commissioner reporting templates

### 2.7 Support Hour Logging

**Workflow:**
1. **Planned hours** — Rota defines planned support hours per person (e.g., 20 hours/week 1:1 support)
2. **Actual hours recording** — Support workers clock in/out per support session; system records: start time, end time, support type (1:1, shared, sleep-in, waking night), activities undertaken
3. **Shared support allocation** — Where one worker supports multiple people simultaneously (e.g., in a shared house), system allocates proportional hours to each person
4. **Variance reporting** — Comparison of planned vs delivered hours per person, per week/month. Under-delivery triggers investigation; over-delivery requires authorisation
5. **Funder billing** — Hours data feeds into billing per funder/commissioner

**Data Requirements:**
- Planned hours per person per support type
- Actual session records with timestamps
- Shared support allocation rules
- Variance calculations and exception records
- Billing rates per support type per funder

---

## 3. Children's Residential Homes Features

Children's residential homes are regulated by **Ofsted** (not CQC) under the **Children's Homes (England) Regulations 2015** and associated Quality Standards. This is the most underserved software segment and requires fundamentally different features from adult care. Children are **Looked After Children (LAC)** placed by local authorities, and the regulatory, safeguarding, and outcome frameworks are entirely different.

### 3.1 LAC (Looked After Children) Documentation

**Workflow:**
1. **Referral and placement** — Home receives referral from local authority placing team. Impact/matching risk assessment completed before acceptance. Placement plan agreed between home and placing authority
2. **Admission documentation:**
   - Placement plan (from placing authority)
   - Placement information record
   - Child's legal status (Section 20 voluntary, Section 31 care order, Section 38 interim care order, emergency protection order, remand)
   - Essential information record (allergies, medical needs, contacts, legal orders, bail conditions)
   - Existing care plan from local authority
   - Health assessments (initial health assessment within 20 working days; review health assessments annually for over-5s, 6-monthly for under-5s)
3. **Ongoing LAC documentation:**
   - LAC review records (first review within 20 working days, second within 3 months, then every 6 months)
   - IRO (Independent Reviewing Officer) contact details and review notes
   - Social worker visit records
   - Local authority care plan updates
   - Statutory notifications to Ofsted (serious injuries, deaths, involvement of police, absconding, serious complaints)
4. **Placement ending:**
   - Planned ending: transition plan, post-placement support arrangements
   - Unplanned ending: notification to placing authority, Ofsted notification if appropriate, impact assessment on other children in the home

**Data Requirements:**
- Child profile: full name, DOB, ethnicity, religion, language, immigration status, legal status, placing authority, social worker, IRO
- Legal orders register with dates, expiry, conditions
- Placement history (previous placements)
- LAC review schedule with automated reminders
- Statutory notification templates for Ofsted (Regulation 40 — events/notifications)
- Social worker visit log
- Placing authority contact register

**User Interactions:**
- **Registered manager (desktop):** Placement matching tool (assess risk to/from existing children); admission checklist tracker; LAC review diary; Ofsted notification drafting
- **Key worker (mobile/tablet):** Daily logs for assigned children; record social worker visits; update essential information
- **Responsible Individual (desktop):** Multi-home overview; placement trends; occupancy monitoring

### 3.2 Education Tracking — PEP (Personal Education Plans)

Education is a statutory priority for LAC children. Every looked-after child must have a **Personal Education Plan (PEP)** reviewed termly.

**Workflow:**
1. **Education record setup** — School/educational setting, year group, SEN (Special Educational Needs) status, EHCP (Education, Health and Care Plan) if applicable, attendance record
2. **PEP creation** — Collaborative document completed by school, social worker, carer (home), and (where age-appropriate) the young person. Covers:
   - Current attainment and progress
   - Targets for the term
   - Pupil Premium Plus allocation and how it's being used
   - Barriers to learning
   - Emotional wellbeing at school
   - Attendance data
   - Extra-curricular activities
3. **PEP review cycle** — Termly (3 times per year). System tracks: PEP meeting dates, attendees, outcomes, action points with owners
4. **Daily education log** — Staff record: school attendance (on time, late, absent, excluded), homework completion, communication from school, positive achievements, any concerns
5. **Exclusion tracking** — Fixed-term and permanent exclusions logged with dates, reasons, actions taken, alternative provision arranged

**Data Requirements:**
- School/college record per child (name, contact, designated teacher for LAC)
- PEP documents with versioning (termly)
- PEP meeting records: date, attendees, actions, review dates
- Daily education log: attendance, achievements, concerns
- SEN/EHCP records
- Exclusion records
- Pupil Premium Plus tracking (allocation, spend, impact)
- Attainment data (key stage levels, GCSE predictions, progress measures)

**User Interactions:**
- **Key worker (mobile/tablet):** Daily education log; record school communication; note achievements
- **Registered manager (desktop):** PEP compliance tracker (are all PEPs current?); education dashboard; exclusion monitoring
- **Education coordinator (if separate role):** PEP meeting scheduling; liaison with designated teachers; Pupil Premium tracking

### 3.3 Age-Appropriate Outcome Measurement

Outcome measurement for children must be developmentally appropriate and cover different domains from adult care.

**Workflow:**
1. **Baseline assessment** — On admission, comprehensive assessment of the child's wellbeing across domains:
   - Physical health and development
   - Emotional and behavioural development
   - Identity and self-esteem
   - Family and social relationships
   - Social presentation
   - Self-care skills
   - Education (see PEP section)
2. **Outcome framework** — Structured measurement using recognised frameworks:
   - **SDQ (Strengths and Difficulties Questionnaire)** — standardised tool, completed periodically
   - **BERRI (Behavioural and Emotional Rating and Reporting Index)** — for tracking emotional/behavioural progress
   - **Outcomes Star** — visual tool showing progress across life domains
   - Custom outcomes linked to the child's care plan
3. **Progress recording** — Staff record observations linked to outcome domains in daily logs; formal assessments at defined intervals
4. **Age-appropriate presentation** — For older children/young people: accessible views of their own progress; for younger children: visual/pictorial formats
5. **Review integration** — Outcome data feeds into LAC reviews and Ofsted evidence

**Data Requirements:**
- Assessment tools (SDQ, Outcomes Star, custom) with scoring
- Domain-based outcome records with baseline and periodic scores
- Progress visualisations (spider charts, line graphs)
- Age-appropriate templates (different for under-10s, 10-15, 16+)
- Integration with LAC review records

### 3.4 Children's Safeguarding Workflows

Children's safeguarding is fundamentally different from adult safeguarding. The legal framework (Children Act 1989/2004, Working Together to Safeguard Children 2023) and processes are distinct.

**Workflow:**
1. **Concern recording** — Any staff member can raise a safeguarding concern. Structured form capturing:
   - Date/time of concern/disclosure
   - Exact words used by the child (verbatim recording)
   - Staff member's observations
   - Context (what was happening before/during/after)
   - Any visible injuries (body map with injury description)
   - Actions already taken
2. **Designated Safeguarding Lead (DSL) review** — DSL reviews concern within defined timeframe; decides on:
   - Internal monitoring
   - Referral to LADO (Local Authority Designated Officer) if allegation against staff
   - Referral to Children's Social Care (MASH/Front Door)
   - Referral to police (if immediate risk)
3. **Referral tracking** — If referred externally, system tracks: referral date, agency referred to, reference number, outcome, ongoing actions
4. **Strategy meeting records** — If a Section 47 investigation is initiated, system records strategy meeting attendance, decisions, actions
5. **Child protection plan** — If the child is subject to a CP plan, system tracks: plan details, conference dates, core group meetings, actions, review dates
6. **Allegations against staff** — Separate, restricted-access workflow for allegations against staff members. Only DSL and senior leadership can access. LADO referral tracking
7. **Historical concerns** — All concerns retained chronologically per child, providing a "concern trajectory" that shows patterns over time

**Data Requirements:**
- Safeguarding concern forms with body map tool
- Verbatim recording fields (no paraphrasing)
- Referral records (to MASH, LADO, police)
- Strategy meeting and CP conference records
- Child protection plan tracking
- Staff allegation records (restricted access)
- Chronological concern history per child
- Audit trail (who viewed what, when)

**User Interactions:**
- **Any staff member (mobile/tablet):** Raise concern form — accessible, quick, guided (prompts for verbatim recording, body map)
- **DSL/Registered Manager (desktop):** Safeguarding dashboard — open concerns, pending decisions, overdue actions; referral tracking; LADO case management
- **Responsible Individual:** Multi-home safeguarding overview; pattern analysis; Ofsted notification management

### 3.5 Key Worker Sessions

Every child in a residential home has an assigned **key worker** — a staff member with particular responsibility for their wellbeing and advocacy.

**Workflow:**
1. **Key worker assignment** — Each child assigned a key worker and deputy key worker. Assignment tracked with start dates and changes
2. **Session planning** — Key worker sessions held regularly (typically weekly). Session plans cover:
   - Check-in on the child's emotional state
   - Review of the week (positives, challenges)
   - Progress against care plan goals
   - Education updates
   - Health appointments/needs
   - Family contact review
   - Future planning (activities, goals)
   - The child's wishes and feelings
3. **Session recording** — Structured template completed during/after session:
   - Topics discussed
   - Child's views (in their own words where possible)
   - Actions agreed
   - Key worker observations and assessment
   - Mood/wellbeing rating
4. **Session tracking** — Manager monitors: are all key worker sessions happening? Are there patterns in what children are raising? Are actions being followed through?

**Data Requirements:**
- Key worker assignment records
- Session schedule and compliance tracker
- Session records (structured template + free text)
- Action tracking from sessions
- Child's voice/wishes records
- Wellbeing tracking over time from sessions

### 3.6 Contact & Family Visit Records

Maintaining family contact is a key part of children's care, but it must be managed carefully (some children have restricted or supervised contact due to safeguarding concerns).

**Workflow:**
1. **Contact plan** — Defined in the child's care plan and placement plan. Specifies:
   - Who the child can have contact with (approved contacts list)
   - Type of contact (face-to-face, phone, video call, letter)
   - Frequency (e.g., weekly phone call with mum, monthly supervised visit with dad)
   - Supervision level (unsupervised, supervised by staff, supervised by social worker)
   - Any restrictions or court orders (e.g., no contact with specific individuals, supervised contact only)
2. **Visit/contact booking** — System manages contact schedule; tracks upcoming and completed contacts
3. **Contact recording** — After each contact, staff record:
   - Date, time, duration
   - Type and method
   - Who was present
   - The child's presentation before, during, and after contact
   - Any concerns arising
   - Any disclosures made
4. **Restricted contacts** — Strict access controls. Staff alerts if an unapproved person attempts contact. Clear documentation of court orders and restrictions

**Data Requirements:**
- Approved contacts register per child (name, relationship, contact type, frequency, supervision level)
- Contact restriction records (with legal basis — court order reference)
- Contact schedule and compliance tracking
- Contact records (structured: date, time, duration, type, attendees, observations)
- Child's emotional presentation before/during/after contact
- Alert system for unapproved contact attempts

### 3.7 Behaviour & Rewards Tracking

Behaviour management in children's homes uses positive reinforcement rather than punitive approaches.

**Workflow:**
1. **Behaviour expectations** — Home's behaviour expectations documented (age-appropriate, positively framed)
2. **Positive behaviour recording** — Staff record positive behaviours and achievements throughout the day. Can be linked to a reward system
3. **Rewards system** — Configurable per home:
   - Points/token systems (earn points for positive behaviours, spend on privileges/activities)
   - Achievement badges/levels
   - Age-appropriate (different systems for different age groups)
4. **Behaviour incident recording** — When challenging behaviour occurs:
   - Description of behaviour
   - Antecedent (what happened before)
   - Staff response (de-escalation strategies used)
   - Outcome
   - Physical intervention recording (if any — must be detailed: holds used, duration, injury check)
   - Post-incident debrief (with child and separately with staff)
5. **Analysis** — Behaviour patterns over time; trigger analysis; effectiveness of interventions; reduction in incidents as evidence of progress

**Data Requirements:**
- Behaviour expectations document per home
- Positive behaviour log (timestamped, categorised)
- Rewards/points system with balance tracking
- Behaviour incident records (structured form: ABC model, intervention used, outcome)
- Physical intervention register (separate, detailed: technique, duration, injuries, debrief)
- Trend analysis data (incidents per day/week/month, by type, by time, by trigger)

### 3.8 Missing from Care/Home Protocols

Children going missing is one of the most serious and common incidents in children's residential care. The **Philomena Protocol** is widely adopted by UK police forces.

**Workflow:**
1. **Prevention — Philomena Protocol profile:**
   - Pre-completed for each child on admission
   - Contains: recent photo, physical description, known associates, likely locations, phone number, social media accounts, risk factors (CSE, CCE, county lines, trafficking)
   - Ready to share immediately with police if child goes missing
2. **Missing episode:**
   - **Absence noted** — Staff identify child is missing; check home, garden, local area
   - **Risk assessment** — Immediate risk assessment considering: child's age, vulnerability, time of day, weather, known risks, previous missing episodes
   - **Police notification** — If not located within defined timeframe (varies by risk level — could be immediate for high-risk children), notify police with Philomena Protocol information
   - **Placing authority notification** — Social worker and out-of-hours team notified
   - **Ongoing actions** — Regular checks, phone contact attempts, social media monitoring (where appropriate)
   - **Return** — When child returns/is found: physical wellbeing check, safe and well check
3. **Return home interview (RHI):**
   - Statutory requirement: independent RHI within 72 hours of return
   - Records: where the child was, who they were with, what happened, any risks encountered, any exploitation concerns
   - RHI may be conducted by the home (if independent) or by local authority
4. **Post-incident:**
   - Notification to Ofsted (if meets notification threshold — Regulation 40)
   - Update risk assessment
   - Update Philomena Protocol profile if new information obtained
   - Pattern analysis: frequency of missing episodes, triggers, times, destinations

**Data Requirements:**
- Philomena Protocol profile per child (photo, description, risk factors, known locations, associates)
- Missing episode records: timeline (when noticed, when reported, when found/returned), actions taken, agency contacts
- Risk assessment at point of going missing
- Police reference numbers
- Return home interview records
- Ofsted notification records
- Missing episode trend data (frequency, duration, patterns)

**User Interactions:**
- **Staff (mobile/tablet):** Quick-access missing protocol launch (one tap to see Philomena profile and initiate reporting workflow); timer from when missing noted; guided step-by-step protocol
- **Registered manager (desktop):** Missing dashboard — any children currently missing; historical episodes; pattern analysis; Ofsted notifications; overdue RHIs
- **Responsible Individual:** Cross-home missing episode monitoring; trend analysis; policy compliance

### 3.9 Transition & Leaving Care Planning

Young people in residential care eventually transition out — typically at 16-18 into semi-independent living, or at 18+ into adult services or independent living.

**Workflow:**
1. **Pathway planning** — From age 16, each young person has a Pathway Plan (statutory requirement under Children (Leaving Care) Act 2000):
   - Accommodation plans
   - Education, employment, and training (EET) plans
   - Financial capability (budgeting, managing money)
   - Health (registration with GP, dentist; managing own appointments; understanding own health needs)
   - Life skills (cooking, cleaning, laundry, shopping)
   - Social networks and support systems
   - Identity and emotional wellbeing
2. **Skills readiness assessment** — Regular assessment of the young person's readiness for independent living across all pathway plan domains
3. **Transition timeline** — Phased transition plan with milestones (e.g., "3 months before leaving: practise cooking independently; 2 months: manage own weekly budget; 1 month: taster stay at new accommodation")
4. **Leaving care support** — Post-18 keeping-in-touch arrangements; Personal Adviser contact details; local authority leaving care team coordination
5. **Record transfer** — On leaving, relevant records (health passport, education records, personal documents) prepared for the young person to take with them

**Data Requirements:**
- Pathway plan document (structured, multi-domain)
- Skills readiness assessments with progressive scores
- Transition timeline with milestones and status
- Post-care contact records
- Document inventory for handover
- Personal Adviser details

---

## 4. Rostering & Staff Management

Rostering and staff management cut across all three care domains but with different patterns. This section covers the shared features and domain-specific variations.

### 4.1 Shift Patterns & Rota Templates

**Workflow:**
1. **Shift pattern definition:**
   - **Domiciliary care:** Runs/rounds — sequences of visits forming a carer's route for part of the day (morning run, lunch run, tea run, bed run). Not fixed-length shifts; varies by visit load
   - **Supported living:** Longer shifts (8-12 hour days/nights) with handover periods. Sleep-in and waking night shifts as distinct types
   - **Children's homes:** Shift-based (typically 8am-8pm days, 8pm-8am nights, or shorter shifts). 2-on-2-off, 3-on-3-off patterns common. Must maintain minimum staffing ratios per Ofsted registration
2. **Template creation:** Repeating rota patterns saved as templates:
   - Weekly templates (Monday-Sunday shift layout)
   - Rolling patterns (e.g., 4-week rolling rota)
   - Per-home/per-service templates
3. **Template application:** Apply template to a future period, then customise for specific needs (holidays, training days, additional cover)

**Data Requirements:**
- Shift type definitions: name, start/end times, break rules, pay rate, sleep-in rules
- Rota templates: per-service, per-role, per-shift pattern
- Staffing requirement rules: minimum staffing per shift, required qualifications per shift, male/female ratios (children's homes)
- Rolling pattern definitions

**User Interactions:**
- **Rota manager (desktop):** Template builder (visual, drag-and-drop); pattern configuration; staffing requirement rules setup
- **Staff (mobile):** View assigned shifts; request shift swaps; view team rota

### 4.2 Drag-and-Drop Scheduling

**Workflow:**
1. **Visual rota board** — Grid view showing staff on Y-axis, days/times on X-axis. Shifts displayed as coloured blocks
2. **Assignment** — Drag staff members onto shift slots; drag visits onto carer timelines (dom care)
3. **Conflict detection** — Real-time warnings for:
   - Double-booking (staff assigned to overlapping shifts)
   - Working time directive violations (>48 hours/week average, <11 hours rest between shifts)
   - Skills/qualification gaps (unqualified staff on shifts requiring specific competencies)
   - Contractual hours exceeded/under-utilised
   - Travel time impossibilities (dom care — next visit starts before carer can possibly arrive)
4. **Bulk operations** — Copy previous week; apply template; fill all gaps with available staff; swap two staff members across shifts

**Data Requirements:**
- Staff availability records (regular availability + exceptions)
- Working time directive compliance calculations
- Contract hours per staff member
- Skills/qualifications matrix
- Geographic data for travel calculations (dom care)

### 4.3 Auto-Scheduling Based on Skills/Availability

**Workflow:**
1. **Constraint definition** — Manager defines rules:
   - Hard constraints (must be satisfied): qualified staff on medication runs, DBS clearance, right-to-work, minimum staffing ratios
   - Soft constraints (prefer but can override): continuity of carer, carer preferences, geographic proximity, even hour distribution
2. **Auto-schedule generation** — Algorithm generates optimal rota based on constraints. Considers: staff availability, contracted hours, skills, location, preferences, Working Time Directive, cost optimisation
3. **Manual review and adjustment** — Manager reviews generated rota; makes manual adjustments; system re-validates after changes
4. **Gap filling** — Auto-suggest available staff for unfilled shifts, ranked by suitability (skills match + availability + cost)

**Data Requirements:**
- Constraint rules (hard and soft, configurable per service)
- Staff skills/competency matrix
- Client requirements/preferences
- Cost data (hourly rates, overtime rules, agency rates)
- Historical assignment data (for continuity scoring)

### 4.4 Staff Compliance Tracking (DBS, Training, Supervision)

**Workflow:**
1. **DBS management:**
   - Track DBS certificate: issue date, certificate number, level (basic, standard, enhanced, enhanced with barred list)
   - DBS Update Service subscription tracking (annual renewal)
   - Expiry/rechecking reminders (configurable — e.g., 3-yearly recheck)
   - Status dashboard: who is compliant, who is approaching expiry, who is overdue
2. **Mandatory training:**
   - Training matrix: which qualifications/courses are required for which roles
   - Training records: course name, provider, date completed, certification, expiry date
   - Automated reminders for expiring certifications (first aid, medication administration, safeguarding, moving and handling, fire safety, food hygiene)
   - Training compliance dashboard: percentage compliant per team/service
   - Domain-specific training: Ofsted-required training for children's homes staff, CQC-required training for adult care
3. **Supervision:**
   - Supervision schedule: all staff must receive regular supervision (typically monthly for frontline, 6-8 weekly for managers)
   - Supervision record: structured template covering workload, wellbeing, development, concerns, actions
   - Supervision compliance tracker: who is up to date, who is overdue
   - Appraisal tracking: annual/bi-annual appraisals
4. **Right to work:**
   - Document storage: passport, visa, biometric residence permit
   - Expiry tracking for time-limited permissions
   - Re-check reminders

**Data Requirements:**
- DBS records: certificate details, update service subscription, check dates, status
- Training matrix: role → required courses mapping
- Training records: course, date, provider, certificate, expiry
- Supervision records: date, supervisor, supervisee, template fields, actions
- Right-to-work documents: type, reference, expiry, scan
- Compliance status calculations (current/approaching expiry/overdue)

**User Interactions:**
- **HR/compliance (desktop):** Compliance dashboard — red/amber/green status per staff member per requirement; bulk reminder sending; report generation for CQC/Ofsted
- **Manager:** Team compliance overview; supervision diary and record completion
- **Staff (mobile):** View own training record; see upcoming training/supervision; upload certificates

### 4.5 Timesheets & Payroll Export

**Workflow:**
1. **Timesheet generation:**
   - **Dom care:** Auto-generated from EVV check-in/check-out data + travel time
   - **Supported living & children's homes:** Auto-generated from shift clock-in/clock-out (via app or on-site device)
2. **Timesheet review:** Manager reviews timesheets, approves/adjusts. Discrepancies flagged (actual vs scheduled)
3. **Pay calculation:** System applies pay rules:
   - Base hourly rate per contract
   - Overtime rules (time-and-a-half, double time)
   - Weekend/bank holiday enhancements
   - Sleep-in rates (flat rate or hourly — varies by employer)
   - Waking night rates
   - Mileage reimbursement (dom care)
   - Holiday accrual calculations
4. **Payroll export:** Data exported in format compatible with payroll systems (Sage Payroll, Xero, BrightPay, or generic CSV)

**Data Requirements:**
- Clock-in/clock-out records per shift
- EVV data (dom care)
- Pay rules per contract type
- Enhancement rates (weekend, bank holiday, night, overtime)
- Mileage data
- Holiday accrual and usage
- Export format specifications per payroll provider

### 4.6 Agency Staff Management

Care providers frequently use agency staff to fill gaps. This requires separate tracking and cost management.

**Workflow:**
1. **Agency register** — Approved agencies recorded with: contact details, rates, framework agreement terms, insurance/indemnity details
2. **Shift posting** — Unfilled shifts posted to agencies (ideally via integration or portal, not email/phone)
3. **Agency worker onboarding** — Light-touch onboarding: identity verification, DBS status confirmation, induction checklist, mandatory training verification
4. **Shift working** — Agency staff use the same mobile app as permanent staff (restricted access); same EVV/check-in process
5. **Cost tracking** — Agency spend tracked per shift, per service, per period. Comparison with permanent staff costs
6. **Agency invoice reconciliation** — Match agency invoices against confirmed shift data to avoid overpayment

**Data Requirements:**
- Agency register: name, contact, rates, terms, compliance documents
- Agency worker profiles: identity, DBS, training, induction status
- Agency shift records: bookings, confirmations, actual hours, costs
- Agency spend reports and trend data
- Invoice reconciliation records

---

## 5. Family Portal

A family portal serves different purposes across the three care domains. The core principle is **transparent communication** that builds trust while respecting confidentiality and safeguarding boundaries.

### 5.1 What Family Members Need to See

**Domain-specific content:**

**Domiciliary Care (families of elderly/disabled adults):**
- Visit schedule (who is coming, when)
- Visit completion confirmations (visit happened, on time, all tasks completed)
- Care notes (filtered — not raw staff notes, but family-appropriate summaries)
- Medication administration records
- Health observations and trends (fluid intake, nutrition, mood, mobility)
- Upcoming appointments
- Care plan view (read-only)
- Photo updates (with client consent)

**Supported Living (families of adults with LD/autism/MH):**
- Support plan overview (with the person's consent — they are adults)
- Activity updates (what they've been doing in the community)
- Achievement celebrations (skills gained, goals met)
- Health and wellbeing updates
- Upcoming events and activities
- Photo/video sharing (consent-gated by the person)
- Note: The person supported has control over what their family sees (they are an adult tenant)

**Children's Homes (families of looked-after children):**
- Contact schedule (approved contacts only)
- General wellbeing updates (carefully worded, approved by registered manager before publishing)
- Education progress (where appropriate and approved)
- Photos of activities and achievements (approved for sharing)
- Upcoming events (where family involvement is appropriate)
- Note: **Strict access controls** — only approved contacts can access; content must be reviewed/approved before publishing due to safeguarding concerns (some families may be the source of risk)

### 5.2 Communication Features

**Workflow:**
1. **Messaging** — Secure in-app messaging between family members and care team. Not a general chat — structured, logged, and auditable
2. **Message approval** — In children's homes: all outgoing communications to family may require manager approval before sending
3. **Notifications** — Push/email notifications for: visit completed, care note added, photo shared, message received, care plan updated, appointment reminder
4. **Update feeds** — Chronological feed of updates (like a social media timeline but for care). Filters by type: visits, health, activities, education, general
5. **Two-way feedback** — Family can leave comments, ask questions, raise concerns. All logged and visible to care team

**Data Requirements:**
- Message records with sender, recipient, timestamp, content, approval status
- Notification preferences per family member
- Content approval workflows (children's homes)
- Feedback/comment records
- Communication audit trail

### 5.3 Consent Management

**Workflow:**
1. **Consent types:**
   - Data sharing consent (who can see what data about the person)
   - Photo/video consent (can images be taken? Can they be shared with family? On social media?)
   - Medical consent (for children: who can consent to medical treatment)
   - Information sharing with external agencies
   - Research/feedback consent
2. **Consent recording:**
   - Digital consent forms with electronic signature
   - Consent given by whom (person themselves, family member with authority, social worker for LAC children, court-appointed deputy)
   - Date given, review date, conditions/restrictions
3. **Consent enforcement:**
   - System respects consent settings — if photo consent not given, photo upload is blocked for that person
   - Family portal content filtered by consent settings
   - Alerts when consent is approaching review date or has expired
4. **Capacity considerations:**
   - For adults who may lack capacity: Mental Capacity Act assessment records; best interests decision records
   - For children: parental responsibility determination; local authority delegation of authority

**Data Requirements:**
- Consent records: type, status, given by, date, expiry, conditions
- Consent enforcement rules linked to system features
- Mental capacity assessment records
- Parental responsibility records
- Electronic signature capture and verification

### 5.4 Photo & Update Sharing

**Workflow:**
1. **Photo capture** — Staff take photos during activities/outings (mobile app). Photos tagged with: person(s) in photo, activity, date, location
2. **Consent check** — System verifies photo consent is in place for each person in the photo before allowing upload
3. **Approval** — In children's homes: all photos reviewed by manager before sharing to family portal
4. **Sharing** — Approved photos appear in family portal feed. Family can view, comment, download (if permitted)
5. **Storage** — Photos stored securely with encryption; retention policy applied; GDPR compliant

**Data Requirements:**
- Photo records: image file, metadata (who, what, when, where), consent status, approval status
- Photo consent per person (granular: take photos yes/no, share with family yes/no, share on social media yes/no)
- Approval workflow records
- Secure storage with encryption at rest

### 5.5 Visit Booking (Children's Homes)

**Workflow:**
1. **Available slots** — Home defines available contact/visit slots (not open-ended — visits are scheduled and managed)
2. **Booking request** — Approved family contacts can request visit slots through the portal
3. **Manager approval** — Registered manager reviews request, checking against: contact plan, other visits scheduled, staffing availability, safeguarding considerations
4. **Confirmation** — Approved visit added to the home's calendar; notification sent to family member and relevant staff
5. **Visit recording** — After the visit, staff record observations (see Contact & Family Visit Records section)

**Data Requirements:**
- Visit slot availability calendar
- Booking requests with status (requested, approved, declined, cancelled)
- Approval workflow with reason recording
- Integration with contact plan and safeguarding restrictions
- Calendar integration for staff and family

---

## 6. AI Integration Opportunities

AI represents the most significant differentiation opportunity. Existing competitors are beginning to add AI features (Unique IQ's AI Suite, PASS's PASSgenius, Care Control's MargoAI, Ablyss's BlyssAI), but all are focused narrowly on care note enhancement. A comprehensive AI strategy across all three domains could leapfrog competitors.

### 6.1 Where AI Adds Most Value in Care Management

**Ranked by impact and feasibility:**

| Priority | AI Feature | Impact | Feasibility | Domain |
|----------|-----------|--------|-------------|--------|
| 1 | Care note generation/assistance | Very High | High (proven) | All |
| 2 | Compliance gap detection | Very High | High | All |
| 3 | Risk prediction & early warning | Very High | Medium | All |
| 4 | Smart scheduling/rostering | High | Medium | Dom care, SL |
| 5 | Automated report generation | High | High | All |
| 6 | Natural language querying | Medium | Medium | All |
| 7 | Behaviour pattern analysis | High | Medium | SL, Children's |
| 8 | Sentiment analysis of care notes | Medium | Medium | All |

### 6.2 Care Note Generation & Assistance

This is the most immediately valuable and already-proven AI application in care.

**Capabilities:**
1. **Voice-to-text with enhancement** — Carer speaks notes into the mobile app; AI transcribes and then enhances the text:
   - Corrects grammar and spelling
   - Structures the note clearly (person, action, outcome)
   - Ensures person-centred language (replaces "fed the client" with "supported [Name] with their meal")
   - Flags missing information ("You mentioned medication but didn't record which medication — please add")
2. **Note expansion** — Carer enters brief notes ("Helped John shower, had breakfast, took meds"); AI expands to a professional, detailed record: "Supported John with his morning personal care routine, including a shower. John was in good spirits and managed most of his personal care independently with minimal verbal prompting. Assisted John with breakfast preparation — he chose toast and tea. Administered morning medications as per MAR chart."
3. **Multi-language support** — Carers who speak English as a second language can dictate in their first language; AI translates and writes the note in professional English. (Care Control's MargoAI already offers this feature.)
4. **Contextual prompts** — AI knows the client's care plan and prompts for relevant observations: "John's care plan includes fluid intake monitoring — would you like to record fluid intake for this visit?"
5. **Daily/shift summary generation** — AI generates an end-of-day summary from all notes entered during a shift, highlighting key events, concerns, and actions needed for handover

**Data Requirements:**
- Speech-to-text engine (with UK accent models; care terminology training)
- Care plan context for each client (to inform prompts and expansion)
- Person-centred language rules and terminology mapping
- Multi-language translation models
- Organisation-specific style and tone preferences

**User Interactions:**
- **Carer (mobile):** Voice recording button; AI draft appears for review; carer approves or edits before saving; never auto-submits
- **Manager:** Review AI-assisted notes; quality audit of AI outputs; configure style preferences

### 6.3 Risk Prediction & Early Warning

**Capabilities:**
1. **Deterioration detection** — AI monitors patterns across care notes and observations to detect early signs of deterioration:
   - Declining food/fluid intake over multiple visits
   - Increasing falls or near-misses
   - Changes in mood/behaviour patterns
   - Weight loss trends
   - Increasing confusion/disorientation
   - Skin integrity changes
   - Medication refusal patterns
2. **UTI/infection prediction** — Based on patterns of confusion, temperature, fluid intake, and continence changes
3. **Hospital admission risk** — Composite risk score based on multiple indicators
4. **Safeguarding concern indicators** — AI flags care notes that may indicate safeguarding concerns (unexplained injuries, changes in behaviour, disclosures)
5. **Children's homes specific:**
   - Missing episode prediction (patterns before previous episodes: mood changes, specific contacts, time of week)
   - Exploitation risk indicators (new associates, unexplained possessions, going missing, mood changes)
   - Placement breakdown risk (escalating incidents, relationship deterioration, persistent absconding)

**Data Requirements:**
- Historical care notes corpus (months/years of data)
- Health observation trends (vitals, weight, fluid intake)
- Incident and safeguarding records
- Hospital admission records (for outcome labelling)
- Children's homes: missing episode history, behaviour data

**User Interactions:**
- **Manager dashboard:** Risk score per person (0-100 or traffic light); drill-down to see contributing factors; trend over time
- **Carer (mobile):** Alert when recording: "Based on recent notes, [Person]'s fluid intake has declined for 3 consecutive days — consider escalating"
- **Registered manager (children's):** Exploitation risk dashboard; placement stability scores; early warning alerts

### 6.4 Compliance Gap Detection

**Capabilities:**
1. **Real-time auditing** — AI continuously reviews all records against regulatory standards:
   - **CQC (adult care):** Checks evidence against the five key questions (Safe, Effective, Caring, Responsive, Well-led) and the Single Assessment Framework
   - **Ofsted (children's homes):** Checks against Children's Homes Regulations 2015 quality standards
   - Common gaps: overdue care plan reviews, missing risk assessments, expired training, overdue supervisions, incomplete medication records, unsigned documents
2. **Inspection readiness score** — Aggregate compliance score showing overall readiness for inspection, broken down by domain/regulation
3. **Automated action generation** — When a gap is detected, AI generates a specific action: "Care plan for [Person] was last reviewed 4 months ago. Quality Standard 6.1 requires reviews at least every 4 weeks. Action: Schedule care plan review within 7 days."
4. **Document completeness checking** — AI reviews care plans, risk assessments, and other documents for completeness: missing sections, outdated information, unsigned entries

**Data Requirements:**
- Regulatory standard databases (CQC KLOEs, Ofsted quality standards, regulations)
- All system records (care plans, risk assessments, training records, supervisions, incident records)
- Document templates with required field definitions
- Review schedule rules per document type

**User Interactions:**
- **Manager dashboard:** Compliance score (percentage); gap list with severity and deadline; trend over time (improving or deteriorating)
- **Staff (mobile):** Notifications when their actions are overdue
- **Responsible Individual / RI:** Multi-service compliance comparison; portfolio risk view

### 6.5 Smart Scheduling & Rostering

**Capabilities:**
1. **Automated rota generation** — AI generates optimal rotas considering all constraints:
   - Staff availability and contracted hours
   - Skills and qualifications matching
   - Client preferences and continuity
   - Geographic optimisation (dom care — minimise travel)
   - Working Time Directive compliance
   - Cost optimisation (minimise overtime and agency use)
   - Fair distribution of unsocial hours
2. **Dynamic rescheduling** — When disruptions occur (staff sickness, client cancellation), AI suggests best redistribution of work
3. **Demand prediction** — AI predicts staffing demand based on patterns:
   - Seasonal variation (more sickness in winter, more holiday cover in summer)
   - Historical patterns (certain clients more likely to need extra support at certain times)
   - Upcoming events (hospital appointments, family visits)
4. **Cost forecasting** — Predict staffing costs for future periods based on demand and availability

**Data Requirements:**
- Complete staff records (availability, skills, contracts, preferences)
- Complete client/service user records (requirements, preferences)
- Historical rota data (for pattern learning)
- Cost data (pay rates, overtime rules, agency rates)
- External factors (bank holidays, school holidays, weather)

### 6.6 Natural Language Querying of Care Data

**Capabilities:**
1. **Plain English queries** — Managers and administrators can ask questions in natural language instead of navigating complex report builders:
   - "How many missed visits did we have last month?"
   - "Which staff members have overdue DBS checks?"
   - "Show me all children who have had more than 2 missing episodes in the last 3 months"
   - "What is our average visit duration for clients in the SW1 postcode area?"
   - "Which clients have declining fluid intake this week?"
2. **Conversational follow-up** — "Break that down by service" → "Compare to the same period last year" → "Export this as a PDF"
3. **Proactive insights** — AI surfaces unsolicited insights: "I noticed that missing visits increased by 15% this month compared to last month, primarily on Friday evenings. Would you like to see the detail?"

**Data Requirements:**
- Natural language processing (NLP) engine with care-domain training
- Access to full data warehouse (visits, care notes, incidents, compliance, staffing, finance)
- Query history for learning user preferences
- Response templates for common queries

### 6.7 Automated Report Generation

**Capabilities:**
1. **Regulatory reports:**
   - CQC Provider Information Return (PIR) — auto-populated from system data
   - Ofsted Regulation 44 visit reports — template auto-filled with relevant data
   - Ofsted Regulation 45 quality of care reports — auto-generated from period data
   - Monthly monitoring reports for commissioners
2. **Management reports:**
   - Weekly/monthly operational dashboards
   - Key performance indicator (KPI) reports
   - Incident trend analysis
   - Staff utilisation and cost reports
   - Occupancy and placement reports (children's homes)
3. **Narrative generation** — AI writes narrative sections of reports based on data:
   - "During this period, the home supported 8 young people. There were 3 safeguarding concerns raised, all of which were responded to within the required timescales. Two young people experienced missing episodes, a decrease from 5 in the previous period. Education attendance averaged 87%, an improvement of 4 percentage points..."
4. **Custom report builder** — Drag-and-drop report creator with AI-suggested metrics based on the report purpose

**Data Requirements:**
- Report templates per regulatory requirement
- Full system data for auto-population
- Narrative generation models trained on care-domain language
- Report scheduling and distribution rules
- Historical reports for comparison

---

## Appendix: Cross-Domain Data Architecture Considerations

For a platform serving all three domains, the data architecture must support:

1. **Shared entities:** Staff records, organisation records, compliance records are shared across domains
2. **Domain-specific entities:** Visit records (dom care), tenancy records (SL), placement records (children's) are domain-specific
3. **Flexible person model:** "Client" in dom care, "person supported" in supported living, "young person" or "child" in children's homes. The underlying data model is the same but the presentation, terminology, and regulatory requirements differ
4. **Regulatory switching:** A single organisation may be registered with both CQC and Ofsted. The platform must understand which regulations apply to which service and tailor compliance checking accordingly
5. **Multi-site:** Care groups operate multiple services across domains. Directors/RIs need cross-service dashboards with role-based access control
6. **Audit trail:** Every change to every record must be logged with who, what, when, and why. Non-repudiable for regulatory purposes
7. **Data retention:** Different retention periods per domain and document type. GDPR compliant with automated retention/destruction schedules

---

## Sources & References

### Domiciliary Care
- Unique IQ — Best Home Care Management Software UK: 2026 Guide (uniqueiq.co.uk)
- CareLineLive — 12 things to check when choosing home care management software (carelinelive.com)
- QCS/Carebeans — Domiciliary Care Software features (qcs.co.uk)
- AlayaCare — Tools Home Care Workers Need for Travel Efficiency (alayacare.com)
- AxisCare — EVV Software for Home Care (axiscare.com)
- CareCallAI — Home Care Management Software UK (carecallai.co.uk)

### Supported Living
- The Access Group — Supported Living Software: What It Is and How It Differs (theaccessgroup.com, March 2026)
- Log My Care — Supported Living Software features (logmycare.co.uk)
- Care Pathway Pro — Positive Behaviour Support System (carepathwaypro.co.uk)
- ECCO Solutions — Supported Living Systems (eccosolutions.co.uk)
- QCS/Carebeans — Supported Living Software (qcs.co.uk)
- CQC — Right Support, Right Care, Right Culture guidance (updated February 2026)
- SCIE — Care Act guidance on supported living

### Children's Residential Homes
- Mentor Software — Children's Home Software (mentorsoftware.co.uk)
- Sue Solutions — Residential Children's Homes Software (suesolutions.co.uk)
- CHARMS/Social Care Network — Children's Residential Care platform (socialcarenetwork.com)
- Alternative Care Systems (ACS) — Children's Care Home Software (alternativecaresystems.com)
- DfE — Guide to the Children's Homes Regulations 2015 (assets.publishing.service.gov.uk)
- DfE — Promoting the Education of Looked-After Children guidance (2018)
- Ofsted — Children's Homes Registration Policy (gov.uk, October 2025)
- Wandsworth SCP — Children Missing from Home and Care Protocol (wscp.org.uk)
- South Yorkshire — Philomena Protocol (dscp.org.uk)
- Child Law Advice — Education for Looked After Children (childlawadvice.org.uk)

### Staff Management & Rostering
- Florence — Rota: Rostering Built for Social Care (florence.co.uk)
- Syncurio — Care Home Rostering System (syncurio.co.uk)
- Orta — Workforce Management for Care Providers (orta.co.uk)
- ACS — Staff management and compliance features (alternativecaresystems.com)
- CHARMS — Staff and rota management (socialcarenetwork.com)

### Family Portal
- KareInn — Resident and Family Portal (kareinn.com)
- Person Centred Software — Family Engagement Module (personcentredsoftware.com)
- CareLineLive — Family Portal features (carelinelive.com)
- Care Vision — Family App (carevisioncms.co.uk)
- Centrim Life — Care Home Visit Booking System (centrimlife.co.uk)

### AI in Care
- Unique IQ — AI Suite: IQ:careaudit and IQ:careassist (uniqueiq.co.uk)
- Care Control — MargoAI features (carecontrolsystems.co.uk)
- Ablyss — BlyssAI: AI-Powered Care Plan Assistant (ablyss.co.uk)
- everyLIFE — PASSgenius AI suite (everylifetechnologies.com)
- Capgemini — Healthcare Trends 2026: AI in Healthcare Delivery (capgemini.com)
- PPL — Virtual Wallet for personal budgets (myvirtualwallet.co.uk)
