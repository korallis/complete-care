# UK Care Regulatory Compliance Research

> **Research Date:** March 2026  
> **Purpose:** Comprehensive compliance requirements for building a care management software platform serving domiciliary care, supported living, and children's residential homes in England.  
> **Regulators:** CQC (Care Quality Commission) for adult social care | Ofsted for children's homes  
> **Key Sources:** CQC official guidance, Children's Homes (England) Regulations 2015, Guide to the Children's Homes Regulations, Social Care Common Inspection Framework (SCCIF), legislation.gov.uk

---

## Table of Contents

1. [CQC Compliance (Domiciliary Care & Supported Living)](#1-cqc-compliance)
   - [1.1 The 5 Key Questions](#11-the-5-key-questions)
   - [1.2 Single Assessment Framework (SAF)](#12-single-assessment-framework-saf)
   - [1.3 Quality Statements](#13-quality-statements)
   - [1.4 Six Evidence Categories](#14-six-evidence-categories)
   - [1.5 Regulation 17: Good Governance](#15-regulation-17-good-governance)
   - [1.6 Documentation & Records Requirements](#16-documentation--records-requirements)
   - [1.7 CQC Ratings](#17-cqc-ratings)
   - [1.8 Inspection Readiness in Software](#18-inspection-readiness-in-software)
2. [Ofsted Compliance (Children's Residential Homes)](#2-ofsted-compliance)
   - [2.1 Children's Homes Regulations 2015 Overview](#21-childrens-homes-regulations-2015-overview)
   - [2.2 The 9 Quality Standards](#22-the-9-quality-standards)
   - [2.3 Regulation 44: Monthly Monitoring Visits](#23-regulation-44-monthly-monitoring-visits)
   - [2.4 Regulation 45: Six-Monthly Quality Review](#24-regulation-45-six-monthly-quality-review)
   - [2.5 Regulation 36: Children's Case Records (Schedule 3)](#25-regulation-36-childrens-case-records-schedule-3)
   - [2.6 Regulation 37: Other Records (Schedule 4)](#26-regulation-37-other-records-schedule-4)
   - [2.7 Safeguarding Requirements](#27-safeguarding-requirements)
   - [2.8 LAC Documentation Requirements](#28-lac-documentation-requirements)
   - [2.9 SCCIF Inspection Framework & Judgements](#29-sccif-inspection-framework--judgements)
   - [2.10 What Makes "Outstanding"](#210-what-makes-outstanding)
3. [CQC vs Ofsted: Overlap & Differences](#3-cqc-vs-ofsted-overlap--differences)
4. [Software Feature Implications](#4-software-feature-implications)

---

## 1. CQC Compliance

**Applies to:** Domiciliary care agencies, supported living services, residential care homes (adults)  
**Legislation:** Health and Social Care Act 2008 (Regulated Activities) Regulations 2014  
**Regulator:** Care Quality Commission (CQC)

### 1.1 The 5 Key Questions

The CQC assesses all services against 5 Key Questions. These remained unchanged from the previous KLOE (Key Lines of Enquiry) system but are now answered through **quality statements** under the Single Assessment Framework (SAF).

| Key Question | Definition | What CQC Looks For |
|---|---|---|
| **Safe** | People are protected from abuse and avoidable harm | Safeguarding systems, risk management, safe environments, medicines management, infection control, safe staffing levels, incident learning culture |
| **Effective** | Care, treatment and support achieves good outcomes, maintains quality of life, based on best evidence | Evidence-based care, needs assessments, staff competency and training, nutrition/hydration, consent processes, multi-disciplinary working |
| **Caring** | Staff involve and treat people with compassion, kindness, dignity and respect | Compassionate interactions, dignity and respect, involvement in care decisions, advocacy, privacy and confidentiality |
| **Responsive** | Services are organised to meet people's needs | Person-centred care plans, timely access to care, complaints handling, flexible and tailored support, end-of-life care (where applicable) |
| **Well-led** | Leadership, management and governance ensure high-quality, person-centred care | Governance frameworks, quality assurance audits, vision and values, staff engagement, continuous improvement, regulatory compliance |

### 1.2 Single Assessment Framework (SAF)

Introduced in **November 2023**, the SAF replaced the previous KLOE-based inspection system:

**Key Changes from KLOEs:**
- **Continuous monitoring** instead of periodic inspections
- **Quality statements** replacing KLOEs under each key question
- **Six evidence categories** applied consistently across services
- **"I" and "We" statements** to focus on lived experience and organisational culture
- **Ratings updated more frequently** based on cumulative evidence
- Provider Information Return (PIR) integrated into ongoing assessment

**Current Status (2026):** The SAF has faced implementation challenges. A CQC consultation completed December 2025 is seeking to improve alignment between providers and regulator. Despite challenges, 64% of providers surveyed remain positive about the CQC's direction.

### 1.3 Quality Statements

Quality statements are expressed as **"We" statements** describing commitments providers must uphold. **"I" statements** reflect what people using services say matters to them.

**Safe – Quality Statements:**
- Learning culture (duty of candour, incident learning)
- Safe systems, pathways and transitions
- Safeguarding (MCA, DoLS, safeguarding policy)
- Involving people to manage risk
- Safe environments
- Safe and effective staffing
- Infection prevention and control
- Medicines optimisation

**Effective – Quality Statements:**
- Assessing needs and working with other professionals
- Staff skills, competence and training
- Nutrition and hydration
- Delivering evidence-based care
- Consent to care and treatment

**Caring – Quality Statements:**
- Promoting autonomy, choice and independence
- Building trusting relationships
- Treating people with kindness, respect, compassion

**Responsive – Quality Statements:**
- Meeting people's needs and personal preferences
- Timely access and continual review of care
- Concerns and complaints handling
- Supporting people at end of life

**Well-Led – Quality Statements:**
- Leadership, governance and culture
- Continuous learning and improvement
- Staff engagement, development and communication
- Partnership working and external accountability
- Regulatory compliance and oversight

#### Example "I" Statements (for care plans/feedback):
- "I can live the life I want and do the things that are important to me as independently as possible"
- "I am treated with respect and dignity"
- "I feel safe and am supported to understand and manage any risks"
- "I am supported to manage my health in a way that makes sense to me"
- "I have people in my life who care about me"

#### Example "We" Statements (for organisational practice):
- "We make sure people are treated with dignity and respect in everything we do"
- "We involve people in decisions about their care"
- "We ensure our staff have the right training, skills and support"
- "We learn from feedback, incidents and complaints"
- "We work openly and honestly with people, families and professionals"

### 1.4 Six Evidence Categories

The CQC gathers evidence across **six categories** (varies slightly by service type):

1. **People's experience of health and care services** – feedback, testimonials, complaints/compliments, survey results
2. **Feedback from staff and leaders** – staff surveys, supervision notes, exit interviews, whistleblowing data
3. **Feedback from partners** – GP/district nurse feedback, commissioner feedback, MDT meeting notes
4. **Observation** – spot checks, quality monitoring visits, care interaction observations
5. **Processes** – care records, policies, recruitment records, governance documentation, audit results
6. **Outcomes** – measurable improvements in health/wellbeing, KPIs (missed visits, medication errors, etc.)

### 1.5 Regulation 17: Good Governance

**Source:** Health and Social Care Act 2008 (Regulated Activities) Regulations 2014, Regulation 17  
**This is arguably the most critical regulation for software compliance.**

#### Requirements (Reg 17(1) and 17(2)):

**17(2)(a) – Assess, monitor and improve quality and safety:**
- Regular audits baselined against Regulations 4-20A
- Systems to identify quality/safety compromises and respond without delay
- Active seeking of stakeholder views (service users, staff, visiting professionals, commissioners)
- Analysis of feedback with demonstrated actions and improvements

**17(2)(b) – Assess, monitor and mitigate risks:**
- Systems to identify and assess risks to health, safety and welfare
- Measures to reduce/remove risks within appropriate timescales
- Processes to minimise likelihood and impact of risks
- Escalation of risks within organisation or to external bodies
- Continuous monitoring of identified risks

**17(2)(c) – Maintain accurate service user records:**
- Complete, legible, indelible, accurate and up to date
- Include all decisions taken about care and treatment
- Reference discussions with service users, carers and those acting on their behalf
- Include consent records and advance decisions
- Accessible to authorised persons for care delivery
- Created, amended, stored and destroyed per legislation (Data Protection Act 2018)
- Kept secure and only accessed by authorised people

**17(2)(d) – Maintain staff and management records:**
- Employment records including fit and proper persons checks (Regulations 4-7, 19)
- Management records: policies, procedures, maintenance records, audits, action plans
- All records per Data Protection Act 2018

**17(2)(e) – Seek and act on feedback:**
- Actively encourage feedback (formal and informal, written and verbal)
- Record and respond to all feedback appropriately
- Analyse feedback to drive improvements
- Communicate how feedback led to improvements

**17(2)(f) – Evaluate and improve governance practices:**
- Continuous improvement of audit and governance systems

**17(3) – Reporting to CQC:**
- Must provide written report within **28 days** when requested by CQC
- Report on compliance with quality/safety requirements
- Include improvement plans
- CQC can prosecute for failure to submit (without Warning Notice)

### 1.6 Documentation & Records Requirements

#### Service User Records (must be maintained per quality statement):

**Safe:**
| Document Type | Description |
|---|---|
| Incident records | Incidents, near misses, events with learning outcomes |
| Duty of candour documentation | Notifications and evidence of candour |
| Safeguarding records | Safeguarding alerts, referrals, investigations |
| DoLS/Court of Protection records | Deprivation of Liberty documentation |
| MCA records | Mental Capacity Act assessments |
| Restrictive practice records | Any use of restrictive interventions |
| Care records | Person-centred care records/clinical records |
| Risk assessments | Individual and environmental risk assessments |
| Medicines records | MAR charts, audits, PRN protocols, reviews |
| Emergency arrangements | Contingency and emergency response plans |
| IPC records | Infection prevention & control policies, audits |
| Business continuity plans | Including extreme weather response |
| Equipment maintenance records | Calibration and maintenance logs |

**Effective:**
| Document Type | Description |
|---|---|
| Care plans | Up-to-date, showing needs, outcomes, reviews |
| Risk assessments | Aligned to current health conditions |
| NICE/best practice adherence | Evidence of following guidelines |
| Post-discharge reviews | Care reviews after hospital discharge |
| Staff continuity records | Records showing continuity of staff |
| Training matrix | Certificates, competency assessments |
| Supervision/appraisal documents | Reflective practice records |
| Induction checklists | Shadowing records |
| Nutrition/hydration plans | Monitoring charts, referrals to specialists |

**Caring:**
| Document Type | Description |
|---|---|
| Testimonials/feedback | From service users and families |
| Complaints/compliments log | With resolution tracking |
| Survey results | Regular satisfaction surveys |
| Spot check records | Quality monitoring visit notes |
| Dignity/respect policy | Documented and evidenced |
| "What matters to me" records | Personal preferences in care plans |
| Advocacy records | Where advocacy involvement needed |
| Decision-making records | Demonstrating choice and MCA |

**Responsive:**
| Document Type | Description |
|---|---|
| Person-centred care plans | With cultural, religious, personal preferences |
| Rostering records | Punctuality, reliability, continuity |
| Missed/late visit logs | With corrective actions |
| Care plan review records | Reassessments and changes |
| Complaints policy and log | Including learning and follow-up |
| End-of-life care plans | Where applicable |
| Advanced care planning | Documentation of advance decisions |

**Well-Led:**
| Document Type | Description |
|---|---|
| Governance framework | Policies, meeting minutes |
| Quality assurance audits | With action plans |
| Risk register | Business and operational risks |
| Quality improvement plans (QIPs) | Ongoing improvement initiatives |
| Lessons learned logs | From incidents and complaints |
| Staff survey data | Including exit interviews |
| Workforce planning docs | Recruitment and retention strategy |
| PIR submissions | Provider Information Return |
| CQC notifications | Safeguarding, DoLS, deaths, incidents |
| GDPR/DSCR compliance records | Data security documentation |

#### Staff Records (Regulation 19 – Fit and Proper Persons):
- DBS checks (enhanced with barred list)
- Two references (one from most recent employer)
- Proof of identity
- Right to work documentation
- Health declaration/assessment
- Employment history with gaps explained
- Interview records
- Professional registration verification
- Induction completion records

#### Medicines Records:
- Must be kept for **at least 8 years** after care ends
- Must include refusals to take medicine
- Must be signed, correctly timestamped (time and date)
- Self-administration must have risk assessments
- If multi-compartment compliance aid is used, each medicine still tracked individually

### 1.7 CQC Ratings

| Rating | Meaning |
|---|---|
| **Outstanding** | The service is performing exceptionally well |
| **Good** | The service is performing well and meeting expectations |
| **Requires Improvement** | The service isn't performing as well as it should |
| **Inadequate** | The service is performing badly and action is taken |

**Rating Calculation Under SAF:**
- Each of the 5 key questions gets a rating
- Evidence from quality statements combined using professional judgement
- Not an average – considers strength of evidence, risks, systemic vs isolated issues
- **A single Inadequate in Safe or Well-Led can significantly reduce the overall rating**
- Overall rating is a professional judgement, not a formula

### 1.8 Inspection Readiness in Software

A care management platform should provide the following to maintain CQC inspection readiness:

**Always-On Evidence Collection:**
- Digital care plans with automatic timestamps and audit trails
- Real-time incident reporting and tracking with learning outcomes
- Medication management with eMAR (electronic Medicines Administration Records)
- Automated alerts for overdue reviews, expired training, lapsed DBS checks
- Feedback collection (surveys, complaints, compliments) with trend analysis

**Compliance Dashboards:**
- Live compliance scoring against each of the 5 key questions
- Quality statement mapping – showing evidence coverage per statement
- Gap analysis highlighting areas without sufficient evidence
- Risk register with escalation workflows
- Staff training matrix with expiry tracking

**Audit & Governance Tools:**
- Configurable audit templates aligned to quality statements
- Scheduled audit reminders with action plan tracking
- Internal quality monitoring with trend analysis
- Automatic generation of quality improvement plans (QIPs)
- Lessons learned log with thematic analysis

**Reports CQC Expects:**
- Provider Information Return (PIR) data – auto-populated from system
- Safeguarding notification reports
- DoLS notification reports
- Incident/accident summaries with trends
- Staff training compliance reports
- Medication error reports
- Missed visit reports with corrective actions
- Complaints analysis with resolution tracking
- KPIs: missed visits, late visits, medication errors, staff turnover, vacancy rates

---

## 2. Ofsted Compliance

**Applies to:** Children's residential homes (including secure homes, residential special schools)  
**Legislation:** Children's Homes (England) Regulations 2015, Children Act 1989  
**Regulator:** Ofsted (Office for Standards in Education, Children's Services and Skills)  
**Inspection Framework:** Social Care Common Inspection Framework (SCCIF)

### 2.1 Children's Homes Regulations 2015 Overview

The Children's Homes (England) Regulations 2015 (SI 2015/541) provide the legal framework for operating children's homes in England. Key regulatory areas:

| Part | Coverage |
|---|---|
| Part 2 (Regs 5-14) | **Quality Standards** – 9 quality standards homes must meet |
| Part 3 (Regs 26-29) | **Registered Persons** – requirements for registered providers/managers |
| Part 4 (Regs 30-33) | **Staffing** – fitness, qualifications, employment requirements |
| Part 5 (Regs 34-42) | **Policies, Records, Complaints & Notifications** |
| Part 6 (Regs 43-46) | **Monitoring & Reviewing** – Reg 44/45/46 |

**Key Personnel:**
- **Registered Provider** – the organisation or individual registered to carry on the children's home
- **Registered Manager** – must hold or be working towards Level 5 Diploma in Leadership and Management for Residential Childcare (within 3 years)
- **Staff** – must hold or be working towards Level 3 Diploma for Residential Childcare (within 2 years)

### 2.2 The 9 Quality Standards

The Children's Homes Regulations prescribe **9 Quality Standards** that children's homes must meet. Ofsted inspects against these.

#### Standard 1: Quality and Purpose of Care (Regulation 6)
Children receive care from staff who understand the home's aims and use this understanding to deliver care that meets children's needs.

**Software must support:**
- Statement of Purpose – creation, review, and version tracking
- Personalised care plans recording each child's needs, background, and relevant plans
- Day-to-day arrangements and decision records
- Tracking of care against the home's stated aims
- Transition planning records (return home, new placement, independent living)

#### Standard 2: Children's Views, Wishes and Feelings (Regulation 7)
Children are listened to, helped to express their views, and have their views taken into account.

**Software must support:**
- Records of children's expressed wishes and feelings
- Key worker session notes
- Children's meeting minutes/records
- Complaints and representations by children
- Advocacy service access records
- Evidence of children's participation in decisions

#### Standard 3: Education Standard (Regulation 8)
Every child receives education that meets their needs and promotes their potential.

**Software must support:**
- Personal Education Plan (PEP) tracking
- School attendance monitoring
- Educational progress records
- Communication logs with schools (designated teachers)
- Alternative provision records
- School exclusion tracking

#### Standard 4: Enjoyment and Achievement (Regulation 9)
Children take part in fun, fulfilling activities that help them grow in confidence.

**Software must support:**
- Activity logs and participation records
- Achievement tracking and celebration records
- Hobbies and interest tracking
- Community engagement records

#### Standard 5: Health and Well-being (Regulation 10)
Children have access to physical, emotional, and mental healthcare.

**Software must support:**
- Health assessment tracking (initial and review)
- Medical appointment records (GP, dentist, optician, CAMHS, etc.)
- Medication management records
- Therapeutic intervention records
- Emotional wellbeing monitoring
- Health care plan documents
- Immunisation and allergy records
- SDQ (Strengths and Difficulties Questionnaire) tracking

#### Standard 6: Positive Relationships (Regulation 11)
Children build healthy relationships with adults and peers.

**Software must support:**
- Contact/family time records
- Relationship mapping
- Peer interaction monitoring
- Behaviour support plans (PBS)
- Key worker relationship records
- Social worker visit records

#### Standard 7: Protection of Children (Regulation 12)
Children are safeguarded from harm and helped to manage risk.

**Software must support:**
- Safeguarding incident records and referrals
- Risk assessments (individual and environmental)
- Missing from care reports (with return home interview tracking)
- Restraint/physical intervention records (with debriefs)
- Sanctions records
- Bullying incident records
- CSE/CCE risk assessments
- Radicalisation/Prevent concerns
- Body maps
- Chronologies
- Location assessments

#### Standard 8: Leadership and Management (Regulation 13)
Competent, committed leaders who support staff and improve the service.

**Software must support:**
- Staff supervision records
- Staff appraisal records
- Training records and matrix with qualification tracking (Level 3/Level 5)
- Staff meeting minutes
- Quality assurance audit records
- Reg 44 and Reg 45 report management
- Statement of Purpose version control
- Action plan tracking from inspections/audits

#### Standard 9: Care Planning (Regulation 14)
Every child has a thoughtful, well-executed plan for their future.

**Software must support:**
- Placement plans (linked to care plans from placing authority)
- Care plan tracking and review
- Pathway plans (for 16+)
- Transition planning records
- LAC review preparation and tracking
- Risk assessment reviews linked to care plans

### 2.3 Regulation 44: Monthly Monitoring Visits

**Requirement:** The registered provider must arrange for an **independent person** (not involved in day-to-day operation) to visit the home **at least once per calendar month**.

**Purpose:**
- Quality assurance of the home's care
- Independent oversight and scrutiny
- Identifying strengths and areas for improvement
- Monitoring compliance with regulations and quality standards

**What Reg 44 Visitors Must Check:**
1. **Daily log** – review of events since last visit
2. **Complaints record** – frequency, type, adequate resolution
3. **Sanctions record** – appropriateness and proportionality
4. **Restraint record** – necessity, appropriateness, debriefs
5. **Physical condition of the home** – decoration, cleanliness, safety
6. **Private interviews** with children (where possible), parents, and staff
7. **Case files** (with consent) – checking up-to-date documentation
8. **Missing from care records** – patterns and response
9. **Safeguarding records** – referrals, notifications
10. **Notifiable events log** – events reported to Ofsted

**Report Requirements:**
- Written report produced after each visit
- Shared with Registered Manager for accuracy check
- Copy sent to Ofsted within the following month
- Copy retained at the home for staff and inspector access
- **Failure to submit reports noted as inspection line of enquiry and may impact Leadership & Management judgement**

**Software must support:**
- Reg 44 visit scheduling and tracking
- Structured report templates covering all required areas
- Report distribution workflow (Manager → Responsible Individual → Ofsted)
- Action tracking from Reg 44 recommendations
- Historical archive of all Reg 44 reports
- Automatic alerts for overdue visits

### 2.4 Regulation 45: Six-Monthly Quality Review

**Requirement:** The registered person must complete a **review of the quality of care** provided at least once every **6 months**, then produce a written report sent to Ofsted.

**What Reg 45 Reviews Should Contain (per Ofsted guidance):**
- Focus on quality of care and children's experiences/outcomes
- Views of children in care, parents, placing authorities, and staff
- Identification of areas of strength and weakness
- Action plan for improvement
- Effect of care on outcomes and improvements for children
- Honest, objective, and analytical assessment

**Reg 45 Checklist Areas (reviewed every 6 months):**

| Area | What to Review |
|---|---|
| **Caring for children** | Involvement in decisions, day-to-day running |
| **Education** | Educational attainment, school relationships |
| **Encouraging positive behaviour** | Criminal charges, restraint frequency, behaviour support effectiveness |
| **Health** | Illnesses, A&E attendance, GP/health access, therapeutic services |
| **Health & Safety** | Fire drills, risk assessments |
| **Missing children** | Response measures, prevention measures |
| **Staffing matters** | Grievances, disciplinary actions, reasons for leaving |
| **Working with local services** | Police involvement, consultation with placing authorities/local services |

**Additionally reviewed annually:**
- Statement of Purpose review and updates
- Location assessment review

**Key Distinction (per Ofsted blog):**
> "The review and the report should be used as a tool for continuous improvement in your home, making things better for children."

Reports should be:
- Short and sharp – focused on the right issues
- Include children's views
- Include an action plan
- Be honest, objective and analytical
- **NOT** just report on methods used to gather information

**Software must support:**
- Reg 45 review scheduling (configurable 6-month cycles)
- Structured report templates covering all checklist areas
- Data aggregation from daily records for the review period
- Action plan creation and tracking
- Automatic submission tracking to Ofsted
- Historical archive for trend analysis across review periods

### 2.5 Regulation 36: Children's Case Records (Schedule 3)

**Requirement:** Maintain case records for each child that include all Schedule 3 information, kept up to date, signed and dated by author.

**Retention:**
- If child dies before 18: **15 years** from date of death
- Otherwise: **75 years** from child's date of birth
- Kept securely in the home while child is accommodated
- Kept in a secure place after child leaves

**Schedule 3 – Information Required in Each Child's Case Record:**

**Personal Details:**
1. Name (and any previous names, excluding pre-adoption names)
2. Date of birth and sex
3. Religion
4. Ethnicity, cultural and linguistic background
5. Address immediately before entering the home
6. Address on leaving the home
7. Money/valuables deposits and withdrawals
8. Statutory provision under which accommodated

**Contact Details:**
9. Placing authority (name, address, phone, contact individual)
10. Parents (name, address, phone, religion)
11. Assigned social worker (name, address, phone)
12. School/college (name, address, phone, designated teacher)
13. Employer details (if applicable)

**Care, Protection & Safety:**
14. Missing from care incidents (dates, circumstances, whereabouts)
15. Control, discipline or restraint measures (dates, circumstances)
16. Contact arrangements and restrictions

**Plans & Reports:**
17. EHC plan or SEN statement
18. School reports received while accommodated
19. Care plan and placement plan from placing authority
20. Reviews of care plan or placement plan (dates, results)

**Health Matters:**
21. GP details, dental practitioner details
22. Accidents or serious illness while accommodated
23. Immunisation, allergy, medical examination details
24. Health examinations/developmental tests at school
25. Medicines details (self-administration permissions, administration records, disposal)
26. Special dietary or health needs

### 2.6 Regulation 37: Other Records (Schedule 4)

**Requirement:** Maintain Schedule 4 records in the home, kept up to date, retained for **at least 15 years** from date of last entry.

**Schedule 4 – Other Records Required:**

**Register of Children:**
1. For each child:
   - (a) Date of admission
   - (b) Date ceased to be accommodated
   - (c) Address before admission
   - (d) Address on leaving
   - (e) Placing authority
   - (f) Statutory provision under which accommodated

**Staff Records:**
2. For each person working at the home:
   - (a) Full name
   - (b) Sex
   - (c) Date of birth
   - (d) Home address
   - (e) Relevant qualifications and experience
   - (f) Full-time/part-time status and average hours
   - (g) Whether they reside at the home

3. Staff duty roster (planned AND actual worked)

4. Record of any other persons residing or working at the home

5. **Visitor records** – all visitors, names, and reasons for visit

**Fire Safety:**
6. Every fire drill/alarm test with deficiency details and remedial steps

**Financial:**
7. All accounts kept in the children's home

### 2.7 Safeguarding Requirements

Children's homes have heightened safeguarding obligations beyond standard adult care:

**Regulation 12 – Protection of Children Standard:**

| Safeguarding Area | Requirements |
|---|---|
| **Safeguarding Policy** | Written policy, known to all staff, reviewed regularly |
| **Designated Safeguarding Lead** | Named person with training and authority |
| **DBS Checks** | Enhanced DBS with children's barred list for all staff |
| **Staff Training** | Safeguarding training at induction and regularly refreshed |
| **Missing from Care** | Protocol for when children go missing; return home interviews; pattern analysis |
| **Child Sexual Exploitation (CSE)** | Risk assessments, awareness training, referral protocols |
| **Child Criminal Exploitation (CCE)** | Risk assessments for county lines and gang involvement |
| **Radicalisation/Prevent** | Awareness of extremism risks, referral procedures |
| **Online Safety** | Monitoring and education about online risks |
| **Restraint/Physical Intervention** | Only as last resort, trained staff (e.g., MAPA), debrief after every incident, recorded and reviewed by management |
| **Sanctions** | Prohibited measures clearly defined (no corporal punishment, food deprivation, contact restriction, etc.) |
| **Bullying** | Anti-bullying procedures, monitoring, recording |
| **Complaints** | Children must know how to complain, given access to advocacy |
| **Whistleblowing** | Policy known to all staff |
| **Notifiable Events (Reg 40)** | Must notify Ofsted of: death of child, POCA referrals, serious illness/accident, infectious disease outbreak, CSE involvement, serious police incidents, serious complaints, child protection enquiry outcomes |
| **Body Maps** | Visual recording of injuries/marks with explanation |
| **Chronologies** | Maintained for each child showing key events over time |

**Unique to Children's Homes (not in adult CQC):**
- Local Authority Designated Officer (LADO) referrals for allegations against staff
- Section 47 enquiry cooperation
- Local Safeguarding Children Partnership (LSCP) engagement
- Working Together to Safeguard Children guidance compliance
- FGM mandatory reporting duty
- Closed cultures awareness and mitigation

### 2.8 LAC Documentation Requirements

**Looked After Children (LAC)** – now officially called "Children in Care" or "Children Looked After (CLA)" – require specific documentation:

**Core LAC Documents the Home Must Hold/Track:**

| Document | Description | Review Frequency |
|---|---|---|
| **Care Plan** | Overarching plan from placing authority setting out how child's needs will be met | Reviewed at every LAC review |
| **Placement Plan** | Specific plan for this placement – how the home will meet the child's needs | Within 5 working days of placement |
| **Personal Education Plan (PEP)** | Educational targets and support plan | Termly (at least every 6 months) |
| **Health Assessment** | Initial health assessment within 20 working days; reviews annually (under 5: every 6 months) | Annual or 6-monthly |
| **Pathway Plan** | For children 16+, planning for independence | Reviewed at every pathway plan review |
| **Risk Assessments** | Individual risk assessments for the child | Ongoing as circumstances change |
| **Contact Arrangements** | Agreed contact with family members | Per care plan |
| **LAC Review Minutes** | Independent Reviewing Officer (IRO) review records | First review within 20 working days, second within 3 months, then every 6 months |
| **SDQ (Strengths & Difficulties Questionnaire)** | Emotional/behavioural screening tool | Annually |
| **Life Story Work** | Helping children understand their history | Ongoing |
| **EHCP / SEN Statement** | Education, Health and Care Plan (if applicable) | Annual review |

**SSDA903 Return Data (collected by DfE):**
Local authorities must submit annual data on looked after children. Children's homes need to maintain data that supports this, including:
- Legal status
- Placement type and provider
- Category of need
- Reason for placement change
- Health assessments completion
- Dental checks completion
- SDQ scores
- Educational attainment
- Absence from school data
- Missing from care episodes

### 2.9 SCCIF Inspection Framework & Judgements

**Inspection Types:**

| Type | Frequency | Details |
|---|---|---|
| **Full Inspection** | At least annually | Up to 2 days on-site, graded judgements |
| **Assurance Inspection** | After "Requires Improvement" rating | Single judgement: serious concerns or not |
| **Monitoring Inspection** | After "Inadequate" or compliance issues | Progress monitoring |

**All inspections are unannounced.**

**Three Judgement Areas:**

#### 1. Overall Experiences and Progress of Children
Areas of required evidence:
- Quality of individualised care and support
- Impact on children's progress from individual starting points
- Quality of relationships (professionals, carers, children, parents)
- How well staff promote belonging and stability
- Progress in health, education, emotional/social/psychological wellbeing
- How children's views are understood and acted upon
- Quality of day-to-day experiences
- Preparation for futures and management of moves
- Meeting needs of children placed far from home
- Effectiveness of planning for moves into the home
- Access to specialist services

#### 2. How Well Children Are Helped and Protected
**This is a LIMITING judgement – if Inadequate, overall MUST be Inadequate.**

Areas of required evidence:
- How well risks are understood and responded to
- Actions in response to missing, exploitation, neglect, abuse, self-harm, bullying, radicalisation
- How staff manage situations and behaviour
- Whether boundaries contribute to wellbeing and security
- Whether safeguarding meets all statutory requirements

#### 3. Effectiveness of Leaders and Managers
Areas of required evidence:
- Ambitious vision and high expectations
- Understanding of children's experiences and progress
- Supportive environment for staff (supervision, appraisal, training)
- Knowledge of strengths and weaknesses
- Achievement of stated aims and objectives
- Quality of professional relationships
- Active challenge when other services are ineffective
- Promotion of tolerance, equality and diversity
- Impact of children's views and participation
- Contingency planning for staff vacancies/RM changes
- Oversight across multi-building homes

**Grading Scale:** Outstanding → Good → Requires Improvement → Inadequate

### 2.10 What Makes "Outstanding"

Based on SCCIF evaluation criteria, a children's home achieves Outstanding when, **in addition to meeting all Good criteria**, there is evidence of:

**Overall Experiences & Progress – Outstanding indicators:**
- Children make **exceptional** progress from their starting points
- Care is **highly individualised** and responsive to each child's changing needs
- Children develop **strong, trusting relationships** with staff and feel a genuine sense of belonging
- Children's views **actively shape** the running of the home
- Children are **exceptionally well prepared** for their next steps (whether returning home, new placement, or independence)
- **Innovative practice** that measurably improves outcomes
- Children's emotional, social and psychological wellbeing is **significantly enhanced**
- Outstanding educational progress and achievement support

**Protection – Outstanding indicators:**
- Children are **helped to develop their own strategies** for keeping safe
- Staff demonstrate **exceptional understanding** of each child's risks and vulnerabilities
- Risk management is **dynamic, proportionate and responsive** to changing circumstances
- Safeguarding practice is **exemplary and proactive**, not reactive
- Children feel genuinely safe and able to discuss concerns openly
- Missing episodes are rare and reducing over time; root causes are addressed

**Leadership & Management – Outstanding indicators:**
- Leaders demonstrate **exceptional ambition and vision** for every child
- Staff receive **outstanding support** through supervision, appraisal, and tailored training
- The home's practice is **informed by research and evidence**
- Leaders create a **culture of continuous learning** and reflective practice
- External relationships are **highly effective** – leaders robustly challenge other agencies when children's needs aren't met
- Quality assurance is **rigorous, systematic and leads to demonstrable improvement**
- Children's views **directly influence** service development
- Staff retention is high and team morale is strong
- The home consistently operates at a level that exceeds regulatory requirements

**Critical Limitations (things that PREVENT Outstanding):**
- Registered Manager without Level 5 qualification or equivalent → cannot be Outstanding for L&M
- Staff without required qualifications → cannot be Outstanding for L&M
- Any unmet regulation → requirement set, but doesn't automatically prevent Good
- Vacant RM post beyond 26 weeks → cannot be better than Requires Improvement for L&M

---

## 3. CQC vs Ofsted: Overlap & Differences

### Where They Align

| Area | CQC | Ofsted | Alignment |
|---|---|---|---|
| **Person-centred care** | Core to all 5 key questions | Core to all 9 quality standards | ✅ Full alignment |
| **Safeguarding** | Safe key question, safeguarding quality statement | Protection of Children standard (Reg 12) | ✅ Both require robust safeguarding; Ofsted has additional child-specific requirements |
| **Staff recruitment** | Fit and proper persons (Reg 19), DBS checks | Reg 31-32, DBS with children's barred list | ✅ Both require thorough recruitment checks |
| **Staff training** | Training matrix, competency records | Level 3/5 qualifications plus ongoing CPD | ✅ Both require evidence of training; Ofsted mandates specific qualifications |
| **Risk management** | Risk assessments, risk register | Individual child risk assessments | ✅ Both require dynamic risk management |
| **Complaints** | Complaints policy and log | Complaints, representations (Reg 39) | ✅ Both require accessible complaints process |
| **Records & governance** | Regulation 17, complete records | Regs 36-37, Schedules 3-4 | ✅ Both require accurate, contemporaneous records |
| **Quality monitoring** | Quality statements, audits, QIPs | Reg 44/45 monitoring, SCCIF | ✅ Both require ongoing quality monitoring |
| **Feedback** | Service user, staff, partner feedback | Children's views, parent, staff, placing authority views | ✅ Both require active feedback mechanisms |
| **Medicines management** | Medicines optimisation quality statement, eMAR | Reg 23, medication records per Schedule 3 | ✅ Both require safe medication management |
| **Notifications** | Safeguarding, DoLS, deaths, incidents | Reg 40 notifiable events to Ofsted | ✅ Both require prompt notification of serious events |

### Where They Diverge

| Area | CQC (Adult Care) | Ofsted (Children's Homes) |
|---|---|---|
| **Regulatory body** | CQC | Ofsted |
| **Primary legislation** | Health & Social Care Act 2008 | Care Standards Act 2000, Children Act 1989 |
| **Inspection frequency** | Varies (SAF allows continuous assessment, less predictable) | At least **twice annually** (one full, one assurance/monitoring) |
| **Inspection notice** | May or may not be announced | Always **unannounced** |
| **Assessment framework** | Single Assessment Framework (SAF) with quality statements | Social Care Common Inspection Framework (SCCIF) |
| **Quality standards** | 5 key questions with quality statements | 9 Quality Standards (Regulations 6-14) |
| **Independent monitoring** | Not required (though best practice) | **Mandatory** monthly Reg 44 visits by independent person |
| **Quality review** | PIR submissions, ongoing assessment | Mandatory **6-monthly Reg 45 review** with report to Ofsted |
| **Record retention** | Per data protection legislation | **75 years** from child's date of birth for case records |
| **Safeguarding focus** | Adult safeguarding, MCA, DoLS | **Child-specific**: CSE, CCE, missing children, LADO, Section 47, FGM |
| **Education** | Not directly assessed | **Core quality standard** (Reg 8) with PEP tracking |
| **Contact/family** | Person-centred, privacy | **Regulated** – contact arrangements in care plan, managed contact |
| **Care planning** | Care plans, risk assessments | **Placement plans** linked to placing authority care plans, IRO oversight |
| **Manager qualifications** | Registered Manager with CQC | **Level 5 Diploma** in Leadership and Management for Residential Childcare |
| **Staff qualifications** | No mandatory qualification level | **Level 3 Diploma** for Residential Childcare (within 2 years) |
| **Statement of Purpose** | Required at registration | **Ongoing requirement** – must be child-focused, reviewed annually, shared with inspectors |
| **Restraint recording** | Part of incident recording | **Detailed separate records** with debriefs, management review, patterns analysis |
| **Financial** | Business records | Must maintain all **accounts** in the home (Schedule 4) |
| **Visitor records** | Not specifically required | **All visitors** must be recorded with names and reasons (Schedule 4) |
| **Fire safety records** | Health & safety | Every fire drill/alarm test **must be individually recorded** with deficiency details (Schedule 4) |

### Key Implications for a Unified Platform

A platform serving both CQC and Ofsted-regulated services must:

1. **Maintain separate compliance engines** – different quality frameworks, different evidence requirements, different reporting formats
2. **Share common infrastructure** for: staff management, training matrix, recruitment checks, incident reporting, audit tools, document management
3. **Support child-specific workflows** not needed in adult care: PEP tracking, placement plan management, missing from care protocols, Reg 44/45 scheduling, contact management, IRO review tracking
4. **Handle vastly different retention periods** – CQC follows data protection norms; Ofsted requires 75-year retention for children's case records
5. **Adapt terminology** – "service user" (CQC) vs "child" or "young person" (Ofsted); "care plan" (CQC) vs "placement plan" + "care plan" (Ofsted)
6. **Support different inspection rhythms** – CQC continuous assessment vs Ofsted twice-yearly unannounced inspections

---

## 4. Software Feature Implications

### Shared Features (Both CQC & Ofsted)

| Feature | CQC Use | Ofsted Use |
|---|---|---|
| **Care Planning** | Person-centred care plans with reviews | Placement plans linked to LA care plans |
| **Risk Assessments** | Individual and environmental | Individual child risk assessments (dynamic) |
| **Incident Reporting** | Incidents, near misses, accidents | Safeguarding incidents, restraints, sanctions, missing episodes |
| **Staff Management** | Recruitment records, DBS tracking, training matrix | Recruitment, DBS (children's barred list), qualification tracking (Level 3/5) |
| **Medication Management** | eMAR, medication audits, PRN protocols | Medication records per Schedule 3 requirements |
| **Complaints Management** | Complaints log, resolution tracking, trend analysis | Complaints, representations, children's complaints with advocacy access |
| **Audit & Quality** | Internal audits, QIPs, governance records | Reg 44 reports, Reg 45 reviews, internal audits |
| **Document Management** | Policies, procedures, meeting minutes | Statement of Purpose, policies, plans |
| **Reporting/Analytics** | PIR data, CQC notifications, KPIs | Reg 44/45 reports, Ofsted notifications (Reg 40), SSDA903 data |
| **Communication** | Staff messaging, family portal | Staff messaging, social worker portal, family contact records |

### CQC-Specific Features

| Feature | Detail |
|---|---|
| **Visit Management** | Schedule, track, GPS-verify domiciliary care visits |
| **eMAR with PRN** | Full electronic medication administration with PRN protocols |
| **Missed/Late Visit Tracking** | Real-time alerts and corrective action workflows |
| **Travel Time Management** | Route optimisation, travel time recording |
| **Rostering** | Shift planning, continuity tracking, skill-mix management |
| **Invoicing/Finance** | Billing linked to visit data, reconciliation |
| **DoLS/MCA Records** | Deprivation of Liberty and Mental Capacity Act documentation |
| **IPC Audits** | Infection prevention and control specific audit templates |
| **SAF Evidence Mapping** | Map evidence to quality statements across all 5 key questions |
| **"I" and "We" Statement Templates** | Care plan templates incorporating CQC statement language |

### Ofsted-Specific Features

| Feature | Detail |
|---|---|
| **Reg 44 Visit Management** | Scheduling, structured report templates, distribution to Ofsted, action tracking |
| **Reg 45 Review Management** | 6-monthly review scheduling, data aggregation, report generation, Ofsted submission |
| **Children's Register** | Admissions register per Schedule 4 requirements |
| **Missing from Care Module** | Protocols, notifications, return home interview records, pattern analysis |
| **Restraint Recording** | Detailed incident recording with mandatory debrief records, management review |
| **Sanctions Log** | Recording of sanctions with prohibited measures safeguards |
| **Contact Management** | Family contact scheduling, recording, restrictions management |
| **PEP (Personal Education Plan)** | Educational target tracking, school communication, progress monitoring |
| **Health Tracking** | Health assessments, dental checks, CAMHS referrals, SDQ scores |
| **Placement Plan Management** | Creation aligned to LA care plan, review tracking |
| **Pathway Planning** | For 16+: independence skills tracking, accommodation planning |
| **LAC Review Preparation** | Auto-generate reports for IRO reviews, outcomes tracking |
| **Statement of Purpose** | Version-controlled document with annual review reminders |
| **Visitor Log** | All visitors recorded with names and reasons (Schedule 4 requirement) |
| **Fire Drill Records** | Individual drill/test records with deficiency tracking (Schedule 4) |
| **Children's Engagement** | Children's meeting records, wishes and feelings capture, participation tracking |
| **Key Worker Sessions** | Structured session recording with outcomes |
| **Life Story Work** | Digital tools supporting life story creation and storage |
| **Chronologies** | Auto-generated event chronologies for each child |
| **Body Maps** | Digital body map tool with annotation |
| **Notifiable Events (Reg 40)** | Structured forms for Ofsted notification: death, POCA, serious illness, CSE, etc. |
| **75-Year Retention** | Archive system supporting 75-year case record retention |
| **Location Assessment** | Annual location suitability review tool (with police/community input) |

---

## Key Sources

1. **CQC – The 5 key questions we ask**: https://www.cqc.org.uk/about-us/how-we-do-our-job/the-5-key-questions-we-ask
2. **CQC – Regulation 17: Good Governance**: https://www.cqc.org.uk/guidance-regulation/providers/regulations-service-providers-and-managers/health-social-care-act/regulation-17
3. **CareLineLive – CQC Single Assessment Framework Guide 2026**: https://carelinelive.com/cqc-single-assessment-framework-for-home-care-how-to-prepare-document-evidence-and-pass-your-assessment/
4. **CareLineLive – CQC Inspection Preparation Guide 2026**: https://carelinelive.com/cqc-inspection-preparation-guide/
5. **Delphi Care – CQC 5 Key Questions**: https://delphi.care/blog_articles/what-are-the-cqcs-5-key-questions/
6. **Children's Homes (England) Regulations 2015**: https://www.legislation.gov.uk/uksi/2015/541/contents
7. **Schedule 3 – Case Records**: https://www.legislation.gov.uk/uksi/2015/541/schedule/3
8. **Schedule 4 – Other Records**: https://www.legislation.gov.uk/uksi/2015/541/schedule/4
9. **DfE – Guide to the Children's Homes Regulations including Quality Standards (April 2015)**: https://assets.publishing.service.gov.uk/media/5a7f1b54ed915d74e33f45f0/Guide_to_Children_s_Home_Standards_inc_quality_standards_Version__1.17_FINAL.pdf
10. **Ofsted Blog – Regulation 45 Reviews (October 2024)**: https://socialcareinspection.blog.gov.uk/2024/10/11/regulation-45-reviews-and-reports-what-you-need-to-know/
11. **Ofsted – Social Care Common Inspection Framework (SCCIF)**: https://www.gov.uk/government/publications/social-care-common-inspection-framework-sccif-childrens-homes/social-care-common-inspection-framework-sccif-childrens-homes
12. **Wirral CS – Regulation 44 Visits Guidance**: https://wirralcs.trixonline.co.uk/chapter/childrens-homes-regulation-44-visits-guidance-and-procedures
13. **Derbyshire CH – Monitoring Quality (Reg 44/45)**: https://derbyshirech.trixonline.co.uk/chapter/monitoring-quality-regulation-44-and-45
14. **Welcare – 9 Quality Standards for Children's Homes**: https://welcare.org.uk/resources/what-are-the-9-quality-standards-for-childrens-homes/
15. **Quality Standards Online – Quality and Purpose of Care Standard**: https://qualitystandards.trixonline.co.uk/chapter/the-quality-and-purpose-of-care-standard
