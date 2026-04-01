/**
 * OnboardingWizard Component Tests
 *
 * Covers:
 * - Renders step 1 initially with 3-step progress indicator
 * - Step 1: organisation name and slug fields, validation
 * - Step 2: care domain selection, validation
 * - Step 3: team invite form with skip option
 * - Back navigation between steps
 * - Progress indicator updates as user advances
 * - Cannot proceed without required fields on each step
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'; // waitFor used in async assertions
import { OnboardingWizard } from '@/components/organisations/onboarding-wizard';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

const mockUpdateSession = vi.fn();

vi.mock('next-auth/react', () => ({
  useSession: () => ({ update: mockUpdateSession }),
}));

// Mock server actions
vi.mock('@/features/organisations/actions', () => ({
  createOrganisationWithInvites: vi.fn().mockResolvedValue({
    success: true,
    data: { orgId: 'test-org-id', orgSlug: 'test-org' },
  }),
  generateOrgSlug: vi.fn().mockResolvedValue('test-org'),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderWizard(props: { userName?: string } = {}) {
  return render(<OnboardingWizard userName={props.userName ?? 'Jane Smith'} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OnboardingWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateSession.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Step 1: Organisation details
  // -------------------------------------------------------------------------

  describe('step 1: organisation details', () => {
    it('renders step 1 initially', () => {
      renderWizard();
      expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
    });

    it('shows a welcome message with user first name', () => {
      renderWizard({ userName: 'Jane Smith' });
      expect(screen.getByText(/welcome, jane/i)).toBeInTheDocument();
    });

    it('shows progress indicator indicating step 1 of 3', () => {
      renderWizard();
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('renders three step indicators in the progress bar', () => {
      renderWizard();
      expect(screen.getByLabelText('Step 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 3')).toBeInTheDocument();
    });

    it('shows a Continue button on step 1', () => {
      renderWizard();
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
    });

    it('does not show a Back button on step 1', () => {
      renderWizard();
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('shows validation error when name is empty and Continue is clicked', async () => {
      renderWizard();
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      await act(async () => {
        fireEvent.click(continueBtn);
      });
      expect(screen.getByText(/organisation name is required/i)).toBeInTheDocument();
    });

    it('shows the URL slug field', () => {
      renderWizard();
      expect(screen.getByLabelText(/url slug/i)).toBeInTheDocument();
    });

    it('shows the organisation type field', () => {
      renderWizard();
      expect(screen.getByLabelText(/organisation type/i)).toBeInTheDocument();
    });

    it('organisation type field has expected options', () => {
      renderWizard();
      const orgTypeSelect = screen.getByLabelText(/organisation type/i) as HTMLSelectElement;
      const optionLabels = Array.from(orgTypeSelect.options).map((o) => o.text);
      expect(optionLabels).toContain('Independent care provider');
      expect(optionLabels).toContain('Care group / multiple locations');
      expect(optionLabels).toContain('Charity / not-for-profit');
    });

    it('can advance to step 2 without selecting an org type (it is optional)', async () => {
      renderWizard();
      // Only fill required fields
      fireEvent.change(screen.getByLabelText(/organisation name/i), {
        target: { value: 'Sunrise Care' },
      });
      fireEvent.change(screen.getByLabelText(/url slug/i), {
        target: { value: 'sunrise-care' },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });
      // Should advance to step 2
      expect(screen.getByText(/which care services/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Step 2: Care domains
  // -------------------------------------------------------------------------

  describe('step 2: care domain selection', () => {
    beforeEach(async () => {
      renderWizard();
      // Fill step 1 and manually set slug to ensure we can advance
      const nameInput = screen.getByLabelText(/organisation name/i);
      fireEvent.change(nameInput, { target: { value: 'Sunrise Care' } });
      // Set slug via the slug input
      const slugInput = screen.getByLabelText(/url slug/i);
      fireEvent.change(slugInput, { target: { value: 'sunrise-care' } });
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      await act(async () => {
        fireEvent.click(continueBtn);
      });
    });

    it('advances to step 2 with valid step 1 data', () => {
      expect(screen.getByText(/which care services/i)).toBeInTheDocument();
    });

    it('shows step 2 of 3 in progress indicator', () => {
      expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    });

    it('shows Domiciliary Care option', () => {
      expect(
        screen.getByRole('checkbox', { name: /domiciliary care/i }),
      ).toBeInTheDocument();
    });

    it('shows Supported Living option', () => {
      expect(
        screen.getByRole('checkbox', { name: /supported living/i }),
      ).toBeInTheDocument();
    });

    it("shows Children's Residential Homes option", () => {
      expect(
        screen.getByRole('checkbox', { name: /children's residential/i }),
      ).toBeInTheDocument();
    });

    it('shows validation error when no domain selected and Continue clicked', async () => {
      const continueBtn = screen.getByRole('button', { name: /continue/i });
      await act(async () => {
        fireEvent.click(continueBtn);
      });
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('allows selecting multiple domains', async () => {
      const domiciliaryOption = screen.getByRole('checkbox', {
        name: /domiciliary care/i,
      });
      const supportedLivingOption = screen.getByRole('checkbox', {
        name: /supported living/i,
      });

      await act(async () => {
        fireEvent.click(domiciliaryOption);
        fireEvent.click(supportedLivingOption);
      });

      expect(domiciliaryOption).toHaveAttribute('aria-checked', 'true');
      expect(supportedLivingOption).toHaveAttribute('aria-checked', 'true');
    });

    it('shows Back button on step 2', () => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('navigates back to step 1 when Back is clicked', async () => {
      const backBtn = screen.getByRole('button', { name: /back/i });
      await act(async () => {
        fireEvent.click(backBtn);
      });
      expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Step 3: Team invitations
  // -------------------------------------------------------------------------

  describe('step 3: team invitations', () => {
    beforeEach(async () => {
      renderWizard();

      // Navigate to step 2
      const nameInput = screen.getByLabelText(/organisation name/i);
      fireEvent.change(nameInput, { target: { value: 'Sunrise Care' } });
      const slugInput = screen.getByLabelText(/url slug/i);
      fireEvent.change(slugInput, { target: { value: 'sunrise-care' } });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      // Select domain in step 2 and advance to step 3
      const domainOption = screen.getByRole('checkbox', {
        name: /domiciliary care/i,
      });
      await act(async () => {
        fireEvent.click(domainOption);
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });
    });

    it('advances to step 3 after selecting a domain', () => {
      expect(screen.getByText(/invite your team/i)).toBeInTheDocument();
    });

    it('shows step 3 of 3 in progress indicator', () => {
      expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    });

    it('shows a skip option', () => {
      expect(
        screen.getByRole('button', { name: /skip/i }),
      ).toBeInTheDocument();
    });

    it('shows at least one email input field', () => {
      const emailInputs = screen.getAllByLabelText(/email address for invitee/i);
      expect(emailInputs.length).toBeGreaterThanOrEqual(1);
    });

    it('shows a role selector for invitees', () => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('shows a Back button on step 3', () => {
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('navigates back to step 2 when Back is clicked', async () => {
      const backBtn = screen.getByRole('button', { name: /back/i });
      await act(async () => {
        fireEvent.click(backBtn);
      });
      expect(screen.getByText(/which care services/i)).toBeInTheDocument();
    });

    it('calls createOrganisationWithInvites when skipping', async () => {
      const { createOrganisationWithInvites } = await import(
        '@/features/organisations/actions'
      );
      const skipBtn = screen.getByRole('button', { name: /skip/i });
      await act(async () => {
        fireEvent.click(skipBtn);
      });
      await waitFor(() => {
        expect(createOrganisationWithInvites).toHaveBeenCalled();
      });
    });

    it('calls createOrganisationWithInvites with empty invites when skipping', async () => {
      const { createOrganisationWithInvites } = await import(
        '@/features/organisations/actions'
      );
      const skipBtn = screen.getByRole('button', { name: /skip/i });
      await act(async () => {
        fireEvent.click(skipBtn);
      });
      await waitFor(() => {
        expect(createOrganisationWithInvites).toHaveBeenCalledWith(
          expect.objectContaining({ invites: [] }),
        );
      });
    });
  });

  // -------------------------------------------------------------------------
  // Progress indicator
  // -------------------------------------------------------------------------

  describe('progress indicator', () => {
    it('shows 3 step circles in the progress bar', () => {
      renderWizard();
      // There should be 3 step labels
      expect(screen.getByLabelText('Step 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Step 3')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Completion
  // -------------------------------------------------------------------------

  describe('completion flow', () => {
    it('redirects to dashboard after completing onboarding', async () => {
      renderWizard();

      // Step 1
      fireEvent.change(screen.getByLabelText(/organisation name/i), {
        target: { value: 'Sunrise Care' },
      });
      fireEvent.change(screen.getByLabelText(/url slug/i), {
        target: { value: 'sunrise-care' },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      // Step 2 - select domain first, then advance
      await act(async () => {
        fireEvent.click(
          screen.getByRole('checkbox', { name: /domiciliary care/i }),
        );
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      // Step 3 - skip
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringContaining('/dashboard'),
        );
      });
    });

    it('passes domains to createOrganisationWithInvites', async () => {
      const { createOrganisationWithInvites } = await import(
        '@/features/organisations/actions'
      );

      renderWizard();

      fireEvent.change(screen.getByLabelText(/organisation name/i), {
        target: { value: 'Sunrise Care' },
      });
      fireEvent.change(screen.getByLabelText(/url slug/i), {
        target: { value: 'sunrise-care' },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('checkbox', { name: /domiciliary care/i }),
        );
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      });

      await waitFor(() => {
        expect(createOrganisationWithInvites).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Sunrise Care',
            slug: 'sunrise-care',
            domains: expect.arrayContaining(['domiciliary']),
          }),
        );
      });
    });

    it('passes orgType to createOrganisationWithInvites when selected', async () => {
      const { createOrganisationWithInvites } = await import(
        '@/features/organisations/actions'
      );

      renderWizard();

      fireEvent.change(screen.getByLabelText(/organisation name/i), {
        target: { value: 'Sunrise Care' },
      });
      fireEvent.change(screen.getByLabelText(/url slug/i), {
        target: { value: 'sunrise-care' },
      });
      // Select an org type
      fireEvent.change(screen.getByLabelText(/organisation type/i), {
        target: { value: 'care_group' },
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      await act(async () => {
        fireEvent.click(
          screen.getByRole('checkbox', { name: /domiciliary care/i }),
        );
      });
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /continue/i }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /skip/i }));
      });

      await waitFor(() => {
        expect(createOrganisationWithInvites).toHaveBeenCalledWith(
          expect.objectContaining({
            orgType: 'care_group',
          }),
        );
      });
    });
  });
});
