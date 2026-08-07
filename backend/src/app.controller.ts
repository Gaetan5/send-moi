import { Controller, Get } from '@nestjs/common';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getApiStatus() {
    return {
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
    };
  }
}
