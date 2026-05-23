import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';
import { GoogleGenAI } from '@google/genai';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.use(express.json({ limit: '50mb' }));

const angularApp = new AngularNodeAppEngine();

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY'] || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to get Gemini client based on user API key header
function getAiInstance(req: express.Request): GoogleGenAI {
  const userApiKey = req.headers['x-gemini-api-key'];
  if (userApiKey && typeof userApiKey === 'string' && userApiKey.trim() !== '') {
    return new GoogleGenAI({
      apiKey: userApiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-custom',
        }
      }
    });
  }
  return ai;
}

app.post('/api/gemini/countTokens', async (req, res) => {
  const { fileData, mimeType } = req.body;
  try {
    const activeAi = getAiInstance(req);
    const result = await activeAi.models.countTokens({
      model: 'gemini-flash-lite-latest',
      contents: [
        {
          parts: [
            mimeType === 'text/html' ? { text: fileData } : {
              inlineData: {
                data: fileData,
                mimeType: mimeType
              }
            }
          ]
        }
      ]
    });
    res.json({ totalTokens: result.totalTokens });
  } catch (error: unknown) {
    console.error('Count tokens error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.post('/api/gemini/generate', async (req, res) => {
  const { model, contents, config } = req.body;
  try {
    const activeAi = getAiInstance(req);
    const response = await activeAi.models.generateContent({
      model,
      contents,
      config
    });
    res.json(response);
  } catch (error: unknown) {
    console.error('Generate content error:', error);
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
export { app };
