import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { artifactPaths, readArtifact } from '@/__tests__/planning/blueprint-test-helpers';

describe('Complete Care master blueprint planning package', () => {
  it('includes the approved planning artifacts and source spec', () => {
    for (const artifactPath of Object.values(artifactPaths)) {
      expect(existsSync(artifactPath), `Missing artifact: ${artifactPath}`).toBe(true);
    }
  });

  it('keeps the PRD implementation-ready with ADR and deliberate planning sections', () => {
    const prd = readArtifact('prd');

    expect(prd).toContain('## 2. ADR');
    expect(prd).toContain('### Decision');
    expect(prd).toContain('### Drivers');
    expect(prd).toContain('### Alternatives considered');
    expect(prd).toContain('### Consequences');
    expect(prd).toContain('### Principles');
    expect(prd).toContain('### Top decision drivers');
    expect(prd).toContain('### Pre-mortem (deliberate mode)');
    expect(prd).toContain('## 8. Detailed acceptance criteria');
    expect(prd).toContain('verification / acceptance criteria');
  });

  it('keeps the roadmap phased, workstreamed, and staffing-aware', () => {
    const roadmap = readArtifact('roadmap');

    for (const phase of [
      '### Phase 0 — audit + governance lock',
      '### Phase 1 — platform backbone',
      '### Phase 2 — people + workforce backbone',
      '### Phase 3 — scheduling / operations anchor',
      '### Phase 4 — regulator-compliance symmetry',
      '### Phase 5 — domain specialist overlays',
      '### Phase 6 — commercial, reporting, AI, family, and trust surfaces',
    ]) {
      expect(roadmap).toContain(phase);
    }

    for (const workstream of ['W0', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9']) {
      expect(roadmap).toContain(`### ${workstream}`);
    }

    expect(roadmap).toContain('## 8. Staffing guidance');
    expect(roadmap).toContain('preserve Ofsted for Children’s Homes');
    expect(roadmap).toContain('create first-class CQC workspace for adult/complex-care domains');
  });

  it('preserves the anchor bundle and regulator/domain guardrails across the package', () => {
    const deepInterviewSpec = readArtifact('deepInterviewSpec');
    const roadmap = readArtifact('roadmap');
    const testSpec = readArtifact('testSpec');
    const gapMatrix = readArtifact('gapMatrix');

    for (const document of [deepInterviewSpec, roadmap, testSpec, gapMatrix]) {
      expect(document).toMatch(/Complex Care/i);
      expect(document).toMatch(/CQC workspace/i);
    }

    expect(deepInterviewSpec).toMatch(/Children.?s Homes\s*→\s*Ofsted/u);
    expect(deepInterviewSpec).toMatch(/Domiciliary Care\s*→\s*CQC/u);
    expect(deepInterviewSpec).toMatch(/Supported Living\s*→\s*CQC/u);
    expect(deepInterviewSpec).toMatch(/Complex Care\s*→\s*CQC/u);
    expect(deepInterviewSpec).toMatch(/Complex Care is a \*\*product\/service domain\*\*, not a separate legal regulator\./u);

    expect(gapMatrix).toContain('scheduling booking and repeat booking');
    expect(gapMatrix).toContain('rota generation / assignment');
    expect(gapMatrix).toContain('Complex Care as the 4th domain');
    expect(gapMatrix).toContain('marketing 3→4 domain update');

    expect(testSpec).toContain('Public user can understand the 4-domain story and regulator split without contradictory copy.');
    expect(gapMatrix).toContain('The following already-planned package must remain a first-class section inside the master blueprint:');
  });

  it('defines verification coverage from planning validation through e2e and observability', () => {
    const testSpec = readArtifact('testSpec');

    for (const heading of [
      '## 2. Planning artifact validation',
      '## 3. Unit verification expectations',
      '## 4. Integration verification expectations',
      '## 5. E2E verification expectations',
      '## 6. Observability / audit / compliance checks',
      '## 7. Deliberate-mode failure probes',
      '## 8. Exit criteria before implementation handoff',
    ]) {
      expect(testSpec).toContain(heading);
    }

    expect(testSpec).toContain('new domain enum added in one subsystem but omitted elsewhere');
    expect(testSpec).toContain('CQC workspace aggregates evidence from the correct adult-domain modules');
    expect(testSpec).toContain('Ofsted flows remain isolated to children’s-home contexts');
  });

  it('keeps an evidence-labeled platform gap matrix for the major workstreams', () => {
    const gapMatrix = readArtifact('gapMatrix');

    for (const workstream of [
      'Public marketing & metadata',
      'Canonical domain model',
      'Platform core / org / auth / RBAC / audit',
      'Scheduling / visits / EVV / rota / payroll / travel',
      'CQC compliance workspace',
      'Complex Care overlays',
      'EMAR & medication operations',
      'GDPR / security / settings / PWA',
    ]) {
      expect(gapMatrix).toContain(workstream);
    }

    expect(gapMatrix).toContain('## Evidence labels for downstream planning');
    expect(gapMatrix).toContain('**Observed** — inspected route/module/artifact exists');
    expect(gapMatrix).toContain('**Inferred** — likely capability from mission/feature module but not deeply audited yet');
    expect(gapMatrix).toContain('**Planned** — desired target state only');
  });
});
