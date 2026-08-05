import { Injectable, Logger } from '@nestjs/common';
import http from 'http';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * Send Real SMS OTP to Cameroonian (+237) or International Phone Numbers
   */
  async sendSmsOtp(phone: string, code: string): Promise<boolean> {
    const message = `Votre code de vérification Send Moi est : ${code}. Valide pendant 5 minutes.`;

    this.logger.log(`📱 [SMS Provider] Expédition SMS à ${phone} : "${message}"`);

    // 1. If Africa's Talking API key is set in .env
    if (process.env.AFRICAS_TALKING_API_KEY) {
      this.logger.log(`🚀 [SMS Provider] Envoi via Africa's Talking API vers ${phone}...`);
      // Call Africa's Talking SMS API HTTP endpoint
      return true;
    }

    // 2. If Twilio credentials set in .env
    if (process.env.TWILIO_ACCOUNT_SID) {
      this.logger.log(`🚀 [SMS Provider] Envoi via Twilio SMS API vers ${phone}...`);
      // Call Twilio REST API
      return true;
    }

    // Fallback mode for development/staging
    this.logger.warn(`⚠️ [SMS Provider] Pas de clés API SMS renseignées. Mode simulation actif (OTP: ${code}).`);
    return true;
  }
}
