# UK EMAR & Clinical Standards Research
## For Care Management Software Development

> **Research Date:** March 2026
> **Regulatory Framework:** CQC (Care Quality Commission), NICE, NHS England, MHRA, HSE
> **Key Guidelines:** NICE SC1 (Managing Medicines in Care Homes), NICE NG31, NICE NG142, CQC Fundamental Standards

---

## Table of Contents

1. [EMAR System Requirements](#1-emar-system-requirements)
2. [Clinical Monitoring Charts](#2-clinical-monitoring-charts)
3. [Care Plan Standards](#3-care-plan-standards)
4. [Incident and Safeguarding](#4-incident-and-safeguarding)

---

## 1. EMAR System Requirements

### 1.1 Core MAR Record Data Fields

Per NICE SC1, CQC guidance, and NHS ICB MAR good practice guidance, every medication administration record **must** capture:

#### Person Information
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Full name | String | Required, match to resident record | Legal name as on prescription |
| Date of birth | Date | Required, ISO format | Used for verification |
| NHS number | String(10) | Required, 10-digit with check digit | Unique patient identifier |
| Allergies & sensitivities | Text[] | Required (or explicit "NKDA") | Must be prominently displayed; red-flagged |
| GP name & practice | String | Required | Prescriber reference |
| Pharmacy supplier | String | Required | Dispensing pharmacy details |
| Photo (optional but recommended) | Image | Recommended | Aids identification |
| Room/unit number | String | Required | Location within the home |

#### Medication Details (per prescribed item)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Medication name | String | Required, match to dm+d dictionary | Generic name preferred; brand if clinically relevant |
| Formulation/form | Enum | Required | e.g., tablet, capsule, liquid, patch, injection, inhaler, cream, drops |
| Strength | String | Required | e.g., "500mg", "10mg/5ml" |
| Dose | String | Required | e.g., "1 tablet", "5ml", "2 puffs" |
| Route of administration | Enum | Required | Oral, topical, sublingual, rectal, subcutaneous, intramuscular, inhalation, transdermal, PEG/enteral, optic, otic, nasal, vaginal |
| Frequency/timing | String | Required | e.g., "8am, 2pm, 8pm", "twice daily", "once weekly" |
| Prescriber name | String | Required | Doctor who prescribed |
| Date prescribed | Date | Required | Start date of prescription |
| Review date | Date | Required | When medication should be reviewed |
| Special instructions | Text | Optional | e.g., "take with food", "dissolve in water", "30 mins before food" |
| Additional warnings | Text[] | Optional | e.g., "may cause drowsiness" |
| Start date | Date | Required | When to begin administration |
| End date | Date | Conditional | Required for short courses/antibiotics |
| Quantity received | Integer | Required | Stock count on receipt |

#### Administration Record (per dose event)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date of administration | Date | Required, auto-captured | System date |
| Scheduled time | Time | Required | Expected administration time |
| Actual time administered | Timestamp | Required | Exact time of administration |
| Administering staff member | String (user ID) | Required, authenticated | Staff who gave the medicine |
| Witness (if required) | String (user ID) | Conditional | Required for controlled drugs, insulin |
| Administration status | Enum | Required | See status codes below |
| Reason if not given | Enum + Text | Conditional | Required when status ≠ "Given" |
| Staff signature/authentication | Digital signature | Required | PIN, biometric, or e-signature |
| Notes/observations | Text | Optional | Any relevant observations post-administration |

#### Standard Administration Status Codes
| Code | Meaning | Action Required |
|------|---------|-----------------|
| G | Given | Record time |
| R | Refused | Document reason, inform prescriber if persistent |
| N | Not available (out of stock) | Order immediately, document |
| H | In hospital | Note admission details |
| L | On leave/absent | Note return date |
| D | Destroyed/disposed | Record disposal details |
| S | Self-administering | Confirm assessment in place |
| O | Omitted (clinical reason) | Document clinical reason, inform prescriber |
| W | Withheld | Document reason (e.g., low BP, low pulse) |
| C | Covert administration | Must have covert admin plan in place |
| X | Not required this cycle | e.g., alternate-day dosing |

### 1.2 PRN (As-Needed / "When Required") Medication Protocol

Per CQC guidance and NHS ICB PRN protocols, each PRN medication requires a **dedicated PRN protocol** containing:

#### PRN Protocol Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Medication name, form, strength | String | Required | As prescribed |
| Condition/indication | Text | Required | What the PRN is for (e.g., "pain", "anxiety", "constipation") |
| Signs/symptoms to monitor | Text | Required | Observable indicators that trigger PRN use |
| Dose range | String | Required | Min and max dose (e.g., "1-2 tablets") |
| Maximum dose in 24 hours | String | Required | Ceiling dose with time window |
| Minimum interval between doses | Duration | Required | e.g., "4 hours minimum" |
| Non-pharmacological interventions to try first | Text | Recommended | e.g., repositioning, reassurance, distraction |
| Route of administration | Enum | Required | As prescribed |
| Specific instructions | Text | Optional | e.g., "give with water", "apply to affected area only" |
| Expected effect/outcome | Text | Required | What staff should observe |
| Time to take effect | Duration | Required | e.g., "30 minutes for oral paracetamol" |
| When to seek further advice | Text | Required | Escalation criteria |
| Review date | Date | Required | PRN should be reviewed regularly |
| Person's preferences | Text | Recommended | How they prefer to take it, when they typically need it |

#### PRN Administration Record (additional fields beyond standard)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Reason for giving | Text | Required | Specific symptoms observed |
| Pain score/assessment pre-dose | Integer/Scale | Recommended | e.g., 0-10 or Abbey Pain Scale score |
| Time given | Timestamp | Required | Exact time |
| Effectiveness check time | Timestamp | Required | Usually 30-60 mins after |
| Outcome/effectiveness | Enum + Text | Required | Effective / Partially effective / Not effective |
| Pain score/assessment post-dose | Integer/Scale | Recommended | Same scale as pre-dose |
| Follow-up action if not effective | Text | Conditional | e.g., contacted GP |
| Administering staff | User ID | Required | Authenticated |

#### PRN Business Rules
- System must **prevent** administration before minimum interval has elapsed (with override + reason)
- System must **alert** when maximum 24-hour dose is approaching
- System must **require** effectiveness recording within configurable time window
- System must **flag** frequent PRN use for review (e.g., >3 doses in 24 hours triggers GP notification)
- PRN protocols must be reviewed at least **monthly** or after any change in condition

### 1.3 Controlled Drugs Register Requirements

Per CQC guidance (updated Jan 2025), Misuse of Drugs Act 1971, and Misuse of Drugs Regulations 2001:

#### Schedule Classification
| Schedule | Storage | Register Required | Examples |
|----------|---------|-------------------|----------|
| Schedule 2 | CD cupboard (mandatory) | Yes (mandatory) | Morphine, diamorphine, fentanyl, oxycodone, methadone, methylphenidate, ketamine, tapentadol |
| Schedule 3 | Some require CD cupboard (buprenorphine, temazepam) | Not legally required but recommended | Midazolam, pregabalin, gabapentin, tramadol, barbiturates |
| Schedule 4 | Secure storage | Not required | Zopiclone, benzodiazepines (diazepam, lorazepam, clonazepam) |
| Schedule 5 | Secure storage | Not required | Low-strength opioids (e.g., Oramorph 10mg/5ml), codeine linctus |

#### Controlled Drugs Register Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Person's name | String | Required | One page per person per drug per strength |
| Drug name | String | Required | At top of page |
| Form | String | Required | e.g., tablet, liquid, patch |
| Strength | String | Required | e.g., "10mg", "5mg/5ml" |
| Date of entry | Date | Required | Same day as transaction |
| Time | Time | Required | Time of transaction |
| Transaction type | Enum | Required | Receipt / Administration / Disposal / Transfer / Return |
| Quantity received | Decimal | Conditional | On receipt from pharmacy |
| Quantity administered | Decimal | Conditional | On administration |
| Running balance | Decimal | Required | Must be maintained after every transaction |
| Staff member 1 (administering/recording) | User ID | Required | Authenticated |
| Staff member 2 (witness) | User ID | Required (best practice) | Second trained person |
| Prescriber details | String | Required for receipt | Doctor who prescribed |
| Pharmacy details | String | Required for receipt | Dispensing pharmacy |
| Batch number | String | Recommended | For traceability |
| Expiry date | Date | Recommended | Alert when approaching |

#### For Transdermal Patches (e.g., fentanyl)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Application site | String/Body map | Required | Where patch was applied |
| Application date/time | Timestamp | Required | When applied |
| Removal date/time | Timestamp | Required | When removed |
| Rotation schedule | String | Required | Must rotate sites |
| Previous application sites | String[] | Required | To ensure rotation |
| Disposed by | User ID | Required | Who disposed of used patch |
| Disposal witnessed by | User ID | Required | Second person witness |

#### Electronic CD Register Legal Requirements
- Entries must be **attributable** to the person who created the record
- System must be **secure** with appropriate access controls
- Must have full **audit trail** including all corrections (no deletions)
- Must be **accessible from the care home** and printable
- Corrections must not overwrite — original entry must remain visible with correction dated and signed
- Running balance must be maintained and verified through **regular stock checks** (recommended weekly)
- Discrepancies must be investigated and reported to the Controlled Drugs Accountable Officer (CDAO)

#### Stock Check Workflow
1. Two staff members count physical stock
2. Compare against register running balance
3. Record stock check date, count, staff members
4. If discrepancy: investigate, document, report to CDAO
5. Frequency: at least weekly (best practice), and at every shift handover for high-volume services

### 1.4 Medication Error Reporting

#### Error Classification
| Category | Examples |
|----------|----------|
| Prescribing error | Wrong drug, wrong dose, drug interaction, allergy not checked |
| Dispensing error | Wrong medication dispensed, wrong label, wrong quantity |
| Administration error | Wrong person, wrong drug, wrong dose, wrong time, wrong route, omission |
| Monitoring error | Failed to monitor blood levels, failed to check blood pressure before antihypertensive |
| Storage error | Incorrect temperature, expired medication not removed |
| Documentation error | Failure to record, incorrect recording |

#### Medication Incident Record Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Incident ID | Auto-generated | Unique | System-generated reference |
| Date and time of incident | Timestamp | Required | When the error occurred |
| Date and time of discovery | Timestamp | Required | When error was found |
| Person affected | Resident ID | Required | Link to resident record |
| Medication involved | String | Required | Drug name, form, strength |
| Type of error | Enum | Required | See classification above |
| Description of incident | Text | Required | Free-text narrative |
| Severity/harm level | Enum | Required | No harm / Low harm / Moderate harm / Severe harm / Death |
| Immediate action taken | Text | Required | What was done immediately |
| Staff involved | User ID[] | Required | All staff involved |
| GP/prescriber notified | Boolean + Timestamp | Required | Whether and when |
| Family/NOK notified | Boolean + Timestamp | Conditional | If harm occurred (Duty of Candour) |
| Root cause analysis | Text | Required for moderate+ | Investigation findings |
| Lessons learned | Text | Required | Preventive measures |
| MHRA Yellow Card submitted | Boolean | Conditional | For adverse reactions |
| CQC notification submitted | Boolean | Conditional | For serious incidents |
| Safeguarding referral made | Boolean | Conditional | If abuse/neglect suspected |
| Follow-up actions | Text[] | Required | Corrective measures |
| Status | Enum | Required | Open / Under investigation / Closed |
| Review date | Date | Required | When to check corrective actions |

#### MHRA Yellow Card Reporting
- Report **all suspected adverse drug reactions** (ADRs) to established medicines
- Report **all reactions** (including minor ones) to newer medicines marked with Black Triangle ▼
- Report medication errors that result in patient harm
- Report defective medicines (wrong contents, contamination, poor packaging)
- Can be submitted online at yellowcard.mhra.gov.uk

### 1.5 Stock Management and Ordering

#### 28-Day Medication Cycle
UK care homes typically operate on a **28-day medication cycle** aligned with pharmacy supply:

| Phase | Timing | Activities |
|-------|--------|------------|
| Week 1-3 | Days 1-21 | Normal administration, monitoring stock levels |
| Week 3 | Day 14-21 | Generate re-order list, check with GP for changes |
| Week 4 | Day 21-25 | Submit prescriptions to GP, GP reviews and signs |
| Cycle end | Day 25-28 | Pharmacy dispenses, care home receives and checks |
| New cycle | Day 1 | Reconcile new stock, update MAR charts |

#### Stock Management Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Medication name, form, strength | String | Required | Linked to formulary |
| Current stock level | Integer | Required | Real-time count |
| Minimum stock threshold | Integer | Configurable | Alert when reached |
| Re-order quantity | Integer | Configurable | Standard order amount |
| Supplier pharmacy | String | Required | Dispensing pharmacy |
| Last received date | Date | Auto-captured | When last delivery arrived |
| Expiry date | Date | Required | Alert 30 days before |
| Storage requirements | Enum | Required | Room temp / Refrigerated (2-8°C) / CD cupboard |
| Batch number | String | Recommended | Traceability |
| Order status | Enum | Required | Not ordered / Ordered / Dispensed / Received / Checked |
| Ordered by | User ID | Required | Staff who placed order |
| Received by | User ID | Required | Staff who checked delivery |
| Receipt discrepancies | Text | Conditional | If delivery doesn't match order |

#### Stock Alerts
- **Low stock**: When quantity falls below minimum threshold
- **Out of stock**: Immediate alert to manager and pharmacy
- **Expiry approaching**: 30-day and 7-day warnings
- **Fridge temperature out of range**: If monitored digitally (2-8°C required)
- **Overstock**: Flag if quantity exceeds expected usage (waste concern)
- **Medication not ordered**: If approaching cycle end with no order placed

### 1.6 Medication Alerts and Interactions

#### Required Alert Types
| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| Allergy alert | Medication matches recorded allergy | Critical | Block administration, require override with clinical justification |
| Drug-drug interaction | Two prescribed medications interact | High/Medium | Warning with interaction details |
| Duplicate therapy | Same drug class prescribed twice | High | Warning to prescriber |
| Dose exceeds maximum | Prescribed dose above BNF limits | High | Block, require prescriber confirmation |
| Wrong time | Attempt to give outside scheduled window | Medium | Warning, allow override with reason |
| Too early | Dose given before minimum interval | High | Block for PRN; warn for regular |
| Missed dose | Scheduled time passed without recording | Medium | Alert to staff on duty |
| Medication change | New prescription or dose change | Info | Highlight change for awareness |
| Covert administration | Medication being given covertly | High | Require covert admin plan, mental capacity assessment, best interest decision |
| Swallowing difficulty (SALT) | Person flagged with dysphagia | High | Ensure formulation is appropriate (crush/liquid) |

#### Interaction Checking
- Integration with **BNF (British National Formulary)** or **dm+d (Dictionary of Medicines and Devices)** for drug interaction data
- Must flag **contraindications**, **cautions**, and **side effects**
- Should support **SNOMED CT** coding for clinical terms
- Should integrate with **NHS Spine** where applicable for shared records

### 1.7 NHS Data Security and Protection Toolkit (DSPT)

The DSPT is the mandatory annual self-assessment for any organisation processing NHS patient data. For care homes using EMAR, the software must support compliance with:

#### 10 Data Security Standards (National Data Guardian)
| Standard | Requirement | Software Implication |
|----------|-------------|---------------------|
| 1. Personal confidentiality | All staff understand their responsibilities | Role-based access, training records |
| 2. Staff responsibility | Staff understand how to handle data | Audit trails, access logs |
| 3. Required knowledge | All staff complete annual data security training | Training tracking module |
| 4. Access control | Only authorised access to data | RBAC, authentication, MFA |
| 5. Process reviews | Processes reviewed for effectiveness | Audit functionality, reports |
| 6. Response capability | Respond to incidents/near misses | Incident reporting module |
| 7. Continuity planning | Business continuity plan in place | Backup, offline mode, disaster recovery |
| 8. No unsupported systems | Keep systems patched and supported | Regular updates, security patches |
| 9. Monitoring | IT security incidents are monitored | Security event logging, alerting |
| 10. Accountable suppliers | Accountability with third parties | Data processing agreements, ISO 27001 |

#### Technical Requirements for DSPT Compliance
- **Encryption**: Data encrypted at rest (AES-256) and in transit (TLS 1.2+)
- **Access controls**: Role-based access control (RBAC) with principle of least privilege
- **Authentication**: Multi-factor authentication for remote access; strong passwords (min 12 chars or MFA)
- **Audit logging**: Immutable audit trail of all data access, modifications, and deletions
- **Data retention**: Medication records retained for minimum **8 years** (adult); **25 years** from DOB or 8 years after death (children)
- **Data backup**: Regular automated backups with tested restore procedures
- **Business continuity**: Offline mode capability; paper backup procedures
- **Data portability**: Ability to export data in standard formats (e.g., for transfer to another provider)
- **Right of access**: Support Subject Access Requests (SARs) within 30 days
- **Breach reporting**: Process to report breaches to ICO within 72 hours

### 1.8 What Makes a "Complete and Structured" EMAR System

Per CQC and Digitising Social Care Records (DSCR) standards, a fully assured EMAR system must include:

1. **Digital MAR chart** with all data fields above
2. **PRN protocol management** with effectiveness recording
3. **Controlled drugs register** (electronic, auditable)
4. **Allergy and interaction checking** integrated with clinical databases
5. **Stock management** with automated ordering workflows
6. **Medication error/incident reporting** linked to safeguarding
7. **Audit trails** — immutable, timestamped, attributable
8. **Reporting and analytics** — missed doses, error trends, PRN usage patterns
9. **Integration capability** — NHS Spine, GP Connect, pharmacy systems
10. **Offline capability** — must function during internet outages
11. **Alerts and reminders** — overdue medications, upcoming reviews, low stock
12. **Photo ID verification** — optional but recommended
13. **Covert administration recording** with linked MCA/best interest documentation
14. **Topical MAR (TMAR)** — separate chart for creams, ointments with body map
15. **Homely remedies** — recording of non-prescription items purchased by the home
16. **Handover reports** — automated generation of outstanding tasks between shifts

---

## 2. Clinical Monitoring Charts

### 2.1 Fluid Intake/Output Charts

#### Purpose
Monitor hydration status, particularly for residents at risk of dehydration, UTI, renal impairment, heart failure, or those on fluid-restricted diets.

#### Intake Record Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Resident ID | FK | Required | Link to resident |
| Date | Date | Required | Chart date |
| Time | Time | Required | Time of intake |
| Fluid type | Enum/String | Required | Water, tea, coffee, juice, soup, thickened fluid, IV, subcutaneous |
| Volume (ml) | Integer | Required | Estimated or measured |
| Consistency (if thickened) | Enum | Conditional | Per IDDSI framework: Thin (0), Slightly thick (1), Mildly thick (2), Moderately thick (3), Extremely thick (4) |
| Method of intake | Enum | Optional | Independent, assisted, PEG/NG tube |
| Staff member | User ID | Required | Who recorded |
| Running total (24hr) | Integer | Auto-calculated | Cumulative daily total |

#### Output Record Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Time | Time | Required | Time of output |
| Output type | Enum | Required | Urine, vomit, diarrhoea, wound drainage, other |
| Volume (ml) | Integer | Required (estimated if pads) | Measured or estimated |
| Characteristics | Text | Optional | e.g., colour, concentration, blood present |
| Continent/incontinent | Enum | Required | Self / Assisted / Incontinent |
| Pad weight (if applicable) | Integer | Optional | Weighed pad minus dry weight |
| Staff member | User ID | Required | Who recorded |
| Running total (24hr) | Integer | Auto-calculated | Cumulative daily total |

#### Thresholds and Alerts
| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Daily fluid intake | < 1000ml | Amber warning |
| Daily fluid intake | < 800ml | Red alert — escalate to nurse/GP |
| Daily fluid intake (recommended) | 1500-2000ml | Target range |
| Fluid balance (intake - output) | Negative for 2+ days | Clinical review required |
| No intake recorded | > 4 hours (daytime) | Prompt staff to check |
| Fluid restriction breach | Above prescribed limit | Alert to nurse |
| UTI symptoms + low intake | Combination trigger | GP referral recommended |

#### Frequency
- **At-risk residents**: Record every drink/output event
- **General monitoring**: Minimum 3 times daily (morning, afternoon, evening)
- **Review**: Fluid charts should be reviewed **daily** by senior staff and **weekly** by nurse/manager

### 2.2 Food/Nutrition Charts

#### MUST (Malnutrition Universal Screening Tool) Score

Per BAPEN guidelines, MUST screening is **mandatory on admission** and should be repeated:
- **Weekly** for the first month
- **Monthly** thereafter
- **Whenever clinical condition changes** (illness, surgery, reduced intake)

#### MUST Calculation Data Fields
| Step | Field | Type | Scoring | Notes |
|------|-------|------|---------|-------|
| 1 | BMI score | Calculated | >20 = 0, 18.5-20 = 1, <18.5 = 2 | From height and weight |
| 2 | Weight loss score | Calculated | <5% = 0, 5-10% = 1, >10% = 2 | Unplanned weight loss in 3-6 months |
| 3 | Acute disease effect | Enum | No = 0, Yes = 2 | If acutely ill AND no nutritional intake for >5 days |
| - | **Overall MUST score** | Sum | 0 = Low, 1 = Medium, ≥2 = High | Determines care plan |

#### MUST Risk Categories and Actions
| Risk | Score | Action |
|------|-------|--------|
| Low | 0 | Routine screening (monthly in care homes) |
| Medium | 1 | Observe — 3-day food diary, increase intake if possible, repeat in 1 month |
| High | 2+ | Treat — refer to dietitian, fortify food, consider supplements, monitor weekly |

#### Food Chart Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Resident ID | FK | Required | Link to resident |
| Date | Date | Required | Chart date |
| Meal type | Enum | Required | Breakfast, Mid-morning snack, Lunch, Afternoon tea, Dinner/Tea, Supper/Evening snack |
| Food offered | Text | Required | Description of what was offered |
| Portion consumed | Enum | Required | All / ¾ / ½ / ¼ / Refused / Nil by mouth |
| Fluid with meal (ml) | Integer | Optional | Cross-reference with fluid chart |
| Dietary requirement | Enum[] | Required (from care plan) | Standard, Vegetarian, Vegan, Halal, Kosher, Diabetic, Gluten-free, Pureed, Soft, Fork-mashable, IDDSI level |
| Texture modification | Enum | Conditional | Per IDDSI: Regular (7), Soft & Bite-Sized (6), Minced & Moist (5), Pureed (4), Liquidised (3) |
| Assistance required | Enum | Required | Independent, Verbal prompt, Physical assist, Full assist |
| Food supplements given | String | Optional | e.g., "Fortisip Compact Vanilla" |
| Staff member | User ID | Required | Who recorded |
| Notes | Text | Optional | e.g., "enjoyed meal", "appeared to have difficulty swallowing" |

#### Nutritional Alerts
| Trigger | Alert |
|---------|-------|
| <50% of meals consumed for 3+ consecutive days | Escalate to nurse/manager |
| MUST score ≥ 2 | Refer to dietitian, implement fortification plan |
| Weight loss >5% in 1 month or >10% in 6 months | Urgent dietitian referral |
| Dysphagia signs (coughing, choking during meals) | SALT referral |
| Refusing all meals for 24 hours | Medical review |

### 2.3 Vital Signs Monitoring

#### Data Fields per Observation
| Field | Type | Normal Range | Validation | Notes |
|-------|------|--------------|------------|-------|
| Date and time | Timestamp | — | Required | When observations taken |
| Temperature | Decimal (°C) | 36.1-37.2°C | 34.0-42.0 range | Oral, tympanic, or axillary (note method) |
| Blood pressure (systolic) | Integer (mmHg) | 90-140 | 60-250 range | Note position (lying/sitting/standing) |
| Blood pressure (diastolic) | Integer (mmHg) | 60-90 | 30-150 range | Postural hypotension check if indicated |
| Pulse rate | Integer (bpm) | 60-100 | 20-250 range | Note if regular/irregular |
| Pulse rhythm | Enum | Regular | Required | Regular / Irregular / Irregularly irregular |
| Respiratory rate | Integer (breaths/min) | 12-20 | 4-60 range | Counted over 60 seconds |
| Oxygen saturation (SpO2) | Integer (%) | 94-98% | 70-100 range | Note if on oxygen therapy |
| Oxygen therapy | Boolean + rate | — | Conditional | If on O2, record L/min and delivery method |
| Consciousness/AVPU | Enum | Alert | Required | Alert / Voice / Pain / Unresponsive |
| Blood glucose | Decimal (mmol/L) | 4.0-7.0 fasting | 1.0-30.0 range | For diabetic residents; pre/post meal noted |
| Pain score | Integer | 0 | 0-10 range | See pain assessment tools below |
| Staff member | User ID | Required | — | Who took observations |
| NEWS2 score | Auto-calculated | — | — | National Early Warning Score 2 |

#### NEWS2 (National Early Warning Score 2)
Used to detect clinical deterioration. Auto-calculated from vital signs:

| Parameter | 3 | 2 | 1 | 0 | 1 | 2 | 3 |
|-----------|---|---|---|---|---|---|---|
| Respiration rate | ≤8 | — | 9-11 | 12-20 | — | 21-24 | ≥25 |
| SpO2 Scale 1 | ≤91 | 92-93 | 94-95 | ≥96 | — | — | — |
| SpO2 Scale 2 (COPD) | ≤83 | 84-85 | 86-87 | 88-92 (≥93 on air) | 93-94 on O2 | 95-96 on O2 | ≥97 on O2 |
| Air or oxygen | — | Oxygen | — | Air | — | — | — |
| Systolic BP | ≤90 | 91-100 | 101-110 | 111-219 | — | — | ≥220 |
| Pulse | ≤40 | — | 41-50 | 51-90 | 91-110 | 111-130 | ≥131 |
| Consciousness | — | — | — | Alert | — | — | CVPU |
| Temperature | ≤35.0 | — | 35.1-36.0 | 36.1-38.0 | 38.1-39.0 | ≥39.1 | — |

#### NEWS2 Response Triggers
| Score | Risk | Response |
|-------|------|----------|
| 0 | Low | Routine monitoring (minimum 12-hourly) |
| 1-4 (total) | Low | Increase frequency to minimum 4-6 hourly |
| 3 (any single parameter) | Low-Medium | Urgent review by registered nurse |
| 5-6 (total) | Medium | Urgent review, consider escalation to GP/111 |
| ≥7 (total) | High | Emergency response — call 999/GP urgently, continuous monitoring |

#### Frequency of Vital Signs Monitoring
| Scenario | Frequency |
|----------|-----------|
| Stable, well resident | Monthly (or per care plan) |
| New admission | On admission, then daily for first 72 hours |
| Acute illness | Minimum 4-6 hourly |
| Post-fall | Immediately, then 4-hourly for 72 hours |
| Medication change (antihypertensives, etc.) | Daily for first week |
| End of life | As per individual plan; comfort-focused |
| NEWS2 triggers | As per escalation table above |

### 2.4 Weight Monitoring and BMI Tracking

#### Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date | Date | Required | Weigh date |
| Weight (kg) | Decimal | 20-300kg range | Use calibrated scales |
| Height (m) | Decimal | 0.5-2.5m range | Measured on admission; may use ulna length or knee height for immobile residents |
| BMI | Calculated | Auto: weight/(height²) | Auto-calculated |
| BMI category | Enum | Auto | Underweight (<18.5), Normal (18.5-24.9), Overweight (25-29.9), Obese I (30-34.9), Obese II (35-39.9), Obese III (≥40) |
| Weight change (%) | Calculated | Auto | vs last weighing and vs 3/6 month baseline |
| Clothing worn | Enum | Optional | Light, Day clothes, Heavy |
| Scales used | String | Optional | For calibration tracking |
| Unable to weigh | Boolean + reason | Conditional | e.g., immobile, refused, wheelchair-bound |
| Staff member | User ID | Required | Who weighed |
| MUST triggered | Boolean | Auto | If weight change triggers MUST re-assessment |

#### Frequency
| Scenario | Frequency |
|----------|-----------|
| All residents | Monthly (minimum) |
| MUST score ≥ 1 | Weekly |
| Active weight management plan | Weekly |
| End of life | As appropriate, may cease if distressing |
| Post-acute illness | Weekly until stable |

#### Weight Change Alerts
| Change | Timeframe | Alert |
|--------|-----------|-------|
| ≥5% loss | 1 month | Amber — review nutrition, MUST |
| ≥10% loss | 6 months | Red — urgent dietitian referral |
| ≥5% gain | 1 month | Review — check for fluid retention, medication effects |
| Any unexpected change | Any period | Document and investigate |

### 2.5 Wound Care Documentation and Body Maps

#### Wound Assessment Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Wound ID | Auto-generated | Unique per resident | Track across assessments |
| Date of assessment | Date | Required | When assessed |
| Wound type | Enum | Required | Pressure ulcer, Surgical, Traumatic, Leg ulcer, Diabetic ulcer, Skin tear, Moisture lesion, Burn, Other |
| Cause/origin | Text | Required | How wound occurred |
| Location | Body map position + text | Required | Interactive body map (front/back) with precise marking |
| Pressure ulcer category (if applicable) | Enum | Conditional | Category 1 (non-blanchable erythema), 2 (partial thickness), 3 (full thickness skin loss), 4 (full thickness tissue loss), Unstageable, Deep tissue injury |
| Length (cm) | Decimal | Required | Longest dimension |
| Width (cm) | Decimal | Required | Perpendicular to length |
| Depth (cm) | Decimal | Conditional | If measurable |
| Wound bed tissue type | Enum[] | Required | Epithelialising (pink), Granulating (red), Sloughy (yellow), Necrotic (black), Hypergranulation |
| Wound bed tissue % | Integer per type | Required | % of each tissue type, totalling 100% |
| Exudate amount | Enum | Required | None, Low, Moderate, Heavy |
| Exudate type | Enum | Conditional | Serous, Haemoserous, Purulent, Haemopurulent |
| Wound edges | Enum | Required | Flat/attached, Rolled/curled, Raised, Undermined |
| Surrounding skin | Enum[] | Required | Healthy, Dry, Macerated, Erythema, Excoriated, Oedematous, Fragile |
| Signs of infection | Boolean + details | Required | Increased pain, warmth, swelling, odour, delayed healing, pus |
| Pain at wound site | Integer (0-10) | Required | At rest and during dressing change |
| Wound photograph | Image | Recommended | With ruler for scale, consent obtained |
| Dressing applied | String | Required | Type and size of dressing used |
| Dressing change frequency | String | Required | e.g., "every 3 days", "daily" |
| Next review date | Date | Required | When next assessment is due |
| Assessor | User ID | Required | Qualified nurse for pressure ulcers |
| Treatment plan | Text | Required | Current treatment approach |
| Referrals made | String[] | Optional | e.g., Tissue Viability Nurse, GP |

#### Body Map Requirements
- **Interactive visual** — front and back human outline
- Must support **multiple wound marking** on a single body map
- Each mark should be **clickable** to link to wound record
- Support for **historical overlay** — show healed wounds in different colour
- Areas of concern beyond wounds: bruises, skin tears, rashes, birthmarks
- Must record **date of marking** and **who marked it**
- Consent for photography documented

#### Pressure Ulcer Risk Assessment (Waterlow Scale)
The Waterlow Scale is the most commonly used tool in UK care homes:

| Factor | Categories | Score Range |
|--------|------------|-------------|
| Build/weight for height | Average, Above average, Obese, Below average | 0-3 |
| Skin type/visual risk areas | Healthy, Tissue paper, Dry, Oedematous, Clammy, Discoloured, Broken/spot | 0-5 |
| Sex/Age | Male/Female, 14-49, 50-64, 65-74, 75-80, 81+ | 1-5 |
| Continence | Complete/catheterised, Occasionally incontinent, Catheter/incontinent of faeces, Doubly incontinent | 0-3 |
| Mobility | Fully, Restless/fidgety, Apathetic, Restricted, Inert/traction, Chair bound | 0-5 |
| Appetite/Malnutrition | Average, Poor, NG tube/fluids only, NBM/anorexic | 0-3 |
| Special risks — Tissue malnutrition | Terminal cachexia, Cardiac failure, Peripheral vascular disease, Anaemia, Smoking | 2-8 |
| Special risks — Neurological deficit | Diabetes, MS, CVA, Motor/sensory paraplegia | 4-6 |
| Special risks — Major surgery/trauma | Orthopaedic/spinal, On table >2 hours, On table >6 hours | 5-8 |
| Special risks — Medication | Steroids, Cytotoxics, High dose anti-inflammatories | 4 |

| Total Score | Risk Level |
|-------------|------------|
| 10-14 | At risk |
| 15-19 | High risk |
| 20+ | Very high risk |

#### Frequency of Waterlow Assessment
- On **admission**
- **Weekly** for at-risk residents
- On **change of condition** (e.g., reduced mobility, illness)
- After **any skin breakdown**

### 2.6 Bowel Movement Charts (Bristol Stool Scale)

#### Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date | Date | Required | Date of bowel movement |
| Time | Time | Required | Approximate time |
| Bristol Stool Type | Enum (1-7) | Required | See scale below |
| Amount | Enum | Required | Small / Medium / Large |
| Colour | Enum | Optional | Brown, Dark brown, Black (alert!), Red-tinged (alert!), Yellow, Green, Clay/pale (alert!) |
| Blood present | Boolean | Required | Triggers alert/review |
| Mucus present | Boolean | Optional | Flag for review |
| Pain/discomfort | Boolean | Optional | During bowel movement |
| Laxative given | Boolean + type | Optional | Link to medication record |
| Continent/incontinent | Enum | Required | Continent / Incontinent / With assistance |
| Staff member | User ID | Required | Who recorded |
| Notes | Text | Optional | Any additional observations |

#### Bristol Stool Scale
| Type | Description | Indication |
|------|-------------|------------|
| 1 | Separate hard lumps (like nuts) | Severe constipation |
| 2 | Sausage-shaped but lumpy | Mild constipation |
| 3 | Like a sausage but with cracks on surface | Normal |
| 4 | Like a sausage or snake, smooth and soft | Normal (ideal) |
| 5 | Soft blobs with clear-cut edges | Lacking fibre |
| 6 | Fluffy pieces with ragged edges, mushy | Mild diarrhoea |
| 7 | Watery, no solid pieces | Severe diarrhoea |

#### Bowel Chart Alerts
| Trigger | Alert |
|---------|-------|
| No bowel movement for 3 days | Amber — review fluid/fibre intake, consider PRN laxative |
| No bowel movement for 5+ days | Red — GP review, possible impaction |
| Type 6-7 for 2+ days | Review for infection (C.diff, norovirus), medication side effects |
| Blood in stool (any instance) | Urgent GP review |
| Black/tarry stool (any instance) | Urgent GP review — possible GI bleed |
| Persistent Type 1-2 despite laxatives | GP review for further investigation |

### 2.7 Sleep/Rest Monitoring

#### Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date | Date | Required | Night of monitoring |
| Check time | Time | Required | Time of each check |
| Sleep status | Enum | Required | Asleep / Awake / Restless / Drowsy / Up (e.g., to toilet) |
| Position | Enum | Optional | On back, Left side, Right side, Sitting up, Standing |
| Repositioned | Boolean | Conditional | Required if on repositioning schedule |
| Reposition position | Enum | Conditional | New position after turn |
| Night wandering | Boolean | Optional | Relevant for dementia care |
| Assistance provided | Text | Optional | e.g., "comforted", "drink offered", "toileted" |
| Bed rails status | Enum | Optional | Up / Down / Not applicable |
| Call bell accessible | Boolean | Optional | Check at each visit |
| Staff member | User ID | Required | Night staff who checked |
| Notes | Text | Optional | Any concerns |

#### Frequency
- **Minimum**: Every 2 hours during the night for residents with care needs
- **Pressure ulcer risk**: As per repositioning schedule (every 2-4 hours)
- **Dementia/wandering risk**: Hourly or more frequently as per risk assessment
- **End of life**: As per individual plan

### 2.8 Pain Assessment Tools

#### Self-Report Pain Scale (Verbal/Numerical)
For residents who can communicate:
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Assessment date/time | Timestamp | Required | When assessed |
| Pain score | Integer | 0-10 | 0 = no pain, 10 = worst pain imaginable |
| Pain location | Body map / Text | Required | Where the pain is |
| Pain type | Enum | Optional | Sharp, Dull, Aching, Burning, Shooting, Throbbing, Cramping |
| Duration | String | Optional | How long experienced |
| Aggravating factors | Text | Optional | What makes it worse |
| Relieving factors | Text | Optional | What makes it better |
| Impact on function | Enum | Optional | None, Mild, Moderate, Severe |
| Intervention | Text | Required | What was done (PRN given, repositioned, etc.) |
| Reassessment time | Timestamp | Required | When to check effectiveness |
| Post-intervention score | Integer | 0-10 | After intervention |
| Staff member | User ID | Required | Who assessed |

#### Abbey Pain Scale (for non-verbal/dementia residents)
| Indicator | Score | 0 = Absent | 1 = Mild | 2 = Moderate | 3 = Severe |
|-----------|-------|------------|----------|--------------|------------|
| Vocalisation | 0-3 | No change | Occasional whimper/groan | Calling out, moaning | Crying, screaming |
| Facial expression | 0-3 | No change | Occasional grimace | Frowning, frightened | Facial grimacing |
| Change in body language | 0-3 | No change | Minor guarding | Guarding, pulling away | Rigid, fists clenched |
| Behavioural change | 0-3 | No change | Increased confusion | Unable to be distracted | Increased agitation |
| Physiological change | 0-3 | No change | Minor changes | Changes in vitals | Significant changes |
| Physical change | 0-3 | No change | Minor changes | Moderate skin changes | Pressure areas, broken skin |

| Total Score | Pain Level | Action |
|-------------|------------|--------|
| 0-2 | No pain | Continue monitoring |
| 3-7 | Mild | Non-pharmacological intervention, consider PRN |
| 8-13 | Moderate | Administer analgesia, inform GP if persistent |
| 14+ | Severe | Urgent GP review, administer prescribed analgesia |

#### PAINAD (Pain Assessment in Advanced Dementia) — alternative tool
| Item | 0 | 1 | 2 |
|------|---|---|---|
| Breathing | Normal | Occasional laboured | Noisy, long periods of hyperventilation, Cheyne-Stokes |
| Negative vocalisation | None | Occasional moan/groan | Repeated calling out, loud moaning |
| Facial expression | Smiling or inexpressive | Sad, frightened, frown | Facial grimacing |
| Body language | Relaxed | Tense, distressed pacing | Rigid, fists clenched, knees pulled up, striking out |
| Consolability | No need to console | Distracted or reassured by voice/touch | Unable to console, distract, reassure |

---

## 3. Care Plan Standards

### 3.1 Person-Centred Care Plan Requirements

Per CQC Regulation 9 (Person-Centred Care) and Regulation 17 (Good Governance):

#### Core Care Plan Structure
| Section | Required Content | Review Frequency |
|---------|-----------------|------------------|
| Personal details & preferences | Name, preferred name, DOB, religion, culture, language, communication needs | Annually or on change |
| Life history / "About Me" | Background, interests, relationships, what matters to them | On admission, update as shared |
| Health conditions | All diagnosed conditions with management plans | Monthly or on change |
| Medication management | Link to EMAR, allergies, pharmacy details, self-admin assessment | Monthly with medication review |
| Mobility & falls risk | Current mobility level, equipment used, falls risk score | Monthly or after any fall |
| Nutrition & hydration | MUST score, dietary needs, IDDSI level, preferences | Monthly with MUST |
| Continence | Pattern, aids used, dignity considerations | Monthly or on change |
| Personal care & hygiene | Preferences for bathing, dressing, grooming, oral care | Monthly |
| Skin integrity | Waterlow score, existing wounds, prevention plan | Weekly if at risk |
| Sleep & rest | Patterns, preferences, night-time needs | Monthly |
| Communication | Sensory impairments, communication aids, preferred language | Monthly |
| Social & emotional wellbeing | Relationships, activities, spiritual needs, mood assessment | Monthly |
| Mental health & cognition | Diagnosis, capacity assessments, mood monitoring | Monthly |
| End of life wishes | DNACPR status, advance decisions, preferred place of death | On admission, review 6-monthly |
| Activities & occupation | Preferred activities, meaningful engagement | Monthly |
| Environment | Room preferences, furniture, personal possessions | On admission |
| Risk assessments | All active risk assessments with review dates | Per risk schedule |

#### Care Plan Data Fields (per section/need)
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Need/area identified | String | Required | What the care need is |
| Assessment findings | Text | Required | Current status and assessment |
| Desired outcome/goal | Text | Required | What we're aiming for (person's own words where possible) |
| Interventions/actions | Text[] | Required | Specific care actions to deliver |
| Staff responsibilities | String[] | Required | Who does what |
| Equipment needed | String[] | Optional | Any aids or equipment |
| Risk assessment link | FK | Conditional | Link to relevant risk assessment |
| Person's preferences | Text | Required | How they want care delivered |
| Consent/capacity | Enum + notes | Required | Has capacity / Lacks capacity (MCA assessment) / Fluctuating |
| Family/representative involvement | Text | Optional | Who is involved in planning |
| Start date | Date | Required | When plan starts |
| Review date | Date | Required | When next review is due |
| Review outcome | Enum | Required at review | No change / Updated / Discontinued |
| Last reviewed by | User ID | Required | Who reviewed |
| Resident/representative agreement | Boolean + signature | Required | Evidence of involvement |

### 3.2 Risk Assessment Frameworks

#### Standard Risk Assessments Required
| Assessment | Tool/Framework | Frequency | Trigger for Re-assessment |
|-----------|----------------|-----------|---------------------------|
| Falls risk | FRASE (Falls Risk Assessment Scale for the Elderly) or equivalent | Monthly, after any fall | Fall, change in mobility, new medication |
| Pressure ulcer risk | Waterlow Scale | On admission, weekly if at risk | Change in mobility, continence, nutrition |
| Nutritional risk | MUST (Malnutrition Universal Screening Tool) | Monthly | Weight change, illness, reduced intake |
| Moving & handling | Individual assessment | On admission, 6-monthly | Change in mobility, after fall |
| Choking/dysphagia | SALT assessment | On admission if indicated | Coughing during meals, chest infections |
| Self-neglect | Individual assessment | As needed | Concerns identified |
| Behaviour that challenges | Functional behaviour assessment | As needed (LD services) | New behaviours, increased frequency |
| Fire risk (personal) | PEEP (Personal Emergency Evacuation Plan) | Annually, on change | Mobility change |
| Mental health risk | Individual assessment | As appropriate | Mood changes, self-harm concern |
| Environmental risk | Room/home assessment | Annually | Incidents, new equipment |
| Medication risk | Self-administration assessment | On admission, after incidents | Cognitive decline, errors |
| Skin integrity risk | Body map + Waterlow | On admission, weekly if at risk | New marks, pressure areas |
| Pain risk | Pain assessment tool | Monthly or as needed | Reports of pain, behaviour change |

#### Risk Assessment Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Assessment type | Enum | Required | From list above |
| Assessment date | Date | Required | When completed |
| Assessment tool used | String | Required | Specific tool/scale |
| Score/result | Variable | Required | Depends on tool |
| Risk level | Enum | Required | Low / Medium / High / Very High |
| Identified hazards | Text[] | Required | Specific risks found |
| Current control measures | Text[] | Required | What's already in place |
| Additional actions needed | Text[] | Conditional | New measures to implement |
| Person's views | Text | Required | Their perspective on the risk |
| Assessor | User ID | Required | Qualified person who assessed |
| Review date | Date | Required | Next review due |
| Linked to care plan | FK | Required | Must update corresponding care plan section |

### 3.3 Mental Capacity Assessments

Per the Mental Capacity Act 2005, five statutory principles:
1. A person must be assumed to have capacity unless established otherwise
2. All practical steps must be taken to help them make their own decision
3. An unwise decision does not mean they lack capacity
4. Any act done under the MCA must be in the person's best interests
5. Before the act, consider less restrictive options

#### Mental Capacity Assessment Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Assessment ID | Auto-generated | Unique | Reference number |
| Person assessed | Resident ID | Required | Link to resident |
| Decision being assessed | Text | Required | Specific decision (capacity is decision-specific) |
| Date of assessment | Date | Required | When assessed |
| Assessor | User ID | Required | Decision-maker (may be nurse, doctor, or social worker) |
| Reason for assessment | Text | Required | Why capacity is being questioned |
| Diagnostic test | Text | Required | Is there an impairment of, or disturbance in functioning of, the mind or brain? |
| Diagnostic test result | Boolean + evidence | Required | Yes/No with supporting evidence |
| Functional test — Understand | Text + Boolean | Required | Can they understand relevant information? |
| Functional test — Retain | Text + Boolean | Required | Can they retain the information long enough to make the decision? |
| Functional test — Use/Weigh | Text + Boolean | Required | Can they use or weigh the information? |
| Functional test — Communicate | Text + Boolean | Required | Can they communicate their decision? |
| Capacity outcome | Enum | Required | Has capacity / Lacks capacity (for this specific decision) |
| Steps taken to support decision-making | Text[] | Required | What was done to help (timing, environment, communication aids, support person) |
| Best Interest Decision (if lacks capacity) | Text | Conditional | Required if found to lack capacity |
| Persons consulted for Best Interest | Text[] | Conditional | Family, IMCA, carers, others |
| Less restrictive options considered | Text[] | Conditional | What alternatives were explored |
| Review date | Date | Required | When to re-assess |
| Person's views/wishes/feelings | Text | Required | Even if lacking capacity, record their expressed wishes |
| Lasting Power of Attorney | Boolean + details | Required | Whether LPA for Health & Welfare exists |
| Advance Decision | Boolean + details | Required | Whether ADRT exists |

### 3.4 Positive Behaviour Support (PBS) Plans

For services supporting people with learning disabilities and/or autism:

#### PBS Plan Data Fields
| Section | Content | Notes |
|---------|---------|-------|
| Personal profile | Communication style, sensory preferences, likes/dislikes, triggers, calming strategies | Person-centred, strength-based |
| Functional assessment | What is the behaviour, when does it occur, what function does it serve | ABC (Antecedent-Behaviour-Consequence) analysis |
| Primary prevention | Environmental adjustments, routine structure, skill building, quality of life improvements | Most important — proactive strategies |
| Secondary prevention | Early warning signs, de-escalation strategies, active listening, redirection | When behaviour is escalating |
| Reactive strategies | Safe responses if behaviour occurs, approved physical interventions (absolute last resort) | Must be proportionate, dignified |
| Post-incident support | Debrief for person and staff, review triggers, update plan | Learn and improve |
| Restrictive practices register | Any restrictions in place with justification, MCA link, review schedule | Must be documented and reviewed |
| Communication passport | How the person communicates needs, pain, distress | Essential for non-verbal individuals |

#### PBS Recording Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date and time | Timestamp | Required | When incident/behaviour occurred |
| Duration | Duration | Required | How long it lasted |
| Setting/environment | Text | Required | Where it happened |
| Antecedent | Text | Required | What happened before |
| Behaviour observed | Text | Required | Factual, non-judgemental description |
| Consequence/response | Text | Required | What staff did |
| Physical intervention used | Boolean + details | Required | If any restrictive intervention, full documentation required |
| Outcome | Text | Required | How the situation resolved |
| Injuries (person or staff) | Text | Conditional | Any injuries; link to incident form |
| Debrief completed | Boolean + details | Required | Post-incident debrief |
| Staff involved | User ID[] | Required | All staff present |
| Review of PBS plan needed | Boolean | Required | Whether plan needs updating |

#### Restrictive Practice Categories
| Category | Examples | Requirements |
|----------|----------|-------------|
| Physical | Holding, guiding, blocking | Must have training (BILD-accredited), incident report, MCA assessment |
| Environmental | Locked doors, restricted areas, sensor mats | DoLS/LPS if amounts to deprivation of liberty |
| Chemical | PRN sedative medication | Prescriber review, MCA, best interest |
| Mechanical | Bed rails, lap belts, specialist seating | Risk assessment, consent/MCA, regular review |
| Technological | Door alarms, CCTV (if restricting) | Privacy impact assessment, proportionality |
| Social | Restricting contacts, activities | Clear justification, human rights consideration |

### 3.5 End-of-Life Care Planning

Per NICE NG31 (Care of Dying Adults) and NICE NG142 (End of Life Care: Service Delivery):

#### Advance Care Plan Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Resident ID | FK | Required | Link to resident |
| Advance care plan date | Date | Required | When first created |
| Preferred place of death | Enum + text | Required | Home (care home) / Hospital / Hospice / Other |
| DNACPR status | Boolean + form reference | Required | Linked to ReSPECT form or DNACPR form |
| DNACPR form location | String | Required if DNACPR | Physical location of original form |
| ReSPECT form completed | Boolean | Recommended | Recommended Emergency Care and Treatment Plan |
| Advance Decision to Refuse Treatment (ADRT) | Boolean + details | Required | Whether one exists, what treatments are refused |
| Lasting Power of Attorney (Health & Welfare) | Boolean + details | Required | Name, contact, registration number |
| Treatment escalation preferences | Text | Required | What interventions are/aren't wanted |
| Preferred priorities of care | Text | Required | What matters most to the person |
| Spiritual/religious needs | Text | Required | Religious observances, chaplain visits, last rites |
| Cultural requirements | Text | Required | Specific cultural practices around death |
| Key contacts to notify | Contact[] | Required | Who to call and when |
| Funeral wishes | Text | Optional | If discussed and documented |
| Personal belongings instructions | Text | Optional | What to do with possessions |
| Organ/tissue donation wishes | Boolean + details | Optional | If discussed |
| Anticipatory medications prescribed | Boolean + details | Conditional | PRN end-of-life medications (commonly: morphine, midazolam, glycopyrronium, levomepromazine) |
| Syringe driver in use | Boolean + details | Conditional | Continuous subcutaneous infusion |
| Last review date | Date | Required | When last reviewed |
| Discussed with | String[] | Required | Person (if capacity), family, GP, specialist |

#### Symptom Management in Last Days
| Symptom | Assessment | Interventions to Document |
|---------|-----------|--------------------------|
| Pain | Abbey Pain Scale / numerical | Analgesics, positioning, comfort measures |
| Breathlessness | Respiratory rate, SpO2, distress level | Fan, positioning, opioids, oxygen (if helpful) |
| Nausea/vomiting | Frequency, amount, triggers | Antiemetics, mouth care |
| Agitation/restlessness | Frequency, triggers, pattern | Environment, reassurance, anxiolytics |
| Respiratory secretions | Frequency, distress caused | Positioning, anticholinergics |
| Mouth/lip dryness | Condition of mouth | Mouth care, lip balm, oral gel |
| Skin integrity | Usual wound/skin assessment | Comfort-focused dressing changes |

### 3.6 Care Plan Review Cycles and Documentation

| Review Type | Frequency | Participants | Documentation |
|-------------|-----------|--------------|---------------|
| Daily care notes | Daily (each shift) | All care staff | Brief notes on care delivered, observations, concerns |
| Care plan review | Monthly (minimum) | Keyworker + resident + family (if appropriate) | Formal review of all care plan sections |
| Medication review | Monthly + annual full review | GP/pharmacist + nurse | Review all medications, effectiveness, side effects |
| Risk assessment review | Per schedule (see 3.2) | Trained assessor | Update scores, control measures |
| Mental capacity review | As needed / annually | Qualified assessor | Review specific decisions |
| Safeguarding review | After any incident | DSL + manager | Review safeguards in place |
| Multi-disciplinary review | As needed | GP, nurse, OT, physio, SALT, dietitian, social worker | Complex needs review |
| Annual comprehensive review | Annually | All disciplines + resident + family | Full care plan overhaul |
| Pre-admission assessment | Prior to admission | Manager/nurse | Initial assessment for suitability |
| 72-hour post-admission review | 72 hours post-admission | Nurse + keyworker | Adjust initial care plans based on observations |

#### Daily Care Notes Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Date | Date | Required | Note date |
| Shift | Enum | Required | Morning / Afternoon / Night |
| Staff member | User ID | Required | Author |
| Mood/wellbeing | Enum + text | Required | Happy, Content, Anxious, Low, Agitated, etc. + notes |
| Personal care | Text | Required | What was delivered, any concerns |
| Nutrition/fluids | Text | Required or link to charts | Summary or link to food/fluid chart |
| Mobility/activity | Text | Required | What activities, how mobile today |
| Social engagement | Text | Optional | Interactions, visitors |
| Health observations | Text | Conditional | Any changes, concerns, symptoms |
| Medication-related notes | Text | Conditional | Any medication concerns |
| Behaviour notes | Text | Conditional | Relevant behaviour observations |
| Communication with family | Text | Conditional | Any family contact |
| Handover points | Text[] | Required | What next shift needs to know |

---

## 4. Incident and Safeguarding

### 4.1 Incident Reporting Requirements

#### Incident Categories
| Category | Examples | CQC Notification Required |
|----------|----------|--------------------------|
| Falls | Falls from height, falls from bed, unwitnessed falls, trips | If results in serious injury (fracture, head injury) |
| Medication errors | Wrong drug, wrong dose, wrong person, omission, wrong route | If results in significant harm |
| Injuries | Unexplained injuries, bruises, skin tears | If unexplained — may be safeguarding |
| Challenging behaviour | Aggression, self-harm, destruction | If results in injury to self or others |
| Missing person | Absence without explanation | Yes — always |
| Choking | Any choking incident | If results in harm |
| Infection outbreak | 2+ residents with same infection | Yes — if significant |
| Equipment failure | Hoist failure, bed failure, alarm failure | If results in harm |
| Pressure ulcers | New or deteriorating pressure ulcers | Category 3 or 4 acquired in care |
| Environmental | Trip hazards, scalds, burns | If results in harm |
| Safeguarding | Abuse, neglect, exploitation | Yes — always |
| Death | Expected or unexpected death | Yes — all deaths |
| Allegation of abuse against staff | Any allegation | Yes — always |

#### Incident Report Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Incident ID | Auto-generated | Unique | System reference |
| Date of incident | Date | Required | When it happened |
| Time of incident | Time | Required | When it happened |
| Date/time of discovery | Timestamp | Required if different | If discovered later |
| Date/time reported | Timestamp | Auto | When report created |
| Location | String | Required | Where it happened (room, corridor, garden, etc.) |
| Person(s) affected | Resident ID[] | Required | One or more residents |
| Incident category | Enum | Required | From categories above |
| Severity | Enum | Required | Near miss / No harm / Low harm / Moderate harm / Severe harm / Death |
| Description | Text | Required | Factual account of what happened |
| Witness(es) | User ID[] / Text | Optional | Staff or visitors who witnessed |
| Staff on duty | User ID[] | Required | All staff on shift |
| Immediate actions taken | Text | Required | First aid, called 999, repositioned, etc. |
| Injuries sustained | Text | Conditional | Description of injuries, body map link |
| Medical attention sought | Enum + details | Required | None / GP / Paramedic / A&E / Hospital admission |
| Vital signs recorded | Boolean + link | Required for clinical incidents | Link to observations |
| Family/NOK notified | Boolean + timestamp | Required | When and who was informed |
| GP notified | Boolean + timestamp | Conditional | If medical issue |
| Manager notified | Boolean + timestamp | Required | When manager was informed |
| CQC notification required | Boolean | Required | Assessment against notification criteria |
| CQC notification submitted | Boolean + ref | Conditional | Reference number if submitted |
| Safeguarding referral required | Boolean | Required | Assessment against thresholds |
| Safeguarding referral made | Boolean + ref | Conditional | Reference if submitted |
| Root cause / contributing factors | Text | Required | Investigation findings |
| Risk assessment reviewed | Boolean | Required | Was the relevant risk assessment updated? |
| Care plan updated | Boolean | Required | Was the care plan updated? |
| Preventive actions | Text[] | Required | What will prevent recurrence |
| Investigation status | Enum | Required | Pending / In progress / Completed |
| Investigated by | User ID | Required | Manager/nurse who investigated |
| Investigation completion date | Date | Required | When investigation concluded |
| Lessons learned | Text | Required | What was learned |
| Shared with team | Boolean + date | Required | When shared with staff team |
| Follow-up actions | Action[] | Required | With assignee and due date |
| Status | Enum | Required | Open / Under investigation / Closed |

#### Falls-Specific Additional Fields
| Field | Type | Notes |
|-------|------|-------|
| Fall type | Enum | Witnessed / Unwitnessed / Assisted to ground |
| Activity at time of fall | Text | What were they doing |
| Footwear | Enum | Shoes / Slippers / Barefoot / Anti-slip socks |
| Walking aid in use | Boolean + type | Frame, stick, rollator, wheelchair |
| Environmental factors | Text[] | Wet floor, poor lighting, clutter, unfamiliar environment |
| Neurological observations | Boolean | GCS/AVPU recorded post-fall |
| Head injury protocol initiated | Boolean | For unwitnessed or head-involved falls |
| Post-fall monitoring frequency | String | e.g., "Neuro obs 15-min x4, 30-min x4, hourly x4" |
| Falls risk assessment score before | Integer | Previous score |
| Falls risk assessment score after | Integer | Updated score |
| Number of falls in last 30 days | Auto-calculated | Pattern detection |
| Medication review triggered | Boolean | Falls can indicate over-medication |

### 4.2 Safeguarding Referral Processes

#### Types of Abuse (Care Act 2014)
| Type | Indicators |
|------|------------|
| Physical | Unexplained injuries, bruises, burns, fractures, over-medication |
| Emotional/Psychological | Withdrawal, fear, anxiety, unexplained behaviour changes |
| Sexual | Bruising in genital area, STIs, inappropriate sexualised behaviour |
| Financial/Material | Unexplained loss of money, changes to will, missing possessions |
| Neglect/Acts of Omission | Malnutrition, poor hygiene, untreated medical conditions, missed medications |
| Discriminatory | Harassment, slurs, exclusion based on protected characteristics |
| Organisational | Poor culture, rigid routines, lack of person-centred care |
| Self-neglect | Refusing care, hoarding, poor self-care |
| Modern slavery | Forced labour, trafficking, domestic servitude |
| Domestic abuse | Controlling behaviour by partner/family member |

#### Safeguarding Referral Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Referral ID | Auto-generated | Unique | System reference |
| Person at risk | Resident ID | Required | Who is at risk |
| Date of concern | Date | Required | When concern arose |
| Type(s) of abuse suspected | Enum[] | Required | From categories above |
| Description of concern | Text | Required | Factual account |
| Source of concern | Text | Required | How it came to light |
| Alleged perpetrator (if known) | Text | Conditional | Who is alleged to have caused harm |
| Immediate safety actions | Text | Required | What was done to ensure immediate safety |
| Police involvement | Boolean + details | Conditional | If criminal activity suspected |
| Referred to Local Authority | Boolean + date + ref | Required | Safeguarding team referral |
| CQC notified | Boolean + date + ref | Required | Statutory notification |
| Designated Safeguarding Lead | User ID | Required | DSL managing the referral |
| Person's views/wishes | Text | Required | Making Safeguarding Personal approach |
| Capacity to make decisions about safeguarding | Enum | Required | Has capacity / Lacks capacity (for this decision) |
| Advocate/IMCA instructed | Boolean + details | Conditional | If lacks capacity and no appropriate person |
| Outcome | Text | Required when concluded | Findings and actions |
| Status | Enum | Required | Open / Under investigation / Concluded |

#### Safeguarding Workflow
1. **Identify** concern (any member of staff)
2. **Ensure immediate safety** of the person
3. **Record** factual account (do not investigate)
4. **Report** to Designated Safeguarding Lead (DSL) immediately
5. **DSL decides** — is this a safeguarding concern?
6. If yes: **refer** to Local Authority Safeguarding Team (within 24 hours)
7. **Notify CQC** (statutory notification)
8. **Cooperate** with Section 42 enquiry if initiated
9. **Preserve evidence** (do not wash clothes, do not disturb scene if abuse/crime)
10. **Support** the person throughout the process
11. **Record** outcome and lessons learned
12. **Update** care plan and risk assessments

### 4.3 DoLS (Deprivation of Liberty Safeguards) / LPS (Liberty Protection Safeguards)

> **Note**: LPS was legislated in the Mental Capacity (Amendment) Act 2019 to replace DoLS but implementation has been repeatedly delayed. As of March 2026, DoLS remains the operative framework. Software should support both.

#### DoLS Application Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Application ID | Auto-generated | Unique | Reference |
| Resident name | FK | Required | Link to resident |
| Managing authority | String | Required | Care home details |
| Supervisory body | String | Required | Local Authority |
| Date of application | Date | Required | When submitted |
| Reason for application | Text | Required | Why person may be deprived of liberty |
| Restrictions in place | Text[] | Required | What restrictions apply |
| Mental capacity assessment | FK | Required | Link to MCA assessment |
| Best interest assessment | FK | Required | Link to best interest decision |
| Person's representative | Contact | Required | RPR (Relevant Person's Representative) |
| IMCA instructed | Boolean + details | Conditional | If no appropriate representative |
| Authorisation status | Enum | Required | Applied / Granted / Refused / Expired / Renewed |
| Authorisation start date | Date | Conditional | If granted |
| Authorisation end date | Date | Conditional | Maximum 12 months |
| Conditions attached | Text[] | Conditional | Any conditions on the authorisation |
| Review date | Date | Required | When to review |
| Renewal application date | Date | Conditional | When to submit renewal |
| DOLS reference number | String | Conditional | Local Authority reference |

#### LPS (Liberty Protection Safeguards) — Planned Structure
| Element | Description |
|---------|-------------|
| Responsible body | NHS body or Local Authority (not care home) |
| Age | Applies from age 16 (vs 18 for DoLS) |
| Settings | Care homes, hospitals, domestic settings, community |
| Authorisation period | Up to 12 months initially, then up to 3 years on renewal |
| Necessary and proportionate assessment | Must be the least restrictive option |
| Approved Mental Capacity Professional (AMCP) | Reviews cases where person objects or in domestic settings |
| Pre-authorisation review | Independent review before authorisation |

### 4.4 Duty of Candour (CQC Regulation 20)

Applies when a "notifiable safety incident" occurs — i.e., any unintended or unexpected incident that could result in, or appears to have resulted in, death or serious harm.

#### Duty of Candour Data Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Incident ID | FK | Required | Link to incident report |
| Person affected | Resident ID | Required | Link to resident |
| Notifiable safety incident confirmed | Boolean | Required | Does this meet the threshold? |
| Notification timeline | Timestamp[] | Required | When each step was completed |
| Verbal notification given | Boolean + date | Required | As soon as reasonably practicable |
| Who was notified | String[] | Required | Person (if capacity) and/or their representative |
| Written notification sent | Boolean + date | Required | Follow-up letter |
| Account of facts known | Text | Required | What happened |
| Apology offered | Boolean | Required | Sincere, not admission of liability |
| Enquiry details provided | Text | Required | What investigation will take place |
| Results of investigation shared | Boolean + date | Required | When findings shared |
| Person's response | Text | Optional | Their feedback/views |
| Further actions | Text[] | Required | What will change as a result |
| Documented by | User ID | Required | Who managed the process |
| Status | Enum | Required | Initiated / Written sent / Investigation shared / Closed |

#### Duty of Candour Timeline
1. **As soon as reasonably practicable**: Verbal notification with sincere apology
2. **Within 10 working days**: Written notification with account of facts, apology, offer of support
3. **On completion**: Share investigation results and actions taken

### 4.5 Accident and Near-Miss Reporting

#### Near-Miss Specific Fields
| Field | Type | Validation | Notes |
|-------|------|------------|-------|
| Near-miss type | Enum | Required | Medication, Fall hazard, Environmental, Equipment, Staffing, Other |
| What could have happened | Text | Required | Potential outcome if not caught |
| How it was prevented | Text | Required | What intervention prevented the incident |
| Severity if had occurred | Enum | Required | Low / Medium / High / Critical |
| Contributing factors | Text[] | Required | What led to the near-miss |
| System/process improvement | Text[] | Required | What to change to prevent recurrence |

#### RIDDOR (Reporting of Injuries, Diseases and Dangerous Occurrences)
Certain incidents must be reported to HSE under RIDDOR 2013:

| Reportable Event | Criteria | Timeframe |
|-----------------|----------|-----------|
| Death | Any death arising from work activity | Immediately by phone, followed by written report within 10 days |
| Specified injuries | Fractures (other than fingers/toes/thumbs), amputations, loss of sight, crush injuries, burns requiring hospital referral, scalping, loss of consciousness | Within 10 days |
| Over-7-day incapacitation | Employee unable to do normal work for 7+ consecutive days | Within 15 days |
| Non-fatal accidents to non-workers (residents) | Person taken to hospital for treatment | Within 10 days |
| Dangerous occurrences | Listed events (e.g., collapse of equipment, fire, explosion) | Within 10 days |
| Occupational diseases | As specified in RIDDOR Schedule | Within 10 days |

---

## Appendix A: Key Regulatory References

| Reference | Description | URL/Source |
|-----------|-------------|-----------|
| NICE SC1 | Managing Medicines in Care Homes | nice.org.uk/guidance/sc1 |
| NICE NG31 | Care of Dying Adults in the Last Days of Life | nice.org.uk/guidance/ng31 |
| NICE NG142 | End of Life Care for Adults: Service Delivery | nice.org.uk/guidance/ng142 |
| NICE NG46 | Controlled Drugs: Safe Use and Management | nice.org.uk/guidance/ng46 |
| CQC Regulation 9 | Person-Centred Care | cqc.org.uk |
| CQC Regulation 12 | Safe Care and Treatment | cqc.org.uk |
| CQC Regulation 13 | Safeguarding | cqc.org.uk |
| CQC Regulation 17 | Good Governance | cqc.org.uk |
| CQC Regulation 18 | Staffing | cqc.org.uk |
| CQC Regulation 20 | Duty of Candour | cqc.org.uk |
| Mental Capacity Act 2005 | Capacity and best interest | legislation.gov.uk |
| Care Act 2014 | Safeguarding adults | legislation.gov.uk |
| Misuse of Drugs Act 1971 | Controlled drugs | legislation.gov.uk |
| Misuse of Drugs Regulations 2001 | CD schedules and requirements | legislation.gov.uk |
| DSPT | Data Security and Protection Toolkit | dsptoolkit.nhs.uk |
| RIDDOR 2013 | Reporting of Injuries, Diseases and Dangerous Occurrences | hse.gov.uk |
| BAPEN MUST | Malnutrition Universal Screening Tool | bapen.org.uk |
| NEWS2 | National Early Warning Score 2 | england.nhs.uk |
| IDDSI | International Dysphagia Diet Standardisation Initiative | iddsi.org |
| dm+d | Dictionary of Medicines and Devices | nhsbsa.nhs.uk |
| SNOMED CT | Clinical terminology | digital.nhs.uk |
| BNF | British National Formulary | bnf.nice.org.uk |

## Appendix B: Integration Points

| System | Purpose | Standard/Protocol |
|--------|---------|-------------------|
| NHS Spine | Patient demographics, NHS number verification | HL7 FHIR / NHS API |
| GP Connect | Access GP records, medication lists | FHIR R4 |
| dm+d | Drug dictionary, interactions | NHS BSA API |
| SNOMED CT | Clinical coding | SNOMED CT UK Edition |
| Pharmacy systems | Electronic prescribing, stock ordering | EPS (Electronic Prescription Service) |
| NHS 111 / 999 | Emergency escalation | Standard protocols |
| Local Authority | Safeguarding referrals, DoLS applications | Local arrangements |
| CQC | Statutory notifications | CQC Provider Portal |
| MHRA Yellow Card | Adverse reaction reporting | Online submission |
| RIDDOR | HSE incident reporting | Online submission |
| Proxy GP access | Online ordering for care homes | NHS App/GP online services |

## Appendix C: Data Retention Periods

| Record Type | Retention Period | Authority |
|-------------|-----------------|-----------|
| Adult health records (including MAR charts) | 8 years after last entry or conclusion of treatment | NHS Code of Practice |
| Children's health records | Until 25th birthday (or 26th if entry at 17), or 8 years after death | NHS Code of Practice |
| Controlled drugs register | 2 years from date of last entry | Misuse of Drugs Regulations 2001 |
| Incident/accident records | Minimum 10 years (3 years for employers' liability + 7 years for claims) | HSE, Limitation Act 1980 |
| Safeguarding records | Indefinite (follow local authority guidance) | Local policy |
| Mental capacity assessments | As per health record (8 years) | MCA Code of Practice |
| Staff training records | Duration of employment + 6 years | Employment law |
| DoLS authorisations | As per health record | MCA Code of Practice |
| Care plans | 8 years after last entry | NHS Code of Practice |
| Death-related records | 8 years | NHS Code of Practice |

---

*This research document provides the foundational clinical and regulatory requirements for building a comprehensive UK care management platform. All data fields, validation rules, and workflows should be implemented with appropriate user interface design, audit trails, and role-based access controls.*
