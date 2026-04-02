'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReferralStatusBadge } from './referral-status-badge';
import { ReferralTimeline } from './referral-timeline';
import { MatchingAssessmentForm } from './matching-assessment-form';
import { DecisionForm } from './decision-form';
import { AdmissionChecklist } from './admission-checklist';
import type { Referral, ReferralTransition, MatchingAssessment, AdmissionChecklistItem } from '@/lib/db/schema/admissions';

interface ReferralDetailProps {
  referral: Referral;
  transitions: ReferralTransition[];
  assessments: MatchingAssessment[];
  checklist: AdmissionChecklistItem[];
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 py-2">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function ReferralDetail({
  referral,
  transitions,
  assessments,
  checklist,
}: ReferralDetailProps) {
  const childName = `${referral.childFirstName} ${referral.childLastName}`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {childName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Referred by {referral.placingAuthorityName}
          </p>
        </div>
        <ReferralStatusBadge status={referral.status} />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="decision">Decision</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Child details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow
                    label="Date of birth"
                    value={referral.childDateOfBirth}
                  />
                  <InfoRow label="Gender" value={referral.childGender} />
                  <InfoRow label="Ethnicity" value={referral.childEthnicity} />
                  <InfoRow
                    label="Nationality"
                    value={referral.childNationality}
                  />
                  <InfoRow label="Language" value={referral.childLanguage} />
                  <InfoRow label="Religion" value={referral.childReligion} />
                  <InfoRow
                    label="Legal status"
                    value={referral.legalStatus}
                  />
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Placing authority</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-y">
                  <InfoRow
                    label="Authority"
                    value={referral.placingAuthorityName}
                  />
                  <InfoRow
                    label="Social worker"
                    value={referral.socialWorkerName}
                  />
                  <InfoRow
                    label="Email"
                    value={referral.socialWorkerEmail}
                  />
                  <InfoRow
                    label="Phone"
                    value={referral.socialWorkerPhone}
                  />
                  <InfoRow
                    label="Team manager"
                    value={referral.teamManagerName}
                  />
                  <InfoRow
                    label="Manager email"
                    value={referral.teamManagerEmail}
                  />
                </dl>
              </CardContent>
            </Card>
          </div>

          {referral.backgroundSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Background summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {referral.backgroundSummary}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Referral reason</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">
                {referral.referralReason}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment tab */}
        <TabsContent value="assessment" className="space-y-6">
          {assessments.length > 0 ? (
            assessments.map((assessment) => (
              <Card key={assessment.id}>
                <CardHeader>
                  <CardTitle>Matching / impact risk assessment</CardTitle>
                  <CardDescription>
                    Completed{' '}
                    {assessment.completedAt
                      ? new Date(assessment.completedAt).toLocaleString(
                          'en-GB',
                        )
                      : '-'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Risk-to rating
                      </p>
                      <Badge
                        variant={
                          assessment.riskToRating === 'high'
                            ? 'destructive'
                            : assessment.riskToRating === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {assessment.riskToRating ?? 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Risk-from rating
                      </p>
                      <Badge
                        variant={
                          assessment.riskFromRating === 'high'
                            ? 'destructive'
                            : assessment.riskFromRating === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {assessment.riskFromRating ?? 'N/A'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Overall risk
                      </p>
                      <Badge
                        variant={
                          assessment.overallRiskRating === 'high'
                            ? 'destructive'
                            : assessment.overallRiskRating === 'medium'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {assessment.overallRiskRating}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Occupancy
                      </p>
                      <p className="text-sm">
                        {assessment.currentOccupancy ?? '-'} /{' '}
                        {assessment.maxCapacity ?? '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Beds available
                      </p>
                      <p className="text-sm">
                        {assessment.bedsAvailable ?? '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Recommendation
                      </p>
                      <Badge>
                        {assessment.recommendation.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Rationale
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {assessment.recommendationRationale}
                    </p>
                  </div>

                  {assessment.conditions && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        Conditions
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {assessment.conditions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : referral.status === 'received' ? (
            <MatchingAssessmentForm
              referralId={referral.id}
              childName={childName}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No assessment recorded.
            </p>
          )}
        </TabsContent>

        {/* Decision tab */}
        <TabsContent value="decision" className="space-y-6">
          {referral.status === 'assessment_complete' ? (
            <DecisionForm referralId={referral.id} childName={childName} />
          ) : referral.decisionAt ? (
            <Card>
              <CardHeader>
                <CardTitle>Decision</CardTitle>
                <CardDescription>
                  Recorded{' '}
                  {new Date(referral.decisionAt).toLocaleString('en-GB')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Outcome
                  </p>
                  <ReferralStatusBadge
                    status={
                      referral.status === 'declined'
                        ? 'declined'
                        : 'accepted'
                    }
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Reason
                  </p>
                  <p className="text-sm whitespace-pre-wrap">
                    {referral.decisionReason}
                  </p>
                </div>
                {referral.acceptanceConditions && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Conditions
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {referral.acceptanceConditions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-muted-foreground">
              Assessment must be completed before a decision can be made.
            </p>
          )}
        </TabsContent>

        {/* Checklist tab */}
        <TabsContent value="checklist" className="space-y-6">
          {checklist.length > 0 ? (
            <AdmissionChecklist
              referralId={referral.id}
              childName={childName}
              items={checklist}
            />
          ) : referral.status === 'accepted' ||
            referral.status === 'admitted' ? (
            <p className="text-sm text-muted-foreground">
              Checklist items not yet created.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              The admission checklist will become available after the referral
              is accepted.
            </p>
          )}
        </TabsContent>

        {/* Timeline tab */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Workflow timeline</CardTitle>
              <CardDescription>
                Full history of status transitions for this referral.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReferralTimeline transitions={transitions} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
