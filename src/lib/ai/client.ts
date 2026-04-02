import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';

/**
 * AWS Bedrock AI client via Vercel AI SDK.
 *
 * Reads credentials from environment variables:
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - AWS_REGION (defaults to eu-west-2)
 *
 * All AI features gracefully degrade when credentials are absent.
 */

const AWS_REGION = process.env.AWS_REGION ?? 'eu-west-2';

/**
 * Returns true when AWS Bedrock credentials are configured.
 */
export function isAIAvailable(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY,
  );
}

/**
 * Create a Bedrock provider instance. Throws if credentials are missing.
 */
export function getBedrockProvider() {
  if (!isAIAvailable()) {
    throw new Error(
      'AWS Bedrock credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.',
    );
  }

  return createAmazonBedrock({
    region: AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  });
}

/** Default model for care note tasks (fast, cost-effective). */
export const CARE_NOTES_MODEL = 'anthropic.claude-3-haiku-20240307-v1:0';

/** Model for risk/compliance analysis (higher reasoning capability). */
export const RISK_ANALYSIS_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';
