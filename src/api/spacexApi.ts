import { z } from 'zod';

import { httpRequest } from './httpClient';

const SPACEX_API_BASE_URL = 'https://api.spacexdata.com';

const spacexLaunchSchema = z.object({
  date_utc: z.string(),
  id: z.string(),
  launchpad: z.string().nullable().optional(),
  links: z
    .object({
      patch: z
        .object({
          small: z.string().url().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
  name: z.string(),
  rocket: z.string().nullable().optional(),
  success: z.boolean().nullable().optional(),
  upcoming: z.boolean(),
});

const spacexLaunchesSchema = z.array(spacexLaunchSchema);

const spacexLaunchpadSchema = z.object({
  full_name: z.string(),
  id: z.string(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  name: z.string(),
});

export type SpaceXLaunch = z.infer<typeof spacexLaunchSchema>;
export type SpaceXLaunchpad = z.infer<typeof spacexLaunchpadSchema>;

export function getLaunches(): Promise<SpaceXLaunch[]> {
  return httpRequest(`${SPACEX_API_BASE_URL}/v5/launches`, {
    schema: spacexLaunchesSchema,
  });
}

export function getLaunchpadById(launchpadId: string): Promise<SpaceXLaunchpad> {
  return httpRequest(`${SPACEX_API_BASE_URL}/v4/launchpads/${launchpadId}`, {
    schema: spacexLaunchpadSchema,
  });
}
