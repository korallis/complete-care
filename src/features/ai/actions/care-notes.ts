'use server';

import { generateText, streamText } from 'ai';
import { z } from 'zod';
import {
  getBedrockProvider,
  isAIAvailable,
  CARE_NOTES_MODEL,
  expandNotePrompt,
  correctGrammarPrompt,
  shiftSummaryPrompt,
} from '@/lib/ai';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const expandNoteSchema = z.object({
  brief: z.string().min(1, 'Note text is required').max(2000),
  tone: z.enum(['professional', 'warm', 'clinical']).default('professional'),
});

const correctGrammarSchema = z.object({
  text: z.string().min(1, 'Note text is required').max(5000),
});

const shiftSummarySchema = z.object({
  notes: z
    .array(
      z.object({
        time: z.string(),
        author: z.string(),
        content: z.string(),
      }),
    )
    .min(1, 'At least one note is required'),
});

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type AIResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Expand a brief care note into detailed person-centred language.
 */
export async function expandCareNote(
  input: z.infer<typeof expandNoteSchema>,
): Promise<AIResult<{ expanded: string }>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = expandNoteSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const { text } = await generateText({
      model: bedrock(CARE_NOTES_MODEL),
      prompt: expandNotePrompt(parsed.data.brief, parsed.data.tone),
      maxOutputTokens: 1024,
      temperature: 0.3,
    });

    return { success: true, data: { expanded: text } };
  } catch (err) {
    console.error('[AI] expandCareNote error:', err);
    return {
      success: false,
      error: 'Failed to expand care note. Please try again.',
    };
  }
}

/**
 * Correct grammar and spelling in a care note.
 */
export async function correctCareNoteGrammar(
  input: z.infer<typeof correctGrammarSchema>,
): Promise<AIResult<{ corrected: string }>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = correctGrammarSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const { text } = await generateText({
      model: bedrock(CARE_NOTES_MODEL),
      prompt: correctGrammarPrompt(parsed.data.text),
      maxOutputTokens: 1024,
      temperature: 0.1,
    });

    return { success: true, data: { corrected: text } };
  } catch (err) {
    console.error('[AI] correctCareNoteGrammar error:', err);
    return {
      success: false,
      error: 'Failed to correct grammar. Please try again.',
    };
  }
}

/**
 * Generate a structured shift handover summary from care notes.
 * Uses streaming for better UX on longer responses.
 */
export async function generateShiftSummary(
  input: z.infer<typeof shiftSummarySchema>,
): Promise<AIResult<{ summary: string }>> {
  if (!isAIAvailable()) {
    return { success: false, error: 'AI service is not configured.' };
  }

  const parsed = shiftSummarySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  try {
    const bedrock = getBedrockProvider();
    const result = streamText({
      model: bedrock(CARE_NOTES_MODEL),
      prompt: shiftSummaryPrompt(parsed.data.notes),
      maxOutputTokens: 2048,
      temperature: 0.3,
    });

    // Consume the stream fully for server action response
    let summary = '';
    for await (const chunk of result.textStream) {
      summary += chunk;
    }

    return { success: true, data: { summary } };
  } catch (err) {
    console.error('[AI] generateShiftSummary error:', err);
    return {
      success: false,
      error: 'Failed to generate shift summary. Please try again.',
    };
  }
}
