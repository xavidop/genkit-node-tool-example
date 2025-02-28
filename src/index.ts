/* eslint-disable  @typescript-eslint/no-explicit-any */

import { genkit, z } from 'genkit';
import { startFlowServer } from '@genkit-ai/express';
import { openAIO3Mini, github } from 'genkitx-github';
import {OpenWeatherAPI } from 'openweather-api-node';
import dotenv from 'dotenv';

dotenv.config();

const ai = genkit({
  plugins: [
    github({ githubToken: process.env.GITHUB_TOKEN }),
  ],
  model: openAIO3Mini,
});

const weatherToolInputSchema = z.object({ 
  location: z.string().describe('The location to get the current weather for')
});

const getWeather = ai.defineTool(
  {
    name: 'getWeather',
    description: 'Gets the current weather in a given location',
    inputSchema: weatherToolInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {

    const weather = new OpenWeatherAPI({
        key: process.env.OPENWEATHER_API_KEY,
        units: "metric"
    })

    const data = await weather.getCurrent({locationName: input.location});

    return `The current weather in ${input.location} is: ${data.weather.temp.cur} Degrees in Celsius`;
  }
);

const helloFlow = ai.defineFlow(
  {
    name: 'helloFlow',
    inputSchema: z.object({ location: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {

    const response  = await ai.generate({
      tools: [getWeather],
      prompt: `What's the weather in ${input.location}?`
    });

    return response.text;
  }
);

startFlowServer({
  flows: [helloFlow]
});