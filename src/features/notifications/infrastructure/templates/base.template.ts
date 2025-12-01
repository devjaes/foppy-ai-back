import env from '@/env';

export const baseTemplate = (title: string, subtitle: string | null, message: string, type: string) => {
  const typeColor = {
    GOAL: '#4CAF50',
    DEBT: '#F44336',
    SUGGESTION: '#2196F3',
    WARNING: '#FF9800',
    CONGRATULATION: '#8BC34A'
  };

  const color = typeColor[type as keyof typeof typeColor] || '#757575';
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:3001';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
          background-color: ${color};
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
        }
        .content {
          padding: 20px;
        }
        .footer {
          text-align: center;
          padding: 10px 20px;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .button {
          display: inline-block;
          background-color: ${color};
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin-top: 20px;
        }
        .subtitle {
          font-size: 16px;
          color: #555;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
          ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
        </div>
        <div class="content">
          <p>${message.replace(/\n/g, '<br>')}</p>
          <a href="${frontendUrl}/management" class="button">Ver en la aplicación</a>
        </div>
        <div class="footer">
          <p>Fopymes - Tu aplicación de finanzas personales</p>
          <p>© ${new Date().getFullYear()} Fopymes. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
  </html>
  `;
};
