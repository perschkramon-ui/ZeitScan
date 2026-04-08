'use server';
/**
 * @fileOverview This file contains the Genkit flow for summarizing an employee's work patterns.
 *
 * - summarizeEmployeeWorkPatterns - A function that handles the generation of work pattern summaries.
 * - AdminSummarizeEmployeeWorkPatternsInput - The input type for the summarizeEmployeeWorkPatterns function.
 * - AdminSummarizeEmployeeWorkPatternsOutput - The return type for the summarizeEmployeeWorkPatterns function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdminSummarizeEmployeeWorkPatternsInputSchema = z.object({
  employeeName: z.string().describe('The name of the employee.'),
  timeLogs: z
    .array(
      z.object({
        clockInTime: z.string().describe('The clock-in timestamp (e.g., ISO 8601 string).'),
        clockOutTime: z.string().describe('The clock-out timestamp (e.g., ISO 8601 string).'),
      })
    )
    .describe(
      'A list of time logs for the employee, each with a clock-in and clock-out time.'
    ),
});
export type AdminSummarizeEmployeeWorkPatternsInput = z.infer<
  typeof AdminSummarizeEmployeeWorkPatternsInputSchema
>;

const AdminSummarizeEmployeeWorkPatternsOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      "A brief summary of the employee's work patterns, including average start/end times, common shift lengths, and busiest days."
    ),
});
export type AdminSummarizeEmployeeWorkPatternsOutput = z.infer<
  typeof AdminSummarizeEmployeeWorkPatternsOutputSchema
>;

export async function summarizeEmployeeWorkPatterns(
  input: AdminSummarizeEmployeeWorkPatternsInput
): Promise<AdminSummarizeEmployeeWorkPatternsOutput> {
  return adminSummarizeEmployeeWorkPatternsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adminSummarizeEmployeeWorkPatternsPrompt',
  input: {schema: AdminSummarizeEmployeeWorkPatternsInputSchema},
  output: {schema: AdminSummarizeEmployeeWorkPatternsOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing an employee's work patterns.

Analyze the provided time logs for {{{employeeName}}} and generate a brief summary of their work habits. Focus on key insights such as:
- Average clock-in and clock-out times.
- Common shift lengths.
- Busiest days of the week.
- Any unusual or noteworthy patterns (e.g., frequent short shifts, very early or late clock-outs).

Here are the time logs for {{{employeeName}}}:

{{#each timeLogs}}
  - Clock In: {{{clockInTime}}}, Clock Out: {{{clockOutTime}}}
{{/each}}

Your summary should be concise and insightful.
`,
});

const adminSummarizeEmployeeWorkPatternsFlow = ai.defineFlow(
  {
    name: 'adminSummarizeEmployeeWorkPatternsFlow',
    inputSchema: AdminSummarizeEmployeeWorkPatternsInputSchema,
    outputSchema: AdminSummarizeEmployeeWorkPatternsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
