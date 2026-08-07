import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  /**
   * Send Real SMS OTP to Cameroonian (+237) or International Phone Numbers
   */
  async sendSmsOtp(phone: string, code: string): Promise<boolean> {
    const message = `Votre code de vérification Send Moi est : ${code}. Valide pendant 5 minutes.`;

    this.logger.log(`📱 [SMS Provider] Expédition SMS à ${phone}...`);

    // 1. Real integration via Africa's Talking SMS API (Primary Africa/Cameroon Provider)
    const apiKey = process.env.AFRICAS_TALKING_API_KEY;
    const username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';

    if (apiKey) {
      this.logger.log(`🚀 [SMS Provider] Envoi via Africa's Talking SMS API (${username}) vers ${phone}...`);
      try {
        const body = new URLSearchParams({
          username,
          to: phone,
          message,
        });

        const url = username === 'sandbox'
          ? 'https://api.sandbox.africastalking.com/version1/messaging'
          : 'https://api.africastalking.com/version1/messaging';

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'apiKey': apiKey,
            'Accept': 'application/json',
          },
          body: body.toString(),
        });

        if (response.ok) {
          this.logger.log(`✅ [SMS Provider] SMS délivré avec succès à ${phone}`);
          return true;
        } else {
          const errText = await response.text();
          this.logger.error(`❌ [SMS Provider] Échec envoi Africa's Talking (${response.status}): ${errText}`);
          return false;
        }
      } catch (err: any) {
        this.logger.error(`❌ [SMS Provider] Erreur réseau SMS: ${err.message}`);
        return false;
      }
    }

    // 2. Fallback mode for development/testing only
    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`ℹ️ [SMS Provider] Mode simulation développement actif pour ${phone}.`);
      return true;
    }

    this.logger.error(`❌ [SMS Provider] Clé API SMS absente en environnement non-dev. Envoi annulé.`);
    return false;
  }
}
