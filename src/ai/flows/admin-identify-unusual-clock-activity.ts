'use server';
/**
 * @fileOverview A Genkit flow for administrators to identify unusual clock-in/out activities for a selected employee.
 *
 * - identifyUnusualClockActivity - A function that triggers the AI analysis of an employee's time logs.
 * - IdentifyUnusualActivityInput - The input type for the identifyUnusualClockActivity function.
 * - IdentifyUnusualActivityOutput - The return type for the identifyUnusualClockActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyUnusualActivityInputSchema = z.object({
  employeeId: z.string().describe('The ID of the employee.'),
  timeLogs: z.array(
    z.object({
      clockIn: z.string().datetime().describe('The ISO 8601 timestamp of the clock-in event.'),
      clockOut: z.string().datetime().optional().describe('The ISO 8601 timestamp of the clock-out event, if clocked out.'),
    })
  ).describe('A list of the employee\'s time logs.'),
});
export type IdentifyUnusualActivityInput = z.infer<typeof IdentifyUnusualActivityInputSchema>;

const IdentifyUnusualActivityOutputSchema = z.object({
  summary: z.string().describe('A summary highlighting unusual clock-in/out activities for the employee.'),
});
export type IdentifyUnusualActivityOutput = z.infer<typeof IdentifyUnusualActivityOutputSchema>;

const identifyUnusualActivityPrompt = ai.definePrompt({
  name: 'identifyUnusualActivityPrompt',
  input: {schema: IdentifyUnusualActivityInputSchema},
  output: {schema: IdentifyUnusualActivityOutputSchema},
  prompt: `You are an AI assistant for human resources administrators. Your task is to analyze an employee's clock-in/out activities and highlight any unusual patterns or anomalies.
Unusual patterns include, but are not limited to:
- Significantly early or late clock-ins/outs compared to typical working hours.
- Very short shifts (e.g., less than an hour).
- Unexpectedly long shifts (e.g., over 12 hours).
- Frequent missing clock-out events.
- Inconsistent clock-in/out times.

Analyze the following time logs for Employee ID: {{{employeeId}}}

Employee Time Logs:
{{#if timeLogs}}
{{#each timeLogs}}
- Clock In: {{{clockIn}}}
{{#if clockOut}}
  Clock Out: {{{clockOut}}}
{{else}}
  Currently clocked in.
{{/if}}
{{/each}}
{{else}}
No time logs available for this employee.
{{/if}}

Provide a concise summary highlighting any unusual activities or patterns you observe. If no unusual activities are found, state that the activities appear normal.`,
});

const identifyUnusualClockActivityFlow = ai.defineFlow(
  {
    name: 'identifyUnusualClockActivityFlow',
    inputSchema: IdentifyUnusualActivityInputSchema,
    outputSchema: IdentifyUnusualActivityOutputSchema,
  },
  async (input) => {
    const {output} = await identifyUnusualActivityPrompt(input);
    return output!;
  }
);

export async function identifyUnusualClockActivity(
  input: IdentifyUnusualActivityInput
): Promise<IdentifyUnusualActivityOutput> {
  return identifyUnusualClockActivityFlow(input);
}
