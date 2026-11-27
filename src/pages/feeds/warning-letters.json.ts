import type { APIRoute } from 'astro';
import warningLetters from '../../data/warning_letters.json';
import metadata from '../../data/metadata.json';

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      syncedAtUtc: metadata.warningLettersLastSyncedUtc,
      count: warningLetters.length,
      source:
        'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/compliance-actions-and-activities/warning-letters',
      records: warningLetters,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
