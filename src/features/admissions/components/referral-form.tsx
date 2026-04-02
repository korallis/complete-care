'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { createReferral } from '../actions';

type FormState = {
  success: boolean;
  error?: string;
};

async function submitReferral(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const data = {
      childFirstName: formData.get('childFirstName') as string,
      childLastName: formData.get('childLastName') as string,
      childDateOfBirth: formData.get('childDateOfBirth') as string,
      childGender: formData.get('childGender') as string,
      childEthnicity: formData.get('childEthnicity') as string,
      childNationality: formData.get('childNationality') as string,
      childLanguage: formData.get('childLanguage') as string,
      childReligion: formData.get('childReligion') as string,
      backgroundSummary: formData.get('backgroundSummary') as string,
      referralReason: formData.get('referralReason') as string,
      placingAuthorityName: formData.get('placingAuthorityName') as string,
      socialWorkerName: formData.get('socialWorkerName') as string,
      socialWorkerEmail: formData.get('socialWorkerEmail') as string,
      socialWorkerPhone: formData.get('socialWorkerPhone') as string,
      teamManagerName: formData.get('teamManagerName') as string,
      teamManagerEmail: formData.get('teamManagerEmail') as string,
      legalStatus: formData.get('legalStatus') as string,
    };

    await createReferral(data);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create referral',
    };
  }
}

export function ReferralForm() {
  const [state, formAction, isPending] = useActionState(submitReferral, {
    success: false,
  });

  if (state.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Referral created successfully</p>
          <p className="text-sm text-muted-foreground">
            The referral has been recorded and is ready for assessment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Child information */}
      <Card>
        <CardHeader>
          <CardTitle>Child information</CardTitle>
          <CardDescription>
            Basic details about the child being referred.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="childFirstName">First name *</Label>
            <Input
              id="childFirstName"
              name="childFirstName"
              required
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childLastName">Last name *</Label>
            <Input
              id="childLastName"
              name="childLastName"
              required
              placeholder="Last name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childDateOfBirth">Date of birth *</Label>
            <Input
              id="childDateOfBirth"
              name="childDateOfBirth"
              type="date"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childGender">Gender *</Label>
            <Select name="childGender" required>
              <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">
                  Prefer not to say
                </option>
              
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="childEthnicity">Ethnicity</Label>
            <Input
              id="childEthnicity"
              name="childEthnicity"
              placeholder="Ethnicity"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childNationality">Nationality</Label>
            <Input
              id="childNationality"
              name="childNationality"
              placeholder="Nationality"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childLanguage">Language</Label>
            <Input
              id="childLanguage"
              name="childLanguage"
              placeholder="Primary language"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="childReligion">Religion</Label>
            <Input
              id="childReligion"
              name="childReligion"
              placeholder="Religion"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalStatus">Legal status</Label>
            <Select name="legalStatus">
              <option value="">Select legal status</option>
                <option value="section_20">
                  Section 20 — Voluntary accommodation
                </option>
                <option value="section_31">
                  Section 31 — Care order
                </option>
                <option value="section_38">
                  Section 38 — Interim care order
                </option>
                <option value="section_44">
                  Section 44 — Emergency protection order
                </option>
                <option value="section_46">
                  Section 46 — Police protection
                </option>
                <option value="remand">Remand</option>
                <option value="other">Other</option>
              
            </Select>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Background & needs */}
      <Card>
        <CardHeader>
          <CardTitle>Background and needs</CardTitle>
          <CardDescription>
            Background summary, behaviours, and any relevant history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="backgroundSummary">Background summary</Label>
            <Textarea
              id="backgroundSummary"
              name="backgroundSummary"
              placeholder="Provide a summary of the child's background, family history, and current circumstances..."
              rows={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referralReason">Reason for referral *</Label>
            <Textarea
              id="referralReason"
              name="referralReason"
              required
              placeholder="Why is this child being referred to your home?"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Placing authority */}
      <Card>
        <CardHeader>
          <CardTitle>Placing authority</CardTitle>
          <CardDescription>
            Details of the referring local authority and allocated social worker.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="placingAuthorityName">
              Placing authority name *
            </Label>
            <Input
              id="placingAuthorityName"
              name="placingAuthorityName"
              required
              placeholder="e.g. London Borough of Camden"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialWorkerName">Social worker name *</Label>
            <Input
              id="socialWorkerName"
              name="socialWorkerName"
              required
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialWorkerEmail">Social worker email *</Label>
            <Input
              id="socialWorkerEmail"
              name="socialWorkerEmail"
              type="email"
              required
              placeholder="email@council.gov.uk"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="socialWorkerPhone">Social worker phone</Label>
            <Input
              id="socialWorkerPhone"
              name="socialWorkerPhone"
              type="tel"
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamManagerName">Team manager name</Label>
            <Input
              id="teamManagerName"
              name="teamManagerName"
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamManagerEmail">Team manager email</Label>
            <Input
              id="teamManagerEmail"
              name="teamManagerEmail"
              type="email"
              placeholder="email@council.gov.uk"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Submitting...' : 'Submit referral'}
        </Button>
      </div>
    </form>
  );
}
