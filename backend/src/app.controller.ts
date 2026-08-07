import { Controller, Get, Headers, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getApiStatus(@Headers('accept') acceptHeader: string = '', @Res() res: Response) {
    if (acceptHeader.includes('text/html')) {
      return res.type('html').send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Send Moi — API Service Status</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
            body {
              background: #0B0F19;
              color: #F3F4F6;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .card {
              background: rgba(30, 41, 59, 0.7);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(255, 255, 255, 0.1);
              border-radius: 24px;
              max-width: 650px;
              width: 100%;
              padding: 40px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(34, 197, 94, 0.15);
              color: #4ADE80;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .dot { width: 8px; height: 8px; background: #4ADE80; border-radius: 50%; box-shadow: 0 0 10px #4ADE80; }
            h1 { font-size: 2rem; font-weight: 800; background: linear-gradient(135deg, #A855F7, #6366F1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
            p { color: #9CA3AF; line-height: 1.6; margin-bottom: 30px; font-size: 0.95rem; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
            .btn {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              padding: 14px 20px;
              border-radius: 14px;
              text-decoration: none;
              font-weight: 600;
              font-size: 0.95rem;
              transition: all 0.2s ease;
            }
            .btn-primary { background: linear-gradient(135deg, #7C3AED, #4F46E5); color: white; box-shadow: 0 10px 20px -5px rgba(124, 58, 237, 0.4); }
            .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 15px 25px -5px rgba(124, 58, 237, 0.6); }
            .btn-secondary { background: #1E293B; color: #E2E8F0; border: 1px solid #334155; }
            .btn-secondary:hover { background: #334155; color: white; transform: translateY(-2px); }
            .endpoints { background: #0F172A; border-radius: 16px; padding: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .endpoints h3 { font-size: 0.9rem; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
            .tags { display: flex; flex-wrap: wrap; gap: 8px; }
            .tag { background: #1E293B; color: #CBD5E1; font-size: 0.8rem; padding: 4px 10px; border-radius: 8px; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge"><div class="dot"></div> Backend Opérationnel</div>
            <h1>Send Moi API v1.0</h1>
            <p>Le serveur backend NestJS fonctionne parfaitement. Utilisez les boutons ci-dessous pour accéder aux interfaces web Nginx et au portail d'administration.</p>
            
            <div class="grid">
              <a href="http://localhost" class="btn btn-primary">🌐 Site Vitrine Web (Port 80)</a>
              <a href="http://localhost/admin.html" class="btn btn-secondary">🛡️ Portail Admin KYC</a>
            </div>

            <div class="endpoints">
              <h3>Endpoints API REST Prêts</h3>
              <div class="tags">
                <span class="tag">GET /health</span>
                <span class="tag">POST /auth/register</span>
                <span class="tag">POST /auth/login</span>
                <span class="tag">GET /missions</span>
                <span class="tag">POST /users/apply-agent</span>
                <span class="tag">GET /users/:id</span>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    return res.json({
      service: 'Send Moi API',
      status: 'online',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      webInterface: 'http://localhost',
      adminPortal: 'http://localhost/admin.html',
      endpoints: {
        health: '/health',
        auth: '/auth',
        users: '/users',
        missions: '/missions',
        storage: '/storage',
        payments: '/payments',
      },
    });
  }
}
